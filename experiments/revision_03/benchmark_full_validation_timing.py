"""Time one complete internal validation pass; do not save or score predictions."""

import hashlib
import json
import statistics
import subprocess
import threading
import time
from pathlib import Path

import pandas as pd
import timm
import torch
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms
from timm.models.swin_transformer import checkpoint_filter_fn

ROOT = Path(__file__).resolve().parents[2]
REV = Path(__file__).resolve().parent
CONFIG = json.loads((REV / "experiment_config.json").read_text(encoding="utf-8"))
OUT = REV / "full_validation_timing.json"
WEIGHT = ROOT / CONFIG["model"]["initialization"]["verified_local_path"]
IMAGE_DIRS = [ROOT / "dataset" / "DATASET_0", ROOT / "dataset" / "DATASET_1"]


def device_memory():
    try:
        line = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=memory.used,memory.total", "--format=csv,noheader,nounits"],
            text=True, stderr=subprocess.DEVNULL, timeout=2,
        ).splitlines()[0]
        return tuple(int(part.strip()) for part in line.split(","))
    except Exception:
        return None


class InternalValidation(Dataset):
    def __init__(self):
        manifest = pd.read_csv(ROOT / CONFIG["data"]["split_manifest"])
        self.rows = manifest.loc[manifest["partition"] == "validation"].reset_index(drop=True)
        self.labels = {name: i for i, name in enumerate(CONFIG["model"]["label_order"])}
        self.paths = []
        for name in self.rows["Image_name"].astype(str):
            found = [directory / name for directory in IMAGE_DIRS if (directory / name).is_file()]
            if len(found) != 1:
                raise FileNotFoundError(f"Expected one validation image for {name}; found {len(found)}")
            self.paths.append(found[0])
        self.transform = transforms.Compose([
            transforms.Resize((CONFIG["model"]["image_size"], CONFIG["model"]["image_size"])),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.53749797, 0.45875554, 0.40382471],
                std=[0.21629889, 0.20366619, 0.20136241],
            ),
        ])

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, index):
        row = self.rows.iloc[index]
        with Image.open(self.paths[index]) as image:
            pixels = self.transform(image.convert("RGB"))
        return pixels, self.labels[str(row["Main_class"]).strip()]


def main():
    if OUT.exists():
        raise FileExistsError(f"Refusing to overwrite {OUT}")
    digest = hashlib.sha256(WEIGHT.read_bytes()).hexdigest()
    if digest.lower() != CONFIG["model"]["initialization"]["verified_sha256"].lower():
        raise RuntimeError("Pretrained SHA-256 verification failed")
    result = {
        "status": "failed",
        "purpose": "throughput only; no validation metrics or predictions retained",
        "validation_rows_timed": 0,
        "test_metadata_read": False,
        "pretrained_sha256": digest,
        "initial_total_gpu_memory_mib": device_memory(),
    }
    memory_samples = []
    stop = threading.Event()

    def monitor():
        while not stop.is_set():
            sample = device_memory()
            if sample is not None:
                memory_samples.append(sample)
            stop.wait(0.2)

    monitor_thread = threading.Thread(target=monitor, daemon=True)
    try:
        if not torch.cuda.is_available():
            raise RuntimeError("CUDA is unavailable")
        free, total = torch.cuda.mem_get_info()
        if free / 2**30 < 4.5:
            raise RuntimeError(f"Only {free / 2**30:.3f} GiB free before benchmark")
        data = InternalValidation()
        loader = DataLoader(data, batch_size=1, shuffle=False, num_workers=0)
        source = torch.load(WEIGHT, map_location="cpu", weights_only=True)
        model = timm.create_model(
            CONFIG["model"]["architecture"], pretrained=False,
            num_classes=CONFIG["model"]["num_classes"], img_size=CONFIG["model"]["image_size"],
        )
        state = checkpoint_filter_fn(source["model"], model)
        state.pop("head.fc.weight", None)
        state.pop("head.fc.bias", None)
        loaded = model.load_state_dict(state, strict=False)
        if set(loaded.missing_keys) != {"head.fc.weight", "head.fc.bias"} or loaded.unexpected_keys:
            raise RuntimeError(f"Unexpected pretrained load: {loaded}")
        del source, state
        model = model.cuda().eval()
        iterator = iter(loader)
        # Warm up eight rows, then time a full pass through the complete saved validation fold.
        with torch.inference_mode():
            for _ in range(8):
                pixels, _ = next(iterator)
                with torch.autocast(device_type="cuda", dtype=torch.float16):
                    model(pixels.cuda())
            torch.cuda.synchronize()
            iterator = iter(loader)
            elapsed_per_image = []
            monitor_thread.start()
            torch.cuda.reset_peak_memory_stats()
            started = time.perf_counter()
            for _ in range(len(data)):
                tick = time.perf_counter()
                pixels, _ = next(iterator)
                with torch.autocast(device_type="cuda", dtype=torch.float16):
                    _ = model(pixels.cuda())
                torch.cuda.synchronize()
                elapsed_per_image.append(time.perf_counter() - tick)
            total_elapsed = time.perf_counter() - started
        stop.set()
        monitor_thread.join(timeout=3)
        result.update({
            "status": "passed",
            "validation_rows_timed": len(elapsed_per_image),
            "device": torch.cuda.get_device_name(0),
            "microbatch_size": 1,
            "warmup_images": 8,
            "total_elapsed_seconds": total_elapsed,
            "mean_seconds_per_image_including_decode": statistics.mean(elapsed_per_image),
            "median_seconds_per_image_including_decode": statistics.median(elapsed_per_image),
            "std_seconds_per_image_including_decode": statistics.stdev(elapsed_per_image),
            "p90_seconds_per_image_including_decode": sorted(elapsed_per_image)[int(0.9 * (len(elapsed_per_image)-1))],
            "images_per_second_including_decode": len(elapsed_per_image) / total_elapsed,
            "peak_allocated_gib": torch.cuda.max_memory_allocated() / 2**30,
            "peak_reserved_gib": torch.cuda.max_memory_reserved() / 2**30,
            "peak_total_gpu_used_mib_nvidia_smi": max((used for used, _ in memory_samples), default=None),
            "minimum_total_gpu_free_mib_nvidia_smi": min((cap-used for used, cap in memory_samples), default=None),
            "gpu_total_memory_mib_nvidia_smi": max((cap for _, cap in memory_samples), default=None),
            "gpu_memory_samples": len(memory_samples),
            "startup_cuda_free_bytes": int(free),
            "cuda_total_bytes": int(total),
            "predictions_or_metrics_saved": False,
        })
    except Exception as exc:
        result["error"] = f"{type(exc).__name__}: {exc}"
        result["gpu_memory_samples"] = memory_samples
        raise
    finally:
        stop.set()
        if monitor_thread.is_alive():
            monitor_thread.join(timeout=3)
        with OUT.open("x", encoding="utf-8", newline="\n") as stream:
            json.dump(result, stream, indent=2)
            stream.write("\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
