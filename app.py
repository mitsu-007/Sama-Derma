
import csv
from pathlib import Path

import streamlit as st
import torch
import timm
import torchvision.transforms as transforms
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent
CHECKPOINT_PATH = BASE_DIR / "checkpoints" / "Swin_MC_best_model.pth"
METADATA_PATH = BASE_DIR / "data" / "metadata" / "train_split-1.csv"

st.set_page_config(
    page_title="DermaFair AI",
    page_icon="🔬",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown("""
<style>
.block-container {padding-top: 2rem; padding-bottom: 3rem; max-width: 1200px;}
.hero {
    padding: 1.6rem 1.8rem; border-radius: 18px;
    background: linear-gradient(120deg, #102a43, #243b53);
    color: #f5f7fa; margin-bottom: 1.2rem;
}
.hero h1 {margin: 0 0 .45rem 0; font-size: 2.2rem;}
.hero p {margin: 0; color: #d9e2ec; font-size: 1.02rem;}
.tag {
    display: inline-block; border: 1px solid #829ab1; color: #d9e2ec;
    border-radius: 999px; padding: .2rem .65rem; font-size: .8rem;
    margin-bottom: .7rem;
}
.status {
    padding: 1rem; border: 1px solid #d9e2ec; border-radius: 12px;
    background: rgba(130,154,177,.08); min-height: 100px;
}
.small-muted {color: #627d98; font-size: .9rem;}
</style>
""", unsafe_allow_html=True)


@st.cache_resource
def load_model():
    if not CHECKPOINT_PATH.is_file():
        raise FileNotFoundError(f"Checkpoint not found: {CHECKPOINT_PATH}")

    if not METADATA_PATH.is_file():
        raise FileNotFoundError(f"Training metadata not found: {METADATA_PATH}")

    with open(METADATA_PATH, "r", encoding="utf-8-sig", newline="") as file:
        rows = list(csv.DictReader(file))

    labels = sorted({
        row["Main_class"].strip()
        for row in rows
        if row.get("Main_class", "").strip()
    })

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    model = timm.create_model(
        "swin_base_patch4_window12_384",
        pretrained=False,
        num_classes=len(labels),
        img_size=512,
    )

    checkpoint = torch.load(
        CHECKPOINT_PATH,
        map_location="cpu",
        weights_only=False,
    )

    if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
        state_dict = checkpoint["state_dict"]
    elif isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        state_dict = checkpoint["model_state_dict"]
    else:
        state_dict = checkpoint

    state_dict = {
        key.removeprefix("module."): value
        for key, value in state_dict.items()
    }

    # Strict loading prevents silently ignoring incompatible weights.
    model.load_state_dict(state_dict, strict=True)
    model.to(device)
    model.eval()

    return model, labels, device


def preprocess_image(image):
    transform = transforms.Compose([
        transforms.Resize((512, 512)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.53749797, 0.45875554, 0.40382471],
            std=[0.21629889, 0.20366619, 0.20136241],
        ),
    ])
    return transform(image).unsqueeze(0)


with st.sidebar:
    st.title("🔬 DermaFair AI")

    page = st.radio(
        "Navigation",
        ["Overview", "Image Demo", "Evaluation & Fairness", "Research Notes"],
    )

    st.divider()
    st.caption("Research prototype · In development")
    st.caption("Pretrained model integration")


if page == "Overview":
    st.markdown("""
    <div class="hero">
      <span class="tag">Research prototype · In development</span>
      <h1>DermaFair AI</h1>
      <p>Investigating whether dermatology AI performance differs across skin-tone groups.</p>
    </div>
    """, unsafe_allow_html=True)

    st.subheader("Research objective")
    st.write(
        "Evaluate an existing dermatology image-classification model and investigate "
        "its performance across skin-tone groups where sample sizes permit meaningful analysis."
    )

    c1, c2, c3 = st.columns(3)

    with c1:
        st.markdown(
            '<div class="status"><b>Dataset audit</b><br>'
            '<span class="small-muted">Image and metadata mapping verified</span></div>',
            unsafe_allow_html=True,
        )

    with c2:
        st.markdown(
            '<div class="status"><b>Baseline model</b><br>'
            '<span class="small-muted">Pretrained checkpoint available</span></div>',
            unsafe_allow_html=True,
        )

    with c3:
        st.markdown(
            '<div class="status"><b>Fairness evaluation</b><br>'
            '<span class="small-muted">Pending experiments</span></div>',
            unsafe_allow_html=True,
        )

    st.subheader("Next steps")
    st.markdown("""
    1. Verify the original checkpoint's class-to-index mapping.
    2. Test inference using the pretrained model.
    3. Evaluate predictions on the held-out test set.
    4. Compare performance across sufficiently represented skin-tone groups.
    """)

    st.info(
        "Educational research prototype only. This application is not a medical device "
        "and must not be used to diagnose a skin condition or choose treatment."
    )


