from huggingface_hub import HfApi

DATASET_ID = "ekacare/DermaCon-IN"

api = HfApi()

print("=" * 60)
print("DERMAFAIR AI — DATASET AUDIT")
print("=" * 60)

try:
    info = api.dataset_info(
        repo_id=DATASET_ID,
        files_metadata=True
    )

    print(f"\nDataset: {info.id}")
    print(f"Repository: https://huggingface.co/datasets/{DATASET_ID}")

    print("\nFILES:")
    print("-" * 60)

    files = api.list_repo_tree(
        repo_id=DATASET_ID,
        repo_type="dataset",
        recursive=True
    )

    for item in files:
        if hasattr(item, "path"):
            size = getattr(item, "size", None)
            size_text = (
                f"{size / (1024 * 1024):.2f} MB"
                if size is not None
                else "Size unavailable"
            )

            print(f"{item.path} | {size_text}")

except Exception as error:
    print("\nCould not inspect the repository.")
    print("Error:", error)