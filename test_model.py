import torch
import timm
import torchvision.transforms as transforms
from PIL import Image
from pathlib import Path
import csv

# Project paths
BASE_DIR = Path(__file__).resolve().parent
CHECKPOINT_PATH = BASE_DIR / "checkpoints" / "Swin_MC_best_model.pth"
METADATA_PATH = BASE_DIR / "data" / "metadata" / "train_split-1.csv"
DATASET_DIRS = [
    BASE_DIR / "dataset" / "DATASET_0",
    BASE_DIR / "dataset" / "DATASET_1",
]

# Check required files
if not CHECKPOINT_PATH.exists():
    raise FileNotFoundError(f"Checkpoint not found: {CHECKPOINT_PATH}")

if not METADATA_PATH.exists():
    raise FileNotFoundError(f"Metadata not found: {METADATA_PATH}")

# Read metadata without pandas
with open(METADATA_PATH, "r", encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

# Get class labels
labels = sorted({
    row["Main_class"].strip()
    for row in rows
    if row.get("Main_class", "").strip()
})

print("Classes found in training metadata:")
for i, label in enumerate(labels):
    print(f"{i}: {label}")

# Find an image that exists in the dataset
image_path = None

for row in rows:
    filename = row.get("Image_name", "").strip()

    if not filename:
        continue

    for dataset_dir in DATASET_DIRS:
        candidate = dataset_dir / filename

        if candidate.is_file():
            image_path = candidate
            break

    if image_path:
        break

if image_path is None:
    raise FileNotFoundError("Could not find an image referenced by the training metadata.")

print(f"\nTest image: {image_path.name}")

# Model settings from the official Swin inference notebook
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = timm.create_model(
    "swin_base_patch4_window12_384",
    pretrained=False,
    num_classes=len(labels),
    img_size=512,
)

# Load the checkpoint
checkpoint = torch.load(
    CHECKPOINT_PATH,
    map_location="cpu",
    weights_only=False,
)

# Inspect checkpoint structure before loading weights
if isinstance(checkpoint, dict):
    print("\nCheckpoint keys:", list(checkpoint.keys())[:20])

    if "state_dict" in checkpoint:
        state_dict = checkpoint["state_dict"]
    elif "model_state_dict" in checkpoint:
        state_dict = checkpoint["model_state_dict"]
    else:
        state_dict = checkpoint
else:
    raise TypeError("Unexpected checkpoint format.")

# Remove a possible DataParallel prefix
state_dict = {
    key.removeprefix("module."): value
    for key, value in state_dict.items()
}

# Strict loading ensures incompatible weights are not silently ignored
model.load_state_dict(state_dict, strict=True)
model = model.to(device)
model.eval()

print(f"Model loaded successfully on: {device}")

# Image preprocessing from the official notebook
transform = transforms.Compose([
    transforms.Resize((512, 512)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.53749797, 0.45875554, 0.40382471],
        std=[0.21629889, 0.20366619, 0.20136241],
    ),
])

image = Image.open(image_path).convert("RGB")
image_tensor = transform(image).unsqueeze(0).to(device)

# Run inference
with torch.inference_mode():
    logits = model(image_tensor)
    probabilities = torch.softmax(logits, dim=1)[0]

predicted_index = int(probabilities.argmax().item())

print("\nPrediction test")
print("------------------------------")
print("Image:", image_path.name)
print("Predicted class:", labels[predicted_index])
print(f"Model score: {probabilities[predicted_index].item():.4f}")
print("\nAll class scores:")

for index in probabilities.argsort(descending=True).tolist():
    print(f"{labels[index]}: {probabilities[index].item():.4f}")