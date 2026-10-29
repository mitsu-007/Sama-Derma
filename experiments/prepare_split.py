"""Create a deterministic subject-disjoint split from training metadata only."""

import hashlib
import json
from pathlib import Path

import pandas as pd
import sklearn
from sklearn.model_selection import StratifiedGroupKFold


ROOT = Path(__file__).resolve().parents[1]
TRAIN_CSV = ROOT / "data" / "metadata" / "train_split-1.csv"
OUT_DIR = Path(__file__).resolve().parent
MANIFEST_PATH = OUT_DIR / "train_val_split_manifest.csv"
SUMMARY_PATH = OUT_DIR / "train_val_split_summary.json"
SEED = 20261026
N_SPLITS = 5
VALIDATION_FOLD = 0


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    required = {"Image_name", "Subject_ID", "Main_class", "Fitzpatrick", "Monk_skin_tone"}
    data = pd.read_csv(TRAIN_CSV, dtype={"Subject_ID": "string"})
    missing = required - set(data.columns)
    if missing:
        raise ValueError(f"Missing required training columns: {sorted(missing)}")
    if data["Subject_ID"].isna().any() or data["Main_class"].isna().any():
        raise ValueError("Training rows must have Subject_ID and Main_class values.")
    if data["Image_name"].duplicated().any():
        raise ValueError("Duplicate Image_name values found in training metadata.")
    if MANIFEST_PATH.exists() or SUMMARY_PATH.exists():
        raise FileExistsError("Split outputs already exist; refusing to overwrite them.")

    splitter = StratifiedGroupKFold(
        n_splits=N_SPLITS,
        shuffle=True,
        random_state=SEED,
    )
    folds = list(splitter.split(data.index, data["Main_class"], data["Subject_ID"]))
    if VALIDATION_FOLD >= len(folds):
        raise ValueError("Requested validation fold does not exist.")
    train_idx, validation_idx = folds[VALIDATION_FOLD]
    train_rows = data.iloc[train_idx]
    validation_rows = data.iloc[validation_idx]
    train_subjects = set(train_rows["Subject_ID"].astype(str))
    validation_subjects = set(validation_rows["Subject_ID"].astype(str))
    if train_subjects & validation_subjects:
        raise AssertionError("Subject leakage between training and validation.")
    if set(train_rows["Image_name"]) & set(validation_rows["Image_name"]):
        raise AssertionError("Image leakage between training and validation.")

    manifest = data[["Image_name", "Subject_ID", "Main_class", "Fitzpatrick"]].copy()
    manifest.insert(0, "source_row_index", data.index)
    manifest["partition"] = "train"
    manifest.loc[validation_idx, "partition"] = "validation"
    manifest.to_csv(MANIFEST_PATH, index=False, mode="x", encoding="utf-8")

    def class_counts(frame: pd.DataFrame) -> dict[str, int]:
        return {str(k): int(v) for k, v in frame["Main_class"].value_counts().sort_index().items()}

    group_support = (
        train_rows.groupby(["Main_class", "Fitzpatrick"], dropna=False)
        .agg(images=("Image_name", "size"), subjects=("Subject_ID", "nunique"))
        .reset_index()
    )
    group_rows = []
    for row in group_support.to_dict(orient="records"):
        tone = row["Fitzpatrick"]
        group_rows.append({
            "Main_class": str(row["Main_class"]),
            "Fitzpatrick": None if pd.isna(tone) else str(tone),
            "images": int(row["images"]),
            "subjects": int(row["subjects"]),
        })

    summary = {
        "source_csv": str(TRAIN_CSV.relative_to(ROOT)),
        "source_csv_sha256": sha256(TRAIN_CSV),
        "splitter": "sklearn.model_selection.StratifiedGroupKFold",
        "scikit_learn_version": sklearn.__version__,
        "seed": SEED,
        "n_splits": N_SPLITS,
        "validation_fold": VALIDATION_FOLD,
        "source_rows": int(len(data)),
        "training_rows": int(len(train_rows)),
        "validation_rows": int(len(validation_rows)),
        "source_subjects": int(data["Subject_ID"].nunique()),
        "training_subjects": int(len(train_subjects)),
        "validation_subjects": int(len(validation_subjects)),
        "subject_overlap": 0,
        "image_overlap": 0,
        "training_class_counts": class_counts(train_rows),
        "validation_class_counts": class_counts(validation_rows),
        "training_fitzpatrick_diagnosis_support": group_rows,
        "test_metadata_read": False,
    }
    with SUMMARY_PATH.open("x", encoding="utf-8", newline="\n") as handle:
        json.dump(summary, handle, indent=2, ensure_ascii=False)
        handle.write("\n")

    print(json.dumps({
        "manifest": str(MANIFEST_PATH),
        "summary": str(SUMMARY_PATH),
        "training_rows": summary["training_rows"],
        "validation_rows": summary["validation_rows"],
        "training_subjects": summary["training_subjects"],
        "validation_subjects": summary["validation_subjects"],
        "subject_overlap": summary["subject_overlap"],
        "test_metadata_read": summary["test_metadata_read"],
    }, indent=2))


if __name__ == "__main__":
    main()
