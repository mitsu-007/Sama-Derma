import csv
from pathlib import Path
from collections import Counter

import torch
import timm
import torchvision.transforms as transforms
from PIL import Image


# ============================================================
# 1. PROJECT PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

CHECKPOINT_PATH = BASE_DIR / "checkpoints" / "Swin_MC_best_model.pth"
TRAIN_CSV = BASE_DIR / "data" / "metadata" / "train_split-1.csv"
TEST_CSV = BASE_DIR / "data" / "metadata" / "test_split-1.csv"

DATASET_DIRS = [
    BASE_DIR / "dataset" / "DATASET_0",
    BASE_DIR / "dataset" / "DATASET_1",
]

OUTPUT_DIR = BASE_DIR / "evaluation_results"
OUTPUT_DIR.mkdir(exist_ok=True)


# ============================================================
# 2. VALIDATE FILES AND DEVICE
# ============================================================

for path in [CHECKPOINT_PATH, TRAIN_CSV, TEST_CSV]:
    if not path.is_file():
        raise FileNotFoundError(f"Required file not found: {path}")

for directory in DATASET_DIRS:
    if not directory.is_dir():
        raise FileNotFoundError(f"Dataset directory not found: {directory}")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print("=" * 65)
print("DERMAFAIR AI - BASELINE EVALUATION")
print("=" * 65)

print("Device:", device)

if device.type == "cuda":
    print("GPU:", torch.cuda.get_device_name(0))


# ============================================================
# 3. READ METADATA
# ============================================================

def read_csv(path):
    with open(path, "r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


train_rows = read_csv(TRAIN_CSV)
test_rows = read_csv(TEST_CSV)

if not train_rows or not test_rows:
    raise ValueError("Training or test metadata is empty.")

required_columns = {"Image_name", "Main_class"}

for path, rows in [(TRAIN_CSV, train_rows), (TEST_CSV, test_rows)]:
    if not required_columns.issubset(rows[0].keys()):
        raise ValueError(
            f"Expected columns {required_columns} in {path.name}. "
            f"Found: {list(rows[0].keys())}"
        )

# The official inference notebook sorts the labels from its CSV.
labels = sorted({
    row["Main_class"].strip()
    for row in train_rows
    if row.get("Main_class", "").strip()
})

test_labels = {
    row["Main_class"].strip()
    for row in test_rows
    if row.get("Main_class", "").strip()
}

if set(labels) != test_labels:
    raise ValueError(
        "Training and test class sets differ. "
        "Check the official checkpoint label mapping before continuing."
    )

label_to_idx = {label: index for index, label in enumerate(labels)}

print("\nClass mapping:")
for index, label in enumerate(labels):
    print(f"{index}: {label}")

print("\nTraining metadata rows:", len(train_rows))
print("Test metadata rows:", len(test_rows))

print("\nGround-truth test class distribution:")
for label, count in sorted(
    Counter(
        row["Main_class"].strip()
        for row in test_rows
        if row.get("Main_class", "").strip()
    ).items()
):
    print(f"{label}: {count}")


# ============================================================
# 4. BUILD IMAGE LOOKUP
# ============================================================

print("\nIndexing image files...")

image_lookup = {}

for dataset_dir in DATASET_DIRS:
    for image_path in dataset_dir.rglob("*"):
        if image_path.is_file():
            if image_path.name in image_lookup:
                raise ValueError(
                    f"Duplicate image filename found: {image_path.name}"
                )

            image_lookup[image_path.name] = image_path

print("Indexed image files:", len(image_lookup))


# ============================================================
# 5. LOAD PRETRAINED MODEL
# ============================================================

print("\nLoading pretrained Swin Transformer...")

model = timm.create_model(
    "swin_base_patch4_window12_384",
    pretrained=False,
    num_classes=len(labels),
    img_size=512,
)

# This checkpoint was previously verified to be a plain state dictionary.
# weights_only=True avoids loading arbitrary pickled Python objects.
checkpoint = torch.load(
    CHECKPOINT_PATH,
    map_location="cpu",
    weights_only=True,
)

if not isinstance(checkpoint, dict):
    raise TypeError("Unexpected checkpoint format.")

# Support a wrapped state dictionary if one is encountered.
if "state_dict" in checkpoint:
    checkpoint = checkpoint["state_dict"]
elif "model_state_dict" in checkpoint:
    checkpoint = checkpoint["model_state_dict"]

checkpoint = {
    key.removeprefix("module."): value
    for key, value in checkpoint.items()
}

model.load_state_dict(checkpoint, strict=True)

model.to(device)
model.eval()

print("Model loaded successfully.")
print("Inference device:", device)


# ============================================================
# 6. IMAGE PREPROCESSING
# ============================================================

transform = transforms.Compose([
    transforms.Resize((512, 512)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.53749797, 0.45875554, 0.40382471],
        std=[0.21629889, 0.20366619, 0.20136241],
    ),
])


# ============================================================
# 7. EVALUATE TEST SET
# ============================================================

y_true = []
y_pred = []

prediction_rows = []
missing_images = []
invalid_rows = []

total_rows = len(test_rows)

print("\nStarting inference on test images...")
print("This may take several minutes.\n")

