
import csv
from pathlib import Path
from collections import Counter

# Project paths
BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "dataset"
METADATA_DIR = BASE_DIR / "data" / "metadata"

CSV_FILES = [
    METADATA_DIR / "Skin_Metadata-1.csv",
    METADATA_DIR / "train_split-1.csv",
    METADATA_DIR / "test_split-1.csv",
]

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def read_csv_rows(file_path):
    """Read CSV rows using Python's built-in csv module."""
    with open(file_path, "r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        return list(reader)


def find_image_folders():
    """Find folders containing image files."""
    folders = [
        DATASET_DIR / "DATASET_0",
        DATASET_DIR / "DATASET_1",
    ]

    return [folder for folder in folders if folder.exists()]


def main():
    print("=" * 65)
    print("DERMAFAIR AI - DATASET IMAGE VERIFICATION")
    print("=" * 65)

    if not DATASET_DIR.exists():
        print(f"ERROR: Dataset directory not found: {DATASET_DIR}")
        return

    folders = find_image_folders()

    if not folders:
        print("ERROR: DATASET_0 and DATASET_1 folders were not found.")
        return

    image_paths = []
    filename_counts = Counter()

    print("\n1. SCANNING IMAGE FOLDERS")

    for folder in folders:
        folder_images = [
            path for path in folder.rglob("*")
            if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
        ]

        print(f"{folder.name}: {len(folder_images):,} images")

        image_paths.extend(folder_images)

        for path in folder_images:
            filename_counts[path.name.lower()] += 1

    print(f"\nTotal image files: {len(image_paths):,}")

    duplicate_names = {
        name: count
        for name, count in filename_counts.items()
        if count > 1
    }

    print(f"Duplicate filenames across folders: {len(duplicate_names):,}")

    if duplicate_names:
        print("Examples:", list(duplicate_names.items())[:10])

    image_names = set(filename_counts.keys())

    print("\n2. CHECKING METADATA FILES")

    for csv_path in CSV_FILES:
        print(f"\nFile: {csv_path.name}")

        if not csv_path.exists():
            print("ERROR: File not found.")
            continue

        rows = read_csv_rows(csv_path)
        print(f"Metadata rows: {len(rows):,}")

        if not rows:
            print("WARNING: CSV is empty.")
            continue

        columns = rows[0].keys()

        if "Image_name" not in columns:
            print("WARNING: No 'Image_name' column found.")
            print("Available columns:", list(columns))
            continue

        metadata_names = [
            row.get("Image_name", "").strip()
            for row in rows
            if row.get("Image_name", "").strip()
        ]

        matched = sum(
            1 for name in metadata_names
            if Path(name).name.lower() in image_names
        )

        missing = len(metadata_names) - matched

        print(f"Rows with image names: {len(metadata_names):,}")
        print(f"Matching images found: {matched:,}")
        print(f"Images not found: {missing:,}")

        if missing:
            missing_examples = [
                name for name in metadata_names
                if Path(name).name.lower() not in image_names
            ][:10]

            print("Missing filename examples:", missing_examples)

    print("\n3. SUMMARY")
    print(f"Total image files scanned: {len(image_paths):,}")
    print(f"Unique filenames: {len(image_names):,}")
    print(f"Duplicate filenames: {len(duplicate_names):,}")

    print("\nVerification complete.")
    print("=" * 65)


if __name__ == "__main__":
    main()

