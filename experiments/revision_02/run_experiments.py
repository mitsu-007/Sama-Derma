"""Run the two frozen Swin arms; never reads the official test split."""

from __future__ import annotations

import csv
import argparse
import hashlib
import json
import math
import random
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import timm
import torch
from PIL import Image
from sklearn.metrics import confusion_matrix
from timm.models.swin_transformer import checkpoint_filter_fn
from torch.utils.data import DataLoader, Dataset, WeightedRandomSampler
from torchvision import transforms


ROOT = Path(__file__).resolve().parents[2]
EXPERIMENTS = Path(__file__).resolve().parent
CONFIG_PATH = EXPERIMENTS / "experiment_config.json"
CONFIG = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
TRAIN_CSV = ROOT / CONFIG["data"]["training_metadata"]
MANIFEST_CSV = ROOT / CONFIG["data"]["split_manifest"]
SPLIT_SUMMARY = ROOT / CONFIG["data"]["split_summary"]
PRETRAINED_PATH = ROOT / CONFIG["model"]["initialization"]["verified_local_path"]
RUNS_DIR = EXPERIMENTS / "runs_revision_02"
SEED = int(CONFIG["seed"])
LABELS = list(CONFIG["model"]["label_order"])
LABEL_TO_INDEX = {label: i for i, label in enumerate(LABELS)}
IMAGE_DIRS = [ROOT / "dataset" / "DATASET_0", ROOT / "dataset" / "DATASET_1"]
IMAGE_SIZE = int(CONFIG["model"]["image_size"])
BATCH_SIZE = int(CONFIG["common_training"]["batch_size"])
ACCUMULATION_STEPS = int(CONFIG["common_training"]["gradient_accumulation_steps"])
EPOCHS_MAX = int(CONFIG["common_training"]["epochs_max"])
PATIENCE = int(CONFIG["validation"]["early_stopping_patience_epochs"])
MIN_DELTA = float(CONFIG["validation"]["minimum_macro_f1_improvement"])
WEIGHT_DECAY = float(CONFIG["common_training"]["weight_decay"])
LEARNING_RATE = float(CONFIG["common_training"]["learning_rate"])
WEIGHT_SHA256 = CONFIG["model"]["initialization"]["verified_sha256"]
TOTAL_BUDGET_SECONDS = int(CONFIG.get("runtime_budget_hours", 6.0) * 60 * 60)
MIN_FREE_VRAM_GIB = 4.5
MAX_RESERVED_VRAM_GIB = 5.2


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def write_json(path: Path, obj: Any) -> None:
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


class DermaRows(Dataset):
    def __init__(self, rows: pd.DataFrame, training: bool):
        self.rows = rows.reset_index(drop=True).copy()
        self.training = training
        self.paths = []
        for filename in self.rows["Image_name"].astype(str):
            matches = [directory / filename for directory in IMAGE_DIRS if (directory / filename).is_file()]
            if len(matches) != 1:
                raise FileNotFoundError(f"Expected one training/validation image for {filename}, found {len(matches)}")
            self.paths.append(matches[0])
        operations = [transforms.Resize((IMAGE_SIZE, IMAGE_SIZE))]
        if training:
            operations.extend([transforms.RandomHorizontalFlip(), transforms.RandomRotation(15)])
        operations.extend([
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.53749797, 0.45875554, 0.40382471],
                std=[0.21629889, 0.20366619, 0.20136241],
            ),
        ])
        self.transform = transforms.Compose(operations)

    def __len__(self) -> int:
        return len(self.rows)

    def __getitem__(self, index: int):
        row = self.rows.iloc[index]
        with Image.open(self.paths[index]) as image:
            image_tensor = self.transform(image.convert("RGB"))
        target = LABEL_TO_INDEX[str(row["Main_class"]).strip()]
        return image_tensor, target, index


