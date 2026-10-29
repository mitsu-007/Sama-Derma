"""Local-only inference helpers for the DermaFair AI Streamlit demo."""

from __future__ import annotations

from dataclasses import dataclass
from hashlib import md5
from io import BytesIO
import json
from pathlib import Path

import timm
import torch
from PIL import Image, ImageOps, UnidentifiedImageError
from torchvision import transforms


PROJECT_ROOT = Path(__file__).resolve().parent
CHECKPOINT_PATH = PROJECT_ROOT / "checkpoints" / "Swin_MC_best_model.pth"
EXPERIMENT_CONFIG_PATH = PROJECT_ROOT / "experiments" / "experiment_config.json"
EXPECTED_CHECKPOINT_MD5 = "1071116c406f14625ccd653bf1fde094"
ARCHITECTURE = "swin_base_patch4_window12_384"
IMAGE_SIZE = 512
NORMALIZE_MEAN = (0.53749797, 0.45875554, 0.40382471)
NORMALIZE_STD = (0.21629889, 0.20366619, 0.20136241)
MAX_UPLOAD_BYTES = 12 * 1024 * 1024
MAX_IMAGE_PIXELS = 40_000_000
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}

EXPECTED_LABEL_ORDER = (
    "Infectious Disorders",
    "Inflammatory Disorders",
    "Keratanisation Disorders",
    "Neoplasms and tumors",
    "No Definite Diagnosis",
    "Other skin disorders",
    "Pigmentary Disorders",
    "Skin Appendages Disorders",
)


class DemoInputError(ValueError):
    """An upload is not a supported, safely decodable image."""


@dataclass
class InferenceEngine:
    model: torch.nn.Module
    labels: tuple[str, ...]
    device: torch.device


def _file_md5(path: Path) -> str:
    digest = md5()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def verified_label_order() -> tuple[str, ...]:
    """Read the preserved experiment label map and cross-check the audit order."""
    if not EXPERIMENT_CONFIG_PATH.is_file():
        raise FileNotFoundError(f"Verified label configuration not found: {EXPERIMENT_CONFIG_PATH}")
    config = json.loads(EXPERIMENT_CONFIG_PATH.read_text(encoding="utf-8"))
    labels = tuple(config.get("model", {}).get("label_order", ()))
    if labels != EXPECTED_LABEL_ORDER or len(labels) != 8:
        raise RuntimeError("The local label order differs from the verified eight-class mapping.")
    return labels


def validate_uploaded_image(data: bytes) -> Image.Image:
    """Decode a supported upload in memory, with byte and pixel limits."""
    if not isinstance(data, bytes) or not data:
        raise DemoInputError("Choose a non-empty image file.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise DemoInputError("This file is larger than the 12 MB upload limit.")

    try:
        with Image.open(BytesIO(data)) as probe:
            if probe.format not in ALLOWED_FORMATS:
                raise DemoInputError("Use a JPEG, PNG, or WebP image.")
            width, height = probe.size
            if width < 1 or height < 1 or width * height > MAX_IMAGE_PIXELS:
                raise DemoInputError("The image dimensions are outside the supported limit.")
            probe.verify()

        with Image.open(BytesIO(data)) as source:
            image = ImageOps.exif_transpose(source)
            width, height = image.size
            if width < 1 or height < 1 or width * height > MAX_IMAGE_PIXELS:
                raise DemoInputError("The oriented image dimensions are outside the supported limit.")
            image.load()
            return image.convert("RGB")
    except DemoInputError:
        raise
    except (UnidentifiedImageError, OSError, ValueError) as error:
        raise DemoInputError("The upload could not be decoded as a valid image.") from error


def load_inference_engine() -> InferenceEngine:
    """Strict-load the verified original checkpoint; never trains or downloads."""
    if not CHECKPOINT_PATH.is_file():
        raise FileNotFoundError(f"The verified model checkpoint is missing: {CHECKPOINT_PATH}")
    actual_md5 = _file_md5(CHECKPOINT_PATH)
    if actual_md5.lower() != EXPECTED_CHECKPOINT_MD5:
        raise RuntimeError("The checkpoint fingerprint does not match the verified DermaFair Swin-B file.")

    labels = verified_label_order()
    model = timm.create_model(
        ARCHITECTURE,
        pretrained=False,
        num_classes=len(labels),
        img_size=IMAGE_SIZE,
    )
    state = torch.load(CHECKPOINT_PATH, map_location="cpu", weights_only=True)
    if not isinstance(state, dict) or not all(isinstance(key, str) for key in state):
        raise TypeError("The checkpoint is not a plain model state dictionary.")
    model.load_state_dict(state, strict=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()
    return InferenceEngine(model=model, labels=labels, device=device)


def predict_image(image: Image.Image, engine: InferenceEngine) -> list[dict[str, float | int | str]]:
    """Return the eight softmax outputs, sorted from largest to smallest."""
    if image.mode != "RGB":
        image = image.convert("RGB")
    transform = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=NORMALIZE_MEAN, std=NORMALIZE_STD),
    ])
    tensor = transform(image).unsqueeze(0).to(engine.device)
    with torch.inference_mode():
        logits = engine.model(tensor)
        if tuple(logits.shape) != (1, len(engine.labels)):
            raise RuntimeError(f"Unexpected model output shape: {tuple(logits.shape)}")
        probabilities = torch.softmax(logits.float(), dim=1)[0]

    if not torch.isfinite(probabilities).all():
        raise RuntimeError("The model returned non-finite scores.")
    probability_sum = float(probabilities.sum().item())
    if abs(probability_sum - 1.0) > 1e-5:
        raise RuntimeError(f"The model scores do not form a probability distribution (sum={probability_sum}).")

    ranked_indices = probabilities.argsort(descending=True).tolist()
    return [
        {
            "class_index": int(index),
            "category": engine.labels[index],
            "probability": float(probabilities[index].item()),
        }
        for index in ranked_indices
    ]
