"""Measure a disposable model-state save in the new revision directory."""

import hashlib
import json
import time
from pathlib import Path

import timm
import torch

ROOT = Path(__file__).resolve().parents[2]
REV = Path(__file__).resolve().parent
CONFIG = json.loads((REV / "experiment_config.json").read_text(encoding="utf-8"))
CHECKPOINT = REV / "checkpoint_io_smoke.pth"
RESULT = REV / "checkpoint_io_benchmark.json"


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main():
    if CHECKPOINT.exists() or RESULT.exists():
        raise FileExistsError("Checkpoint I/O benchmark refuses to overwrite an existing artifact")
    model = timm.create_model(
        CONFIG["model"]["architecture"],
        pretrained=False,
        num_classes=CONFIG["model"]["num_classes"],
        img_size=CONFIG["model"]["image_size"],
    )
    started = time.perf_counter()
    with CHECKPOINT.open("xb") as stream:
        torch.save(model.state_dict(), stream)
        stream.flush()
    elapsed = time.perf_counter() - started
    report = {
        "status": "passed",
        "model": CONFIG["model"]["architecture"],
        "num_classes": CONFIG["model"]["num_classes"],
        "checkpoint_path": str(CHECKPOINT.relative_to(ROOT)),
        "checkpoint_size_bytes": CHECKPOINT.stat().st_size,
        "checkpoint_size_mib": CHECKPOINT.stat().st_size / 2**20,
        "save_seconds": elapsed,
        "sha256": sha256(CHECKPOINT),
        "weights_are_disposable_random_initialization": True,
        "source_data_read": False,
        "test_metadata_read": False,
    }
    with RESULT.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(report, stream, indent=2)
        stream.write("\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
