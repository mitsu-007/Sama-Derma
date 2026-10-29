"""Disposable training benchmark for protocol revision 2; saves no weights."""

from __future__ import annotations

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
OUT = REV / "benchmark_results_long.json"
IMAGE_DIRS = [ROOT / "dataset" / "DATASET_0", ROOT / "dataset" / "DATASET_1"]
WEIGHT_PATH = ROOT / CONFIG["model"]["initialization"]["verified_local_path"]
SEED = int(CONFIG["seed"])


def nvidia_memory_mib() -> tuple[int, int] | None:
    try:
        raw = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=memory.used,memory.total", "--format=csv,noheader,nounits"],
            text=True,
            stderr=subprocess.DEVNULL,
            timeout=2,
        ).splitlines()[0]
        used, total = (int(value.strip()) for value in raw.split(","))
        return used, total
    except Exception:
        return None


class TrainingSlice(Dataset):
    def __init__(self) -> None:
        manifest = pd.read_csv(ROOT / CONFIG["data"]["split_manifest"])
        self.rows = manifest.loc[manifest["partition"] == "train"].head(96).reset_index(drop=True)
        labels = list(CONFIG["model"]["label_order"])
        self.label_to_index = {label: i for i, label in enumerate(labels)}
        self.paths = []
        for filename in self.rows["Image_name"].astype(str):
            found = [directory / filename for directory in IMAGE_DIRS if (directory / filename).is_file()]
            if len(found) != 1:
                raise FileNotFoundError(f"Expected one training image for {filename}; found {len(found)}")
            self.paths.append(found[0])
        self.transform = transforms.Compose([
            transforms.Resize((CONFIG["model"]["image_size"], CONFIG["model"]["image_size"])),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(15),
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
        return pixels, self.label_to_index[str(row["Main_class"]).strip()]


def main() -> None:
    if OUT.exists():
        raise FileExistsError(f"Refusing to overwrite benchmark artifact: {OUT}")
    baseline = nvidia_memory_mib()
    result = {
        "protocol_revision": 2,
        "benchmark": "pretrained Swin-B, training transforms, microbatch 1 / accumulation 8",
        "weights_saved": False,
        "test_metadata_read": False,
        "initial_total_gpu_memory_mib": baseline,
        "status": "failed",
    }
    digest = hashlib.sha256()
    with WEIGHT_PATH.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    result["pretrained_sha256_verified"] = digest.hexdigest()
    if result["pretrained_sha256_verified"].lower() != CONFIG["model"]["initialization"]["verified_sha256"].lower():
        raise RuntimeError("Pretrained SHA-256 differs from the frozen configuration")
    monitor_samples = []
    monitor_stop = threading.Event()

    def monitor():
        while not monitor_stop.is_set():
            sample = nvidia_memory_mib()
            if sample is not None:
                monitor_samples.append(sample)
            monitor_stop.wait(0.2)

    monitor_thread = threading.Thread(target=monitor, daemon=True)
    try:
        if not torch.cuda.is_available():
            raise RuntimeError("CUDA unavailable")
        free, total = torch.cuda.mem_get_info()
        result["initial_cuda_free_bytes"] = int(free)
        result["cuda_total_bytes"] = int(total)
        if free / 2**30 < 4.5:
            raise RuntimeError(f"Only {free / 2**30:.3f} GiB free before benchmark; require at least 4.5 GiB")
        dataset = TrainingSlice()
        loader = DataLoader(dataset, batch_size=1, shuffle=False, num_workers=0)
        checkpoint = torch.load(WEIGHT_PATH, map_location="cpu", weights_only=True)
        model = timm.create_model(
            CONFIG["model"]["architecture"], pretrained=False,
            num_classes=CONFIG["model"]["num_classes"], img_size=CONFIG["model"]["image_size"],
        )
        state = checkpoint_filter_fn(checkpoint["model"], model)
        state.pop("head.fc.weight", None)
        state.pop("head.fc.bias", None)
        load_result = model.load_state_dict(state, strict=False)
        if set(load_result.missing_keys) != {"head.fc.weight", "head.fc.bias"} or load_result.unexpected_keys:
            raise RuntimeError(f"Unexpected checkpoint load result: {load_result}")
        del checkpoint, state
        torch.manual_seed(SEED)
        torch.cuda.manual_seed_all(SEED)
        model = model.cuda().train()
        optimizer = torch.optim.AdamW(
            model.parameters(),
            lr=CONFIG["common_training"]["learning_rate"],
            weight_decay=CONFIG["common_training"]["weight_decay"],
        )
        scaler = torch.amp.GradScaler("cuda")
        criterion = torch.nn.CrossEntropyLoss(label_smoothing=0.1)
        iterator = iter(loader)
        group_seconds = []
        sample_count = 0
        optimizer_steps = 0
        losses = []
        monitor_thread.start()
        torch.cuda.reset_peak_memory_stats()
        benchmark_start = time.perf_counter()

        # One warm-up optimizer update, then ten timed updates, each over 8 one-image microbatches.
        for group in range(11):
            optimizer.zero_grad(set_to_none=True)
            group_start = time.perf_counter()
            group_loss = 0.0
            for _ in range(8):
                try:
                    images, targets = next(iterator)
                except StopIteration:
                    iterator = iter(loader)
                    images, targets = next(iterator)
                images = images.cuda()
                targets = targets.cuda()
                with torch.autocast(device_type="cuda", dtype=torch.float16):
                    logits = model(images)
                    loss = criterion(logits, targets)
                scaler.scale(loss / 8).backward()
                group_loss += float(loss.detach().item())
                sample_count += 1
            scaler.step(optimizer)
            scaler.update()
            optimizer_steps += 1
            optimizer.zero_grad(set_to_none=True)
            torch.cuda.synchronize()
            elapsed = time.perf_counter() - group_start
            losses.append(group_loss / 8)
            if group > 0:
                group_seconds.append(elapsed)

        monitor_stop.set()
        monitor_thread.join(timeout=3)
        torch.cuda.synchronize()
        total_samples = [used for used, _ in monitor_samples]
        total_caps = [cap for _, cap in monitor_samples]
        result.update({
            "status": "passed",
            "device": torch.cuda.get_device_name(0),
            "torch": torch.__version__,
            "timm": timm.__version__,
            "torchvision": __import__("torchvision").__version__,
            "architecture": CONFIG["model"]["architecture"],
            "image_size": CONFIG["model"]["image_size"],
            "pretrained_sha256": CONFIG["model"]["initialization"]["verified_sha256"],
            "microbatch_size": 1,
            "accumulation_steps": 8,
            "effective_batch_size": 8,
            "warmup_optimizer_updates": 1,
            "measured_optimizer_updates": len(group_seconds),
            "measured_images": 8 * len(group_seconds),
            "mean_seconds_per_8_image_update": statistics.mean(group_seconds),
            "std_seconds_per_8_image_update": statistics.stdev(group_seconds),
            "mean_seconds_per_image": statistics.mean(group_seconds) / 8,
            "images_per_second": 8 / statistics.mean(group_seconds),
            "median_seconds_per_image": statistics.median(group_seconds) / 8,
            "losses_by_update_including_warmup": losses,
            "optimizer_steps_observed": optimizer_steps,
            "peak_allocated_gib": torch.cuda.max_memory_allocated() / 2**30,
            "peak_reserved_gib": torch.cuda.max_memory_reserved() / 2**30,
            "peak_total_gpu_used_mib_nvidia_smi": max(total_samples) if total_samples else None,
            "minimum_total_gpu_free_mib_nvidia_smi": min((cap-used for used, cap in monitor_samples), default=None),
            "gpu_total_memory_mib_nvidia_smi": max(total_caps) if total_caps else None,
            "gpu_memory_samples": len(monitor_samples),
            "elapsed_including_warmup_seconds": time.perf_counter() - benchmark_start,
            "notes": "Ten timed 8-image optimizer updates after one warm-up update; timing includes image decode/transforms. Total GPU usage sampled every 0.2 s and includes desktop processes. No checkpoint or output weights saved.",
        })
    except Exception as exc:
        result["error"] = f"{type(exc).__name__}: {exc}"
        result["total_gpu_samples_mib"] = monitor_samples
        raise
    finally:
        monitor_stop.set()
        if monitor_thread.is_alive():
            monitor_thread.join(timeout=3)
        with OUT.open("x", encoding="utf-8", newline="\n") as handle:
            json.dump(result, handle, indent=2)
            handle.write("\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
