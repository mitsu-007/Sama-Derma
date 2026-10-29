from pathlib import Path
import pandas as pd

# Dataset locations
DATA_DIR = Path("data/metadata")

FILES = {
    "metadata": DATA_DIR / "Skin_Metadata.csv",
    "train": DATA_DIR / "train_split.csv",
    "test": DATA_DIR / "test_split.csv",
}


def load_csv(name, path):
    print(f"\n{'=' * 70}")
    print(f"LOADING: {name.upper()}")
    print("=" * 70)

    if not path.exists():
        print(f"ERROR: File not found: {path.resolve()}")
        print("Check that your CSV files are inside data/metadata/")
        return None

    try:
        df = pd.read_csv(path, low_memory=False)
    except Exception as error:
        print(f"Could not read CSV: {error}")
        return None

    print(f"File: {path}")
    print(f"Rows: {len(df):,}")
    print(f"Columns: {len(df.columns)}")
    print("\nColumn names:")
    print(df.columns.tolist())

    return df


def show_distribution(df, column, title, limit=20):
    if column not in df.columns:
        print(f"\n{title}: column '{column}' not found.")
        return

    print(f"\n{title}")
    print("-" * 50)
    print(df[column].fillna("MISSING").value_counts().head(limit).to_string())


def main():
    print("=" * 70)
    print("DERMAFAIR AI — DATASET AUDIT")
    print("=" * 70)

    data = {
        name: load_csv(name, path)
        for name, path in FILES.items()
    }

    metadata = data["metadata"]
    train = data["train"]
    test = data["test"]

    # Inspect the main metadata
    if metadata is not None:
        print("\n\nMETADATA QUALITY CHECK")
        print("-" * 50)

        print("\nMissing values per column:")
        missing = metadata.isna().sum()
        print(missing[missing > 0].to_string() or "No pandas-recognised missing values")

        for column in [
            "Main_class",
            "Sub_class",
            "Disease_label",
            "Fitzpatrick",
            "Monk_skin_tone",
            "Quality",
            "Gradability",
            "Confidence",
        ]:
            show_distribution(
                metadata,
                column,
                f"DISTRIBUTION: {column}",
            )

        if "Image_name" in metadata.columns:
            print("\nUnique image names:")
            print(metadata["Image_name"].nunique())

            print(
                "Duplicate image names:",
                metadata["Image_name"].duplicated().sum(),
            )

        if "Subject_ID" in metadata.columns:
            print("\nUnique subjects in metadata:")
            print(metadata["Subject_ID"].nunique())

            print(
                "Rows with missing subject IDs:",
                metadata["Subject_ID"].isna().sum(),
            )

    # Inspect official split files
    for name, df in [("train", train), ("test", test)]:
        if df is None:
            continue

        print(f"\n\n{name.upper()} SPLIT CHECK")
        print("-" * 50)

        for column in [
            "Main_class",
            "Sub_class",
            "Disease_label",
            "Fitzpatrick",
            "Monk_skin_tone",
        ]:
            show_distribution(df, column, f"{name}: {column}")

        if "Subject_ID" in df.columns:
            print("\nUnique subjects:", df["Subject_ID"].nunique())
            print("Missing subject IDs:", df["Subject_ID"].isna().sum())

    # Verify that train and test do not share subjects or images
    if train is not None and test is not None:
        print("\n\nTRAIN/TEST LEAKAGE CHECK")
        print("-" * 50)

        if "Subject_ID" in train.columns and "Subject_ID" in test.columns:
            train_ids = set(train["Subject_ID"].dropna().astype(str))
            test_ids = set(test["Subject_ID"].dropna().astype(str))

            overlap = train_ids & test_ids

            print(f"Unique training subjects: {len(train_ids):,}")
            print(f"Unique test subjects: {len(test_ids):,}")
            print(f"Overlapping subjects: {len(overlap):,}")

            if overlap:
                print("WARNING: Subject overlap exists.")
                print("Examples:", list(overlap)[:10])
            else:
                print("PASS: No overlapping non-missing subject IDs found.")

        else:
            print("Subject_ID is absent from one or both split files.")

        if "Image_name" in train.columns and "Image_name" in test.columns:
            train_images = set(train["Image_name"].dropna().astype(str))
            test_images = set(test["Image_name"].dropna().astype(str))
            image_overlap = train_images & test_images

            print(f"\nOverlapping image names: {len(image_overlap):,}")

    # Compare split sizes with metadata
    if metadata is not None and train is not None and test is not None:
        print("\n\nRECORD COUNT CHECK")
        print("-" * 50)
        print(f"Metadata rows: {len(metadata):,}")
        print(f"Train rows:    {len(train):,}")
        print(f"Test rows:     {len(test):,}")
        print(f"Train + test:  {len(train) + len(test):,}")

        if len(train) + len(test) == len(metadata):
            print("Counts match, but this alone does not prove the splits are correct.")
        else:
            print("WARNING: Counts differ; inspect the split definitions.")

    print("\n\nAUDIT FINISHED")
    print("Review the output before selecting a model.")


if __name__ == "__main__":
    main()