elif page == "Image Demo":
    st.title("Image Demo")
    st.write(
        "Upload an image to test the pretrained classifier. It predicts one of eight "
        "broad categories in the dataset."
    )

    uploaded = st.file_uploader(
        "Choose a skin image",
        type=["jpg", "jpeg", "png", "webp"],
        help="Use images you are permitted to use for research. Avoid identifiable patient data.",
    )

    if uploaded is not None:
        try:
            image = Image.open(uploaded).convert("RGB")
            st.image(image, caption="Uploaded image", use_container_width=True)

            if st.button("Run model prediction", type="primary"):
                with st.spinner("Loading model and running inference..."):
                    model, labels, device = load_model()
                    tensor = preprocess_image(image).to(device)

                    with torch.inference_mode():
                        logits = model(tensor)
                        probabilities = torch.softmax(logits, dim=1)[0]

                    ranked = probabilities.argsort(descending=True).tolist()

                st.success("Inference completed.")
                st.caption(f"Device: {device}")

                st.subheader("Model output")
                st.write(f"**Top predicted category:** {labels[ranked[0]]}")
                st.write(
                    f"**Model score:** {probabilities[ranked[0]].item():.1%}"
                )

                st.caption(
                    "The score is the model's output probability, not the probability "
                    "that the prediction is medically correct."
                )

                st.subheader("Scores for all categories")

                for index in ranked:
                    score = probabilities[index].item()
                    st.write(f"{labels[index]} — {score:.1%}")
                    st.progress(score)

                st.warning(
                    "Research demonstration only. Predictions may be incorrect and "
                    "are not medical diagnoses. Do not use them to make healthcare decisions."
                )

        except Exception as error:
            st.error("The model could not complete inference.")
            st.exception(error)


elif page == "Evaluation & Fairness":
    st.title("Evaluation & Fairness")
    st.write(
        "Evaluation metrics will appear here after predictions have been generated "
        "on the held-out test set."
    )

    st.warning("Overall and skin-tone subgroup evaluation is not yet complete.")

    c1, c2 = st.columns(2)

    with c1:
        st.subheader("Overall performance")
        st.markdown(
            "- Accuracy: **Pending**\n"
            "- Macro-F1: **Pending**\n"
            "- Per-class recall: **Pending**\n"
            "- Confusion matrix: **Pending**"
        )

    with c2:
        st.subheader("Skin-tone subgroup analysis")
        st.markdown(
            "- Group sample counts: **Pending**\n"
            "- Subgroup metrics: **Pending**\n"
            "- Uncertainty estimates: **Pending**"
        )

    st.caption(
        "Metrics will only be reported where the labels, evaluation method, "
        "and subgroup sample sizes support meaningful interpretation."
    )


else:
    st.title("Research Notes")

    st.subheader("Working research question")
    st.write(
        "How does a pretrained dermatology image classifier perform across available "
        "skin-tone groups in an Indian clinical image dataset?"
    )

    st.subheader("Methodological safeguards")
    st.markdown("""
    - Keep the held-out test set separate from training and model selection.
    - Verify the original model's class mapping and image preprocessing.
    - Report subgroup sample sizes alongside metrics.
    - Investigate disease-distribution and image-quality differences.
    - Do not claim fairness improvements unless an intervention is tested.
    - Treat the application as an educational research prototype, not a diagnostic tool.
    """)

    st.subheader("Dataset")
    st.markdown(
        "[DermaCon-IN on Harvard Dataverse](https://doi.org/10.7910/DVN/W7OUZM)"
    )
