"""Short disposable Swin training-throughput smoke test; saves no model weights."""

import csv
import json
import statistics
import time
from pathlib import Path

import timm
import torch
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms


ROOT = Path(__file__).resolve().parents[1]
OUT_PATH = Path(__file__).resolve().parent / "smoke_benchmark.json"
TRAIN_CSV = ROOT / "data" / "metadata" / "train_split-1.csv"
IMAGE_DIRS = [ROOT / "dataset" / "DATASET_0", ROOT / "dataset" / "DATASET_1"]
SEED = 20261026
BATCH_SIZE = 2
WARMUP_STEPS = 2
MEASURED_STEPS = 5
IMAGE_SIZE = 512


class SmallTrainingOnlyDataset(Dataset):
    def __init__(self) -> None:
        with TRAIN_CSV.open("r", encoding="utf-8-sig", newline="") as handle:
            rows = list(csv.DictReader(handle))
        self.labels = sorted({row["Main_class"].strip() for row in rows if row.get("Main_class", "").strip()})
        self.label_to_idx = {label: index for index, label in enumerate(self.labels)}
        self.rows = rows[: max(32, (WARMUP_STEPS + MEASURED_STEPS) * BATCH_SIZE)]
        self.paths = []
        for row in self.rows:
            name = row["Image_name"].strip()
            path = next((directory / name for directory in IMAGE_DIRS if (directory / name).is_file()), None)
            if path is None:
                raise FileNotFoundError(f"Training image not found: {name}")
            self.paths.append(path)
        self.transform = transforms.Compose([
            transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(15),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.53749797, 0.45875554, 0.40382471],
                std=[0.21629889, 0.20366619, 0.20136241],
            ),
        ])

    def __len__(self) -> int:
        return len(self.rows)

    def __getitem__(self, index: int):
        row = self.rows[index]
        with Image.open(self.paths[index]) as image:
            tensor = self.transform(image.convert("RGB"))
        target = self.label_to_idx[row["Main_class"].strip()]
        return tensor, target


def main() -> None:
    if OUT_PATH.exists():
        raise FileExistsError("Benchmark output already exists; refusing to overwrite it.")
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA is not available; GPU benchmark cannot run.")

    torch.manual_seed(SEED)
    torch.cuda.manual_seed_all(SEED)
    device = torch.device("cuda")
    dataset = SmallTrainingOnlyDataset()
    loader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    batches = iter(loader)
    labels = dataset.labels
    model = timm.create_model(
        "swin_base_patch4_window12_384",
        pretrained=False,
        num_classes=len(labels),
        img_size=IMAGE_SIZE,
    ).to(device)
    model.train()
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-4)
    scaler = torch.amp.GradScaler("cuda")
    criterion = torch.nn.CrossEntropyLoss(label_smoothing=0.1)
    step_seconds = []
    losses = []
    torch.cuda.reset_peak_memory_stats(device)

    for step in range(WARMUP_STEPS + MEASURED_STEPS):
        try:
            images, targets = next(batches)
        except StopIteration:
            batches = iter(loader)
            images, targets = next(batches)
        images = images.to(device, non_blocking=False)
        targets = targets.to(device, non_blocking=False)
        optimizer.zero_grad(set_to_none=True)
        start = time.perf_counter()
        with torch.autocast(device_type="cuda", dtype=torch.float16):
            logits = model(images)
            loss = criterion(logits, targets)
        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()
        torch.cuda.synchronize(device)
        elapsed = time.perf_counter() - start
        losses.append(float(loss.detach().cpu()))
        if step >= WARMUP_STEPS:
            step_seconds.append(elapsed)

    stats = {
        "benchmark": "disposable one-process Swin Base training smoke test",
        "seed": SEED,
        "training_metadata_only": True,
        "test_metadata_read": False,
        "pretrained": False,
        "weights_saved": False,
        "architecture": "swin_base_patch4_window12_384",
        "image_size": IMAGE_SIZE,
        "batch_size": BATCH_SIZE,
        "precision": "fp16 autocast with GradScaler; fp32 model parameters",
        "warmup_steps": WARMUP_STEPS,
        "measured_steps": MEASURED_STEPS,
        "median_step_seconds": statistics.median(step_seconds),
        "mean_step_seconds": statistics.mean(step_seconds),
        "measured_loss_range": [min(losses[WARMUP_STEPS:]), max(losses[WARMUP_STEPS:])],
        "peak_allocated_gib": torch.cuda.max_memory_allocated(device) / 2**30,
        "peak_reserved_gib": torch.cuda.max_memory_reserved(device) / 2**30,
        "device": torch.cuda.get_device_name(0),
        "torch": torch.__version__,
        "timm": timm.__version__,
        "torchvision": __import__("torchvision").__version__,
        "data_loader_workers": 0,
        "notes": "Timing includes image decode/transforms and training step, excludes model construction; short sample is not a full-epoch guarantee.",
    }
    with OUT_PATH.open("x", encoding="utf-8", newline="\n") as handle:
        json.dump(stats, handle, indent=2)
        handle.write("\n")
    print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()