def load_training_only_partitions() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    if sha256_file(TRAIN_CSV).lower() != CONFIG["data"]["training_metadata_sha256"].lower():
        raise RuntimeError("Training metadata checksum differs from the frozen experiment configuration.")
    original = pd.read_csv(TRAIN_CSV, dtype={"Subject_ID": "string"})
    original.insert(0, "source_row_index", np.arange(len(original)))
    manifest = pd.read_csv(MANIFEST_CSV, dtype={"Subject_ID": "string"})
    required_manifest = {"source_row_index", "Image_name", "Subject_ID", "Main_class", "Fitzpatrick", "partition"}
    if required_manifest - set(manifest.columns):
        raise RuntimeError("Saved split manifest is missing required columns.")
    if len(manifest) != len(original) or manifest["Image_name"].duplicated().any():
        raise RuntimeError("Saved split manifest does not cover each training image exactly once.")
    merged = original.merge(
        manifest[["source_row_index", "Image_name", "Subject_ID", "Main_class", "Fitzpatrick", "partition"]],
        on=["source_row_index", "Image_name", "Subject_ID", "Main_class", "Fitzpatrick"],
        how="outer",
        validate="one_to_one",
        indicator=True,
        suffixes=("", "_manifest"),
    )
    if not (merged["_merge"] == "both").all():
        raise RuntimeError("Split manifest rows do not match the source training CSV.")
    summary = json.loads(SPLIT_SUMMARY.read_text(encoding="utf-8"))
    train_rows = merged[merged["partition"] == "train"].drop(columns=["_merge"]).reset_index(drop=True)
    val_rows = merged[merged["partition"] == "validation"].drop(columns=["_merge"]).reset_index(drop=True)
    if len(train_rows) != summary["training_rows"] or len(val_rows) != summary["validation_rows"]:
        raise RuntimeError("Saved split row counts do not match its summary.")
    if set(train_rows["Subject_ID"]) & set(val_rows["Subject_ID"]):
        raise RuntimeError("Subject overlap found between training and validation.")
    if set(train_rows["Image_name"]) & set(val_rows["Image_name"]):
        raise RuntimeError("Image overlap found between training and validation.")
    observed_labels = sorted(set(original["Main_class"].dropna().astype(str)))
    if observed_labels != sorted(LABELS):
        raise RuntimeError("Training labels differ from the frozen output-label list.")
    return train_rows, val_rows, original


def sample_weights(rows: pd.DataFrame, arm: str) -> tuple[torch.Tensor, dict[str, Any]]:
    class_counts = rows["Main_class"].value_counts().to_dict()
    base = np.array([1.0 / class_counts[label] for label in rows["Main_class"]], dtype=np.float64)
    if arm == "A_standard_class_balanced":
        weights = base
        cell_report: dict[str, Any] = {}
    else:
        working = rows[["Main_class", "Fitzpatrick", "Subject_ID"]].copy()
        working["Fitzpatrick"] = working["Fitzpatrick"].fillna("<missing>").astype(str)
        counts = working.groupby(["Main_class", "Fitzpatrick"], dropna=False).agg(
            images=("Subject_ID", "size"), subjects=("Subject_ID", "nunique")
        )
        q_values = np.ones(len(rows), dtype=np.float64)
        cell_report = {}
        for i, (diagnosis, tone) in enumerate(zip(working["Main_class"], working["Fitzpatrick"])):
            cell = counts.loc[(diagnosis, tone)]
            eligible = tone != "<missing>" and int(cell["subjects"]) >= int(
                CONFIG["arms"][arm]["eligibility_minimum_unique_subjects_per_diagnosis_tone_cell"]
            )
            if eligible:
                ratio = class_counts[diagnosis] / int(cell["images"])
                q_values[i] = min(3.0, max(1.0, math.sqrt(ratio)))
            key = f"{diagnosis}|{tone}"
            cell_report[key] = {
                "images": int(cell["images"]),
                "subjects": int(cell["subjects"]),
                "eligible": bool(eligible),
                "q": float(q_values[i]),
            }
        raw = base * q_values
        weights = raw.copy()
        labels_array = rows["Main_class"].to_numpy()
        for diagnosis in class_counts:
            mask = labels_array == diagnosis
            weights[mask] = raw[mask] / raw[mask].sum()
        # Arm A also has unit sampler mass per diagnosis (1/n_y for n_y rows).
        if not np.all(np.isfinite(weights)) or np.any(weights <= 0):
            raise RuntimeError("Invalid reweighted sampler weights.")

    # Normalize Arm A equivalently so each diagnosis has unit sampler mass.
    if arm == "A_standard_class_balanced":
        labels_array = rows["Main_class"].to_numpy()
        weights = base.copy()
        for diagnosis in class_counts:
            mask = labels_array == diagnosis
            weights[mask] = weights[mask] / weights[mask].sum()
    return torch.as_tensor(weights, dtype=torch.double), {
        "class_image_counts_training_only": {str(k): int(v) for k, v in class_counts.items()},
        "diagnosis_fitzpatrick_cells_training_only": cell_report,
        "sampler_mass_by_diagnosis": {
            diagnosis: float(weights[rows["Main_class"].to_numpy() == diagnosis].sum())
            for diagnosis in class_counts
        },
        "weight_min": float(weights.min()),
        "weight_max": float(weights.max()),
    }