with torch.inference_mode():

    for row_number, row in enumerate(test_rows, start=1):

        filename = row.get("Image_name", "").strip()
        true_label = row.get("Main_class", "").strip()

        if not filename or true_label not in label_to_idx:
            invalid_rows.append(filename or f"row_{row_number}")
            continue

        image_path = image_lookup.get(filename)

        if image_path is None:
            missing_images.append(filename)
            continue

        try:
            with Image.open(image_path) as image:
                image = image.convert("RGB")
                image_tensor = transform(image).unsqueeze(0).to(device)

            logits = model(image_tensor)
            probabilities = torch.softmax(logits, dim=1)[0]

            predicted_index = int(probabilities.argmax().item())
            predicted_label = labels[predicted_index]
            predicted_score = float(probabilities[predicted_index].item())

            y_true.append(label_to_idx[true_label])
            y_pred.append(predicted_index)

            prediction_rows.append({
                "Image_name": filename,
                "True_class": true_label,
                "Predicted_class": predicted_label,
                "Predicted_score": predicted_score,
                "Correct": int(predicted_label == true_label),
                "Fitzpatrick": row.get("Fitzpatrick", ""),
                "Monk_skin_tone": row.get("Monk_skin_tone", ""),
            })

        except Exception as error:
            raise RuntimeError(
                f"Evaluation failed for image {filename}"
            ) from error

        if row_number % 50 == 0 or row_number == total_rows:
            print(f"Processed {row_number}/{total_rows} metadata rows")

if not y_true:
    raise RuntimeError(
        "No test images were evaluated. Check image paths and metadata."
    )


# ============================================================
# 8. CALCULATE METRICS WITHOUT SCIKIT-LEARN
# ============================================================

num_classes = len(labels)

confusion = [
    [0 for _ in range(num_classes)]
    for _ in range(num_classes)
]

for true_index, predicted_index in zip(y_true, y_pred):
    confusion[true_index][predicted_index] += 1

total_evaluated = len(y_true)

correct_predictions = sum(
    confusion[index][index]
    for index in range(num_classes)
)

accuracy = correct_predictions / total_evaluated

class_metrics = []

for index in range(num_classes):

    true_positive = confusion[index][index]

    actual_count = sum(confusion[index])

    predicted_count = sum(
        confusion[row][index]
        for row in range(num_classes)
    )

    precision = (
        true_positive / predicted_count
        if predicted_count else 0.0
    )

    recall = (
        true_positive / actual_count
        if actual_count else 0.0
    )

    f1 = (
        2 * precision * recall / (precision + recall)
        if precision + recall else 0.0
    )

    class_metrics.append({
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "support": actual_count,
    })

macro_f1 = sum(
    metric["f1"] for metric in class_metrics
) / num_classes


# ============================================================
# 9. PRINT RESULTS
# ============================================================

print("\n" + "=" * 75)
print("BASELINE EVALUATION RESULTS")
print("=" * 75)

print(f"Evaluated images: {total_evaluated}")
print(f"Missing images: {len(missing_images)}")
print(f"Invalid metadata rows: {len(invalid_rows)}")

print(f"\nAccuracy: {accuracy:.4f} ({accuracy:.2%})")
print(f"Macro F1: {macro_f1:.4f}")

print("\nPer-class metrics:")

print(
    f"{'Class':35} "
    f"{'Precision':>10} "
    f"{'Recall':>10} "
    f"{'F1':>10} "
    f"{'Support':>10}"
)

for label, metric in zip(labels, class_metrics):
    print(
        f"{label:35} "
        f"{metric['precision']:10.4f} "
        f"{metric['recall']:10.4f} "
        f"{metric['f1']:10.4f} "
        f"{metric['support']:10d}"
    )

print("\nConfusion matrix (rows = true, columns = predicted):")

print("Column labels:")
for index, label in enumerate(labels):
    print(f"{index}: {label}")

for row in confusion:
    print(row)


# ============================================================
# 10. SAVE PER-IMAGE PREDICTIONS
# ============================================================

predictions_path = OUTPUT_DIR / "test_predictions.csv"

fieldnames = [
    "Image_name",
    "True_class",
    "Predicted_class",
    "Predicted_score",
    "Correct",
    "Fitzpatrick",
    "Monk_skin_tone",
]

with open(
    predictions_path,
    "w",
    encoding="utf-8",
    newline="",
) as file:

    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(prediction_rows)


# ============================================================
# 11. SAVE TEXT REPORT
# ============================================================

report_path = OUTPUT_DIR / "baseline_report.txt"

with open(report_path, "w", encoding="utf-8") as file:

    file.write("DERMAFAIR AI - BASELINE EVALUATION\n")
    file.write("=" * 50 + "\n\n")

    file.write(f"Device: {device}\n")
    file.write(f"Test metadata rows: {total_rows}\n")
    file.write(f"Evaluated images: {total_evaluated}\n")
    file.write(f"Missing images: {len(missing_images)}\n")
    file.write(f"Invalid rows: {len(invalid_rows)}\n")
    file.write(f"Accuracy: {accuracy:.6f}\n")
    file.write(f"Macro F1: {macro_f1:.6f}\n\n")

    file.write("CLASS MAPPING\n")

    for index, label in enumerate(labels):
        file.write(f"{index}: {label}\n")

    file.write("\nPER-CLASS METRICS\n")

    for label, metric in zip(labels, class_metrics):
        file.write(
            f"{label}: "
            f"precision={metric['precision']:.6f}, "
            f"recall={metric['recall']:.6f}, "
            f"f1={metric['f1']:.6f}, "
            f"support={metric['support']}\n"
        )

    file.write("\nCONFUSION MATRIX\n")
    file.write("Rows=true class, columns=predicted class\n")

    for row in confusion:
        file.write(str(row) + "\n")


# ============================================================
# 12. FINISH
# ============================================================

print("\nEvaluation completed.")

print("Results directory:", OUTPUT_DIR)
print("Predictions file:", predictions_path)
print("Report file:", report_path)

if missing_images:
    print("\nFirst missing image filenames:")
    for filename in missing_images[:20]:
        print(filename)

print("\nRemember: these are experimental results, not clinical validation.")