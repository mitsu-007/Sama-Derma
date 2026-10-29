"""Disposable validation-forward benchmark on the saved internal validation fold."""

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
OUT = REV / "validation_benchmark_including_decode.json"
WEIGHT_PATH = ROOT / CONFIG["model"]["initialization"]["verified_local_path"]
IMAGE_DIRS = [ROOT / "dataset" / "DATASET_0", ROOT / "dataset" / "DATASET_1"]


def gpu_used_total():
    try:
        line = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=memory.used,memory.total", "--format=csv,noheader,nounits"],
            text=True, stderr=subprocess.DEVNULL, timeout=2,
        ).splitlines()[0]
        return tuple(int(x.strip()) for x in line.split(","))
    except Exception:
        return None


class ValidationSlice(Dataset):
    def __init__(self):
        manifest = pd.read_csv(ROOT / CONFIG["data"]["split_manifest"])
        self.rows = manifest.loc[manifest["partition"] == "validation"].head(40).reset_index(drop=True)
        self.labels = {label: i for i, label in enumerate(CONFIG["model"]["label_order"])}
        self.paths = []
        for filename in self.rows["Image_name"].astype(str):
            matches = [directory / filename for directory in IMAGE_DIRS if (directory / filename).is_file()]
            if len(matches) != 1:
                raise FileNotFoundError(f"Expected one validation image for {filename}; found {len(matches)}")
            self.paths.append(matches[0])
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
        raise FileExistsError(f"Refusing to overwrite benchmark artifact: {OUT}")
    digest = hashlib.sha256(WEIGHT_PATH.read_bytes()).hexdigest()
    if digest.lower() != CONFIG["model"]["initialization"]["verified_sha256"].lower():
        raise RuntimeError("Pretrained SHA-256 verification failed")
    result = {
        "status": "failed",
        "validation_split_only": True,
        "test_metadata_read": False,
        "weights_saved": False,
        "initial_total_gpu_memory_mib": gpu_used_total(),
        "pretrained_sha256": digest,
    }
    samples = []
    stop = threading.Event()

    def monitor():
        while not stop.is_set():
            sample = gpu_used_total()
            if sample is not None:
                samples.append(sample)
            stop.wait(0.2)

    thread = threading.Thread(target=monitor, daemon=True)
    try:
        if not torch.cuda.is_available():
            raise RuntimeError("CUDA unavailable")
        free, total = torch.cuda.mem_get_info()
        if free / 2**30 < 4.5:
            raise RuntimeError(f"Only {free / 2**30:.3f} GiB free before validation benchmark")
        dataset = ValidationSlice()
        loader = DataLoader(dataset, batch_size=1, shuffle=False, num_workers=0)
        checkpoint = torch.load(WEIGHT_PATH, map_location="cpu", weights_only=True)
        model = timm.create_model(
            CONFIG["model"]["architecture"], pretrained=False,
            num_classes=CONFIG["model"]["num_classes"], img_size=CONFIG["model"]["image_size"],
        )
        state = checkpoint_filter_fn(checkpoint["model"], model)
        state.pop("head.fc.weight", None)
        state.pop("head.fc.bias", None)
        loaded = model.load_state_dict(state, strict=False)
        if set(loaded.missing_keys) != {"head.fc.weight", "head.fc.bias"} or loaded.unexpected_keys:
            raise RuntimeError(f"Unexpected checkpoint compatibility: {loaded}")
        del checkpoint, state
        model = model.cuda().eval()
        iterator = iter(loader)
        timings = []
        thread.start()
        torch.cuda.reset_peak_memory_stats()
        started = time.perf_counter()
        with torch.inference_mode():
            for step in range(32):
                t0 = time.perf_counter()
                try:
                    images, _ = next(iterator)
                except StopIteration:
                    iterator = iter(loader)
                    images, _ = next(iterator)
                images = images.cuda()
                with torch.autocast(device_type="cuda", dtype=torch.float16):
                    _ = model(images)
                torch.cuda.synchronize()
                if step >= 8:
                    timings.append(time.perf_counter() - t0)
        elapsed = time.perf_counter() - started
        stop.set()
        thread.join(timeout=3)
        result.update({
            "status": "passed",
            "device": torch.cuda.get_device_name(0),
            "validation_microbatch": 1,
            "warmup_images": 8,
            "measured_images": 24,
            "mean_seconds_per_validation_image_including_decode": statistics.mean(timings),
            "std_seconds_per_validation_image_including_decode": statistics.stdev(timings),
            "images_per_second_including_decode": 1 / statistics.mean(timings),
            "peak_allocated_gib": torch.cuda.max_memory_allocated() / 2**30,
            "peak_reserved_gib": torch.cuda.max_memory_reserved() / 2**30,
            "peak_total_gpu_used_mib_nvidia_smi": max((used for used, _ in samples), default=None),
            "minimum_total_gpu_free_mib_nvidia_smi": min((cap-used for used, cap in samples), default=None),
            "gpu_total_memory_mib_nvidia_smi": max((cap for _, cap in samples), default=None),
            "gpu_memory_samples": len(samples),
            "startup_free_bytes": int(free),
            "cuda_total_bytes": int(total),
            "benchmark_elapsed_seconds": elapsed,
            "notes": "Validation transform, batch 1, inference_mode, fp16 autocast. Timed interval includes fetching/decoding and model forward; metric handling overhead remains to be added.",
        })
    except Exception as exc:
        result["error"] = f"{type(exc).__name__}: {exc}"
        result["gpu_samples_mib"] = samples
        raise
    finally:
        stop.set()
        if thread.is_alive():
            thread.join(timeout=3)
        with OUT.open("x", encoding="utf-8", newline="\n") as handle:
            json.dump(result, handle, indent=2)
            handle.write("\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