def metrics_from_predictions(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, Any]:
    cm = confusion_matrix(y_true, y_pred, labels=np.arange(len(LABELS)))
    per_class = {}
    for i, label in enumerate(LABELS):
        tp = int(cm[i, i])
        support = int(cm[i, :].sum())
        predicted = int(cm[:, i].sum())
        precision = tp / predicted if predicted else 0.0
        recall = tp / support if support else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        per_class[label] = {"precision": precision, "recall": recall, "f1": f1, "support": support}
    macro_f1 = float(np.mean([v["f1"] for v in per_class.values()]))
    return {
        "accuracy": float(np.trace(cm) / max(int(cm.sum()), 1)),
        "macro_f1": macro_f1,
        "per_class": per_class,
        "confusion_matrix": cm.tolist(),
        "n": int(cm.sum()),
    }


def add_subgroup_metrics(metrics: dict[str, Any], y_true: np.ndarray, y_pred: np.ndarray, tones: list[str]) -> None:
    tone_metrics = {}
    diagnosis_tone = {}
    for tone in sorted(set(tones)):
        mask = np.array([value == tone for value in tones])
        group_metrics = metrics_from_predictions(y_true[mask], y_pred[mask])
        tone_metrics[tone] = {
            "n": group_metrics["n"],
            "accuracy": group_metrics["accuracy"],
            "macro_f1_all_8": group_metrics["macro_f1"],
        }
    for diagnosis in LABELS:
        for tone in sorted(set(tones)):
            mask = np.array([(LABELS[true] == diagnosis and observed_tone == tone) for true, observed_tone in zip(y_true, tones)])
            n = int(mask.sum())
            if n:
                correct = int((y_true[mask] == y_pred[mask]).sum())
                diagnosis_tone[f"{diagnosis}|{tone}"] = {
                    "support": n,
                    "correct": correct,
                    "recall": correct / n,
                }
    p3 = diagnosis_tone.get("Pigmentary Disorders|FST 3")
    p5 = diagnosis_tone.get("Pigmentary Disorders|FST 5")
    metrics["fitzpatrick_group_metrics"] = tone_metrics
    metrics["diagnosis_fitzpatrick_recall"] = diagnosis_tone
    metrics["pigmentary_fst3_fst5"] = {
        "FST 3": p3,
        "FST 5": p5,
        "recall_difference_FST3_minus_FST5": (
            p3["recall"] - p5["recall"] if p3 and p5 else None
        ),
    }


def validation_pass(model: torch.nn.Module, loader: DataLoader, rows: pd.DataFrame, criterion: torch.nn.Module):
    model.eval()
    all_true: list[int] = []
    all_pred: list[int] = []
    all_conf: list[float] = []
    all_prob: list[list[float]] = []
    loss_sum = 0.0
    with torch.inference_mode():
        for images, targets, _ in loader:
            images = images.cuda(non_blocking=False)
            targets = targets.cuda(non_blocking=False)
            with torch.autocast(device_type="cuda", dtype=torch.float16):
                logits = model(images)
                loss = criterion(logits, targets)
            probabilities = torch.softmax(logits.float(), dim=1)
            prediction = probabilities.argmax(dim=1)
            loss_sum += float(loss.item()) * len(targets)
            all_true.extend(targets.cpu().tolist())
            all_pred.extend(prediction.cpu().tolist())
            all_conf.extend(probabilities.max(dim=1).values.cpu().tolist())
            all_prob.extend(probabilities.cpu().tolist())
    y_true = np.asarray(all_true, dtype=np.int64)
    y_pred = np.asarray(all_pred, dtype=np.int64)
    metrics = metrics_from_predictions(y_true, y_pred)
    metrics["cross_entropy_loss"] = loss_sum / len(rows)
    tones = rows["Fitzpatrick"].fillna("Missing").astype(str).tolist()
    add_subgroup_metrics(metrics, y_true, y_pred, tones)
    prediction_rows = []
    for i, row in rows.reset_index(drop=True).iterrows():
        prediction_rows.append({
            "Image_name": row["Image_name"],
            "Subject_ID": row["Subject_ID"],
            "True_class": LABELS[y_true[i]],
            "Predicted_class": LABELS[y_pred[i]],
            "Predicted_score": all_conf[i],
            "Fitzpatrick": tones[i],
            "Correct": int(y_true[i] == y_pred[i]),
            **{f"prob_{j}": all_prob[i][j] for j in range(len(LABELS))},
        })
    return metrics, prediction_rows


def checkpoint_filter_and_load(model: torch.nn.Module, pretrained_state: dict[str, torch.Tensor]):
    filtered = checkpoint_filter_fn(pretrained_state, model)
    filtered.pop("head.fc.weight", None)
    filtered.pop("head.fc.bias", None)
    result = model.load_state_dict(filtered, strict=False)
    expected_missing = {"head.fc.weight", "head.fc.bias"}
    if set(result.missing_keys) != expected_missing or result.unexpected_keys:
        raise RuntimeError(
            f"Unexpected pretrained compatibility result: missing={result.missing_keys}, "
            f"unexpected={result.unexpected_keys}"
        )
    return result


def head_sha256(model: torch.nn.Module) -> str:
    digest = hashlib.sha256()
    for key in ("head.fc.weight", "head.fc.bias"):
        digest.update(model.state_dict()[key].detach().cpu().contiguous().numpy().tobytes())
    return digest.hexdigest()


def export_predictions(path: Path, prediction_rows: list[dict[str, Any]]) -> None:
    fieldnames = list(prediction_rows[0]) if prediction_rows else []
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(prediction_rows)


def load_pretrained_state() -> dict[str, torch.Tensor]:
    if not PRETRAINED_PATH.is_file():
        raise FileNotFoundError(f"Verified pretrained initialization missing: {PRETRAINED_PATH}")
    actual_hash = sha256_file(PRETRAINED_PATH)
    if actual_hash.lower() != WEIGHT_SHA256.lower():
        raise RuntimeError("Pretrained asset SHA-256 changed after verification.")
    checkpoint = torch.load(PRETRAINED_PATH, map_location="cpu", weights_only=True)
    if not isinstance(checkpoint, dict) or not isinstance(checkpoint.get("model"), dict):
        raise TypeError("Unexpected official pretrained checkpoint structure.")
    return checkpoint["model"]


def run_arm(
    arm_id: str,
    config_arm: dict[str, Any],
    arm_index: int,
    train_rows: pd.DataFrame,
    val_rows: pd.DataFrame,
    pretrained_state: dict[str, torch.Tensor],
    all_start_time: float,
    frozen_config_hash: str,
    expected_initial_head_sha256: str | None,
) -> dict[str, Any]:
    arm_dir = RUNS_DIR / arm_id
    if arm_dir.exists():
        raise FileExistsError(f"Run output already exists; refusing to overwrite: {arm_dir}")
    arm_dir.mkdir(parents=True, exist_ok=False)
    log_path = arm_dir / "epoch_log.jsonl"
    checkpoint_path = arm_dir / "best_model.pth"
    predictions_path = arm_dir / "best_validation_predictions.csv"
    seed = SEED
    set_seed(seed)

    train_dataset = DermaRows(train_rows, training=True)
    val_dataset = DermaRows(val_rows, training=False)
    weights, weight_report = sample_weights(train_rows, arm_id)
    sampler_generator = torch.Generator().manual_seed(seed)
    sampler = WeightedRandomSampler(weights, num_samples=len(train_dataset), replacement=True, generator=sampler_generator)
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, sampler=sampler, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    free_vram, total_vram = torch.cuda.mem_get_info()
    if free_vram / 2**30 < MIN_FREE_VRAM_GIB:
        write_json(arm_dir / "failure.json", {
            "status": "stopped_preflight_low_free_vram",
            "free_vram_gib": free_vram / 2**30,
            "required_free_vram_gib": MIN_FREE_VRAM_GIB,
            "timestamp_utc": utc_now(),
        })
        raise RuntimeError("Insufficient free VRAM for the configured batch size; arm not started.")

    set_seed(seed)
    model = timm.create_model(
        CONFIG["model"]["architecture"],
        pretrained=False,
        num_classes=len(LABELS),
        img_size=IMAGE_SIZE,
    )
    load_result = checkpoint_filter_and_load(model, pretrained_state)
    initial_head_hash = head_sha256(model)
    if expected_initial_head_sha256 and initial_head_hash != expected_initial_head_sha256:
        raise RuntimeError("The two arms did not initialize with identical classifier-head tensors.")
    model = model.cuda().train()

    optimizer = torch.optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer,
        T_max=EPOCHS_MAX,
        eta_min=1e-6,
    )
    scaler = torch.amp.GradScaler("cuda")
    criterion = torch.nn.CrossEntropyLoss(label_smoothing=0.1)

    run_config = {
        "arm_id": arm_id,
        "arm_definition": config_arm,
        "experiment_config_sha256": frozen_config_hash,
        "seed": seed,
        "pretrained_source": CONFIG["model"]["initialization"]["timm_pretrained_url"],
        "pretrained_path": str(PRETRAINED_PATH.relative_to(ROOT)),
        "pretrained_sha256": WEIGHT_SHA256,
        "pretrained_size_bytes": PRETRAINED_PATH.stat().st_size,
        "strict_backbone_compatibility": {
            "missing_keys": list(load_result.missing_keys),
            "unexpected_keys": list(load_result.unexpected_keys),
            "classifier_reinitialized": True,
            "initial_classifier_sha256": initial_head_hash,
        },
        "label_order": LABELS,
        "train_rows": len(train_rows),
        "validation_rows": len(val_rows),
        "train_subjects": int(train_rows["Subject_ID"].nunique()),
        "validation_subjects": int(val_rows["Subject_ID"].nunique()),
        "sampler_weight_audit": weight_report,
        "training_config": CONFIG["common_training"],
        "validation_config": CONFIG["validation"],
        "test_split_read": False,
        "started_utc": utc_now(),
        "torch": torch.__version__,
        "timm": timm.__version__,
        "torchvision": __import__("torchvision").__version__,
        "device": torch.cuda.get_device_name(0),
        "device_total_vram_gib": total_vram / 2**30,
    }
    write_json(arm_dir / "run_config.json", run_config)

    best_macro = -1.0
    best_loss = float("inf")
    best_epoch = 0
    best_metrics = None
    best_predictions = None
    macro_peak = -1.0
    bad_epochs = 0
    arm_start = time.perf_counter()
    status = "completed_max_epochs"
    failure = None

    try:
        for epoch in range(1, EPOCHS_MAX + 1):
            if time.perf_counter() - all_start_time >= TOTAL_BUDGET_SECONDS:
                status = "stopped_total_compute_budget"
                break
            model.train()
            optimizer.zero_grad(set_to_none=True)
            train_loss_sum = 0.0
            train_correct = 0
            train_total = 0
            epoch_start = time.perf_counter()
            torch.cuda.reset_peak_memory_stats()
            num_batches = len(train_loader)

            for batch_index, (images, targets, _) in enumerate(train_loader):
                images = images.cuda(non_blocking=False)
                targets = targets.cuda(non_blocking=False)
                group_start = (batch_index // ACCUMULATION_STEPS) * ACCUMULATION_STEPS
                accumulation_group_size = min(ACCUMULATION_STEPS, num_batches - group_start)
                with torch.autocast(device_type="cuda", dtype=torch.float16):
                    logits = model(images)
                    loss = criterion(logits, targets)
                scaler.scale(loss / accumulation_group_size).backward()
                is_update = ((batch_index + 1) % ACCUMULATION_STEPS == 0) or (batch_index + 1 == num_batches)
                if is_update:
                    scaler.step(optimizer)
                    scaler.update()
                    optimizer.zero_grad(set_to_none=True)
                train_loss_sum += float(loss.detach().item()) * len(targets)
                train_correct += int((logits.detach().argmax(dim=1) == targets).sum().item())
                train_total += len(targets)

            scheduler.step()
            val_metrics, val_predictions = validation_pass(model, val_loader, val_rows, criterion)
            train_loss = train_loss_sum / max(train_total, 1)
            train_accuracy = train_correct / max(train_total, 1)
            val_macro = float(val_metrics["macro_f1"])
            val_loss = float(val_metrics["cross_entropy_loss"])
            previous_peak = macro_peak
            macro_peak = max(macro_peak, val_macro)
            macro_improved = val_macro >= previous_peak + MIN_DELTA
            if macro_improved:
                bad_epochs = 0
            else:
                bad_epochs += 1

            difference = val_macro - best_macro
            select = (
                best_epoch == 0
                or difference >= MIN_DELTA
                or (abs(difference) < MIN_DELTA and val_loss < best_loss)
            )
            if select:
                best_macro = val_macro
                best_loss = val_loss
                best_epoch = epoch
                best_metrics = val_metrics
                best_predictions = val_predictions
                torch.save(model.state_dict(), checkpoint_path)
                export_predictions(predictions_path, val_predictions)

            peak_allocated = torch.cuda.max_memory_allocated() / 2**30
            peak_reserved = torch.cuda.max_memory_reserved() / 2**30
            epoch_record = {
                "epoch": epoch,
                "train_loss_sampled_epoch": train_loss,
                "train_accuracy_sampled_epoch": train_accuracy,
                "validation": val_metrics,
                "checkpoint_selected": select,
                "selected_checkpoint_epoch": best_epoch,
                "macro_f1_peak": macro_peak,
                "epochs_without_min_delta_gain": bad_epochs,
                "learning_rate_next_epoch": scheduler.get_last_lr()[0],
                "epoch_wall_seconds": time.perf_counter() - epoch_start,
                "cumulative_arm_seconds": time.perf_counter() - arm_start,
                "cuda_peak_allocated_gib": peak_allocated,
                "cuda_peak_reserved_gib": peak_reserved,
                "timestamp_utc": utc_now(),
            }
            with log_path.open("a", encoding="utf-8", newline="\n") as handle:
                handle.write(json.dumps(epoch_record, ensure_ascii=False) + "\n")
                handle.flush()
            print(json.dumps({
                "arm": arm_id,
                "epoch": epoch,
                "train_loss": round(train_loss, 5),
                "val_accuracy": round(val_metrics["accuracy"], 5),
                "val_macro_f1": round(val_macro, 5),
                "val_loss": round(val_loss, 5),
                "selected_epoch": best_epoch,
                "elapsed_min": round((time.perf_counter() - arm_start) / 60, 2),
                "peak_reserved_gib": round(peak_reserved, 2),
            }), flush=True)

            if peak_reserved >= MAX_RESERVED_VRAM_GIB:
                status = "stopped_high_vram"
                failure = f"Peak reserved CUDA memory {peak_reserved:.3f} GiB exceeded safety threshold {MAX_RESERVED_VRAM_GIB:.1f} GiB."
                break
            if bad_epochs >= PATIENCE:
                status = "early_stopped_patience"
                break

    except torch.cuda.OutOfMemoryError as error:
        status = "stopped_cuda_oom"
        failure = str(error)
        torch.cuda.empty_cache()
    except Exception as error:
        status = "failed_exception"
        failure = f"{type(error).__name__}: {error}"
        raise
    finally:
        result = {
            "arm_id": arm_id,
            "status": status,
            "failure": failure,
            "best_epoch": best_epoch,
            "best_validation_metrics": best_metrics,
            "best_validation_predictions": str(predictions_path.relative_to(ROOT)) if predictions_path.exists() else None,
            "best_checkpoint": str(checkpoint_path.relative_to(ROOT)) if checkpoint_path.exists() else None,
            "best_checkpoint_sha256": sha256_file(checkpoint_path) if checkpoint_path.exists() else None,
            "initial_classifier_sha256": initial_head_hash,
            "elapsed_seconds": time.perf_counter() - arm_start,
            "finished_utc": utc_now(),
            "test_split_read": False,
        }
        write_json(arm_dir / "run_result.json", result)
        del model
        torch.cuda.empty_cache()

    if status.startswith("stopped_") or status.startswith("failed_"):
        return result
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preflight-only", action="store_true", help="Run verification checks without creating run files or training.")
    args = parser.parse_args()
    if RUNS_DIR.exists():
        raise FileExistsError(f"Experiment run directory already exists; refusing to overwrite: {RUNS_DIR}")
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA unavailable; aborting before training.")
    if sha256_file(PRETRAINED_PATH).lower() != WEIGHT_SHA256.lower():
        raise RuntimeError("Pretrained SHA-256 verification failed; aborting.")
    train_rows, val_rows, _ = load_training_only_partitions()
    for directory in IMAGE_DIRS:
        if not directory.is_dir():
            raise FileNotFoundError(f"Image directory missing: {directory}")

    # Validate the official pretrained backbone before creating run directories or training.
    set_seed(SEED)
    preflight_model = timm.create_model(
        CONFIG["model"]["architecture"], pretrained=False, num_classes=len(LABELS), img_size=IMAGE_SIZE
    )
    state = load_pretrained_state()
    preflight_result = checkpoint_filter_and_load(preflight_model, state)
    if set(preflight_result.missing_keys) != {"head.fc.weight", "head.fc.bias"} or preflight_result.unexpected_keys:
        raise RuntimeError("Pretrained architecture compatibility failed.")
    del preflight_model

    free_vram, total_vram = torch.cuda.mem_get_info()
    if free_vram / 2**30 < MIN_FREE_VRAM_GIB:
        raise RuntimeError(
            f"Only {free_vram / 2**30:.2f} GiB free VRAM; need {MIN_FREE_VRAM_GIB:.1f} GiB."
        )

    # Also verify image availability and arm comparability before any run directory or optimizer is created.
    DermaRows(train_rows, training=True)
    DermaRows(val_rows, training=False)
    if len(CONFIG["arms"]) != 2 or CONFIG["common_training"] is None:
        raise RuntimeError("Expected exactly two arms sharing a common frozen training configuration.")
    if set(CONFIG["arms"]) != {"A_standard_class_balanced", "B_capped_fitzpatrick_reweight"}:
        raise RuntimeError("The prepared experimental arms differ from the expected frozen definitions.")
    baseline_sampler, _ = sample_weights(train_rows, "A_standard_class_balanced")
    treatment_sampler, _ = sample_weights(train_rows, "B_capped_fitzpatrick_reweight")
    labels_array = train_rows["Main_class"].to_numpy()
    for label in LABELS:
        if not math.isclose(float(baseline_sampler[labels_array == label].sum()), 1.0, rel_tol=0, abs_tol=1e-10):
            raise RuntimeError(f"Baseline sampler mass differs from 1 for {label}.")
        if not math.isclose(float(treatment_sampler[labels_array == label].sum()), 1.0, rel_tol=0, abs_tol=1e-10):
            raise RuntimeError(f"Reweighted sampler mass differs from baseline for {label}.")

    if args.preflight_only:
        print(json.dumps({
            "preflight": "passed",
            "training_rows": len(train_rows),
            "validation_rows": len(val_rows),
            "train_subjects": int(train_rows["Subject_ID"].nunique()),
            "validation_subjects": int(val_rows["Subject_ID"].nunique()),
            "subject_overlap": 0,
            "pretrained_file_size_bytes": PRETRAINED_PATH.stat().st_size,
            "pretrained_sha256": WEIGHT_SHA256,
            "pretrained_architecture_missing_keys": list(preflight_result.missing_keys),
            "pretrained_architecture_unexpected_keys": list(preflight_result.unexpected_keys),
            "free_vram_gib": free_vram / 2**30,
            "total_vram_gib": total_vram / 2**30,
            "arms": list(CONFIG["arms"]),
            "per_class_sampler_mass_a": {label: float(baseline_sampler[labels_array == label].sum()) for label in LABELS},
            "per_class_sampler_mass_b": {label: float(treatment_sampler[labels_array == label].sum()) for label in LABELS},
            "test_split_read": False,
            "run_directory_created": False,
        }, indent=2))
        return 0

    frozen_config_hash = sha256_file(CONFIG_PATH)
    RUNS_DIR.mkdir(parents=False, exist_ok=False)
    write_json(RUNS_DIR / "run_manifest.json", {
        "experiment_id": CONFIG["experiment_id"],
        "status": "running",
        "started_utc": utc_now(),
        "experiment_config_sha256": frozen_config_hash,
        "training_metadata_sha256": CONFIG["data"]["training_metadata_sha256"],
        "pretrained_source": CONFIG["model"]["initialization"]["timm_pretrained_url"],
        "pretrained_sha256": WEIGHT_SHA256,
        "pretrained_size_bytes": PRETRAINED_PATH.stat().st_size,
        "split_manifest_sha256": sha256_file(MANIFEST_CSV),
        "test_split_read": False,
        "gpu": torch.cuda.get_device_name(0),
        "initial_free_vram_gib": free_vram / 2**30,
        "total_vram_gib": total_vram / 2**30,
        "hard_total_budget_hours": TOTAL_BUDGET_SECONDS / 3600,
        "arms": [],
    })
    write_json(RUNS_DIR / "frozen_experiment_config.json", CONFIG)

    all_start = time.perf_counter()
    pretrained_state = load_pretrained_state()
    results = []
    for arm_index, (arm_id, arm_config) in enumerate(CONFIG["arms"].items()):
        arm_result = run_arm(
            arm_id,
            arm_config,
            arm_index,
            train_rows,
            val_rows,
            pretrained_state,
            all_start,
            frozen_config_hash,
            results[0].get("initial_classifier_sha256") if results else None,
        )
        results.append(arm_result)
        if arm_result["status"].startswith("stopped_") or arm_result["status"].startswith("failed_"):
            break

    del pretrained_state
    torch.cuda.empty_cache()
    manifest_path = RUNS_DIR / "run_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["arms"] = results
    manifest["elapsed_seconds"] = time.perf_counter() - all_start
    manifest["finished_utc"] = utc_now()
    manifest["status"] = "completed" if len(results) == 2 and all(
        not r["status"].startswith(("stopped_", "failed_")) for r in results
    ) else "incomplete_or_stopped"
    write_json(manifest_path, manifest)

    if len(results) == 2 and all(r.get("best_validation_metrics") for r in results):
        comparison = {
            "metric_scope": "validation only; official test split was not read",
            "arms": {
                r["arm_id"]: {
                    "status": r["status"],
                    "best_epoch": r["best_epoch"],
                    "elapsed_seconds": r["elapsed_seconds"],
                    "best_validation_metrics": r["best_validation_metrics"],
                }
                for r in results
            },
            "deltas_B_minus_A": {},
        }
        a = results[0]["best_validation_metrics"]
        b = results[1]["best_validation_metrics"]
        for metric in ("accuracy", "macro_f1", "cross_entropy_loss"):
            comparison["deltas_B_minus_A"][metric] = b[metric] - a[metric]
        comparison["deltas_B_minus_A"]["pigmentary_fst3_minus_fst5_recall_gap"] = (
            b["pigmentary_fst3_fst5"]["recall_difference_FST3_minus_FST5"]
            - a["pigmentary_fst3_fst5"]["recall_difference_FST3_minus_FST5"]
        )
        per_class_delta = {}
        for label in LABELS:
            per_class_delta[label] = {
                metric: b["per_class"][label][metric] - a["per_class"][label][metric]
                for metric in ("precision", "recall", "f1")
            }
        comparison["deltas_B_minus_A"]["per_class"] = per_class_delta
        write_json(RUNS_DIR / "validation_comparison.json", comparison)
    print(json.dumps({"status": manifest["status"], "run_manifest": str(manifest_path), "elapsed_seconds": manifest["elapsed_seconds"]}, indent=2))
    return 0 if manifest["status"] == "completed" else 2


if __name__ == "__main__":
    sys.exit(main())
