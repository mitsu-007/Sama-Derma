import csv
from pathlib import Path
from collections import Counter

DATA_DIR = Path("data/metadata")
FILES = {
    "metadata": DATA_DIR / "Skin_Metadata-1.csv",
    "train": DATA_DIR / "train_split-1.csv",
    "test": DATA_DIR / "test_split-1.csv",
}

def audit_csv(name, path):
    print("\n" + "=" * 60)
    print(name.upper() + " AUDIT")
    print("=" * 60)
    if not path.exists():
        print("FILE NOT FOUND:", path.resolve())
        return None
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        columns = reader.fieldnames or []
        rows = list(reader)
    print("Rows:", f"{len(rows):,}")
    print("Columns:", len(columns))
    print("Column names:", columns)
    for column in ["Main_class", "Sub_class", "Disease_label", "Fitzpatrick",
                   "Monk_skin_tone", "Quality", "Gradability"]:
        if column not in columns:
            continue
        counts = Counter((row.get(column) or "").strip() or "MISSING" for row in rows)
        print("\n" + column + " distribution:")
        for value, count in counts.most_common():
            print(f"  {value}: {count:,}")
    if "Subject_ID" in columns:
        ids = [(row.get("Subject_ID") or "").strip() for row in rows]
        valid_ids = [value for value in ids if value]
        print("\nUnique subjects:", f"{len(set(valid_ids)):,}")
        print("Missing subject IDs:", len(ids) - len(valid_ids))
    return rows, columns

def main():
    results = {}
    for name, path in FILES.items():
        result = audit_csv(name, path)
        if result is not None:
            results[name] = result
    if "train" in results and "test" in results:
        train_rows, train_cols = results["train"]
        test_rows, test_cols = results["test"]
        print("\n" + "=" * 60)
        print("TRAIN/TEST OVERLAP CHECK")
        print("=" * 60)
        if "Subject_ID" in train_cols and "Subject_ID" in test_cols:
            train_ids = {row["Subject_ID"].strip() for row in train_rows
                         if row.get("Subject_ID", "").strip()}
            test_ids = {row["Subject_ID"].strip() for row in test_rows
                        if row.get("Subject_ID", "").strip()}
            overlap = train_ids & test_ids
            print("Training subjects:", f"{len(train_ids):,}")
            print("Test subjects:", f"{len(test_ids):,}")
            print("Overlapping subjects:", f"{len(overlap):,}")
            print("WARNING: Subject overlap detected." if overlap
                  else "No overlapping non-missing subject IDs detected.")
        else:
            print("Subject_ID is absent from one or both split files.")
        if "Image_name" in train_cols and "Image_name" in test_cols:
            train_images = {row["Image_name"].strip() for row in train_rows
                            if row.get("Image_name", "").strip()}
            test_images = {row["Image_name"].strip() for row in test_rows
                           if row.get("Image_name", "").strip()}
            print("Overlapping image names:", f"{len(train_images & test_images):,}")
    print("\nAudit finished.")

if __name__ == "__main__":
    main()
