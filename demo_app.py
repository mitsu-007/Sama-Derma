"""Local Streamlit demo for the verified DermaFair AI Swin-B checkpoint."""

from __future__ import annotations

import hashlib
import re
from pathlib import Path

import pandas as pd
import streamlit as st

from demo_inference import (
    CHECKPOINT_PATH,
    EXPECTED_CHECKPOINT_MD5,
    PROJECT_ROOT,
    DemoInputError,
    load_inference_engine,
    predict_image,
    validate_uploaded_image,
    verified_label_order,
)


st.set_page_config(
    page_title="DermaFair AI | Research demo",
    page_icon="🧴",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
      .stApp { background: #f5f7fb; }
      [data-testid="stAppViewContainer"] { background: #f5f7fb; }
      .block-container { max-width: 1320px; padding-top: 2rem; padding-bottom: 3rem; }
      html, body, [class*="css"] { font-family: Arial, sans-serif; }
      h1, h2, h3 { font-family: Arial, sans-serif; color: #102a43; }
      .hero { padding: 2.2rem 2.4rem; border-radius: 24px; color: #f8fbff;
        background: radial-gradient(circle at 88% 8%, #72d6c9 0, transparent 30%),
        linear-gradient(118deg, #102a43 0%, #183d5d 57%, #26756f 100%);
        box-shadow: 0 18px 45px rgba(16,42,67,.16); margin-bottom: 1.5rem; }
      .hero h1 { color: #fff; font-size: clamp(2.1rem, 4vw, 3.5rem); letter-spacing: -.04em; margin: .35rem 0 .55rem 0; }
      .hero p { color: #e2f2f5; font-size: 1.08rem; max-width: 780px; margin: 0; }
      .eyebrow { color: #a6eee0; text-transform: uppercase; letter-spacing: .14em; font-size: .75rem; font-weight: 700; }
      .tag { display:inline-block; padding:.35rem .7rem; border-radius:999px; background:rgba(255,255,255,.12); color:#ecfbfa; font-size:.82rem; }
      .metric-card { padding: 1rem 1.15rem; border:1px solid #dce5ef; border-radius:16px; background:white; min-height:100px; }
      .metric-label { color:#52677c; font-size:.8rem; text-transform:uppercase; letter-spacing:.06em; }
      .metric-value { color:#102a43; font-family:'Manrope',sans-serif; font-size:1.55rem; font-weight:800; margin-top:.25rem; }
      .soft-card { background:#fff; border:1px solid #dce5ef; border-radius:18px; padding:1.2rem 1.35rem; }
      .small-note { color:#52677c; font-size:.88rem; }
      .warning-card { border-left:5px solid #d48b1f; background:#fff8e9; border-radius:10px; padding:1rem 1.15rem; color:#553a12; }
      .status-dot { display:inline-block; width:.55rem; height:.55rem; margin-right:.45rem; border-radius:50%; background:#1ea78d; }
      [data-testid="stSidebar"] { background:#102a43; }
      [data-testid="stSidebar"] * { color:#ecf4f8; }
      [data-testid="stSidebar"] [data-testid="stRadio"] label { color:#ecf4f8; }
      div[data-testid="stFileUploader"] { background:#fff; border-radius:16px; }
      div.stButton > button[kind="primary"] { background:#137d76; border-color:#137d76; border-radius:10px; font-weight:700; }
      div.stButton > button[kind="primary"]:hover { background:#0e665f; border-color:#0e665f; }
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_resource(show_spinner="Loading the verified Swin-B checkpoint…")
def get_engine():
    return load_inference_engine()


@st.cache_data(show_spinner=False)
def load_evaluation_csv(filename: str) -> pd.DataFrame:
    allowed = {
        "skin_tone_fairness_results_fixed8.csv",
        "fairness_confidence_intervals.csv",
        "per_class_skin_tone_recall.csv",
        "priority_fairness_tests.csv",
    }
    if filename not in allowed:
        raise ValueError("Unapproved evaluation artifact requested.")
    path = PROJECT_ROOT / "evaluation_results" / filename
    if not path.is_file():
        raise FileNotFoundError(f"Evaluation artifact is missing: {filename}")
    return pd.read_csv(path)


def parse_baseline_report() -> dict[str, float | int]:
    path = PROJECT_ROOT / "evaluation_results" / "baseline_report.txt"
    if not path.is_file():
        raise FileNotFoundError("The existing baseline report is missing.")
    report = path.read_text(encoding="utf-8")
    values: dict[str, float | int] = {}
    for label, pattern in {
        "evaluated_images": r"Evaluated images:\s*(\d+)",
        "accuracy": r"Accuracy:\s*([0-9.]+)",
        "macro_f1": r"Macro F1:\s*([0-9.]+)",
    }.items():
        match = re.search(pattern, report)
        if not match:
            raise ValueError(f"Could not find {label} in the saved baseline report.")
        values[label] = int(match.group(1)) if label == "evaluated_images" else float(match.group(1))
    return values


def hero(title: str, subtitle: str, tag: str = "LOCAL RESEARCH DEMO") -> None:
    st.markdown(
        f"""<section class="hero"><span class="eyebrow">{tag}</span>
        <h1>{title}</h1><p>{subtitle}</p></section>""",
        unsafe_allow_html=True,
    )


def metric_card(container, label: str, value: str, note: str = "") -> None:
    container.markdown(
        f"""<div class="metric-card"><div class="metric-label">{label}</div>
        <div class="metric-value">{value}</div><div class="small-note">{note}</div></div>""",
        unsafe_allow_html=True,
    )


with st.sidebar:
    st.markdown("## 🧴 DermaFair AI")
    st.caption("Skin-tone-aware dermatology research")
    page = st.radio(
        "Navigate",
        ["Overview", "Image demo", "Fairness dashboard", "Research notes"],
        label_visibility="collapsed",
    )
    st.divider()
    st.markdown("<span class='status-dot'></span>Local inference only", unsafe_allow_html=True)
    st.caption("Uploaded images are not saved or sent to an external service.")


if page == "Overview":
    hero(
        "A careful look at skin-tone fairness",
        "A local research demonstration of an existing dermatology image classifier—and the evidence limits that shape how its outputs should be read.",
    )
    try:
        labels = verified_label_order()
        mapping_status = f"Verified · {len(labels)} output classes"
    except Exception:
        mapping_status = "Mapping check required"

    top = st.columns(3)
    metric_card(top[0], "Model", "Swin Base", "Original verified checkpoint")
    metric_card(top[1], "Output labels", "08", mapping_status)
    metric_card(top[2], "Experiment status", "Partial", "Arm A: 6 epochs · Arm B: not run")

    st.write("")
    left, right = st.columns([1.25, .75], gap="large")
    with left:
        st.markdown("### What this demo is for")
        st.write(
            "DermaFair AI explores how a dermatology image classifier behaves across observed skin-tone groups. "
            "The demo runs the original Swin-B checkpoint locally and presents its eight broad category scores. "
            "It is a research prototype—not a medical diagnostic device, screening tool, or treatment guide."
        )
        st.markdown("### What it does not establish")
        st.write(
            "A model score is not a calibrated measure of clinical certainty. The current fairness tables are "
            "historical exploratory analyses, and the planned reweighting comparison is incomplete. "
            "No result here demonstrates that a fairness intervention improved performance."
        )
    with right:
        st.markdown("<div class='warning-card'><b>Research use only</b><br><br>"
                    "An image alone is not enough to diagnose a skin condition. Predictions can be wrong, "
                    "including for serious conditions. Do not use this demo for health decisions.</div>",
                    unsafe_allow_html=True)
        st.write("")
        st.markdown("<div class='soft-card'><b>Privacy by design</b><br><br>"
                    "Image bytes are decoded in memory for inference. The app does not upload or write images.</div>",
                    unsafe_allow_html=True)

    st.markdown("### Research snapshot")
    st.markdown(
        "- **Checkpoint:** original Swin-B checkpoint, fingerprint verified against the published artifact.\n"
        "- **Historical baseline:** 1,051 existing test predictions; 70.69% accuracy and 0.4472 macro F1.\n"
        "- **Important limitation:** the upstream training procedure used this test split for checkpoint selection.\n"
        "- **Intervention study:** revision-3 Arm A stopped after six epochs; Arm B did not start."
    )


elif page == "Image demo":
    hero(
        "Explore one image",
        "Upload a permitted JPEG, PNG, or WebP image. The original Swin-B checkpoint returns scores for eight dataset categories.",
        tag="ON-DEVICE INFERENCE · NO IMAGE STORAGE",
    )
    st.warning(
        "Research prototype only—not a diagnosis. Softmax scores are model outputs, not calibrated clinical confidence. "
        "Do not use them to choose care or treatment."
    )
    uploaded = st.file_uploader(
        "Choose a skin image",
        type=["jpg", "jpeg", "png", "webp"],
        help="Maximum 12 MB and 40 megapixels. Avoid uploading identifiable patient images unless you are authorized to use them.",
    )
    if uploaded is None:
        st.markdown("<div class='soft-card'><b>What happens to the image?</b><br><br>"
                    "It is decoded and resized in this process, then passed to the local model. It is not saved to disk or sent elsewhere.</div>",
                    unsafe_allow_html=True)
    else:
        payload = uploaded.getvalue()
        upload_digest = hashlib.sha256(payload).hexdigest()
        try:
            preview = validate_uploaded_image(payload)
            st.image(preview, caption="Preview · processed locally", use_container_width=True)
        except DemoInputError as error:
            st.session_state.pop("demo_prediction", None)
            st.error(str(error))
        else:
            if st.button("Run local inference", type="primary", use_container_width=True):
                try:
                    with st.spinner("Loading the verified model and calculating scores…"):
                        engine = get_engine()
                        scores = predict_image(preview, engine)
                    st.session_state["demo_prediction"] = {
                        "digest": upload_digest,
                        "scores": scores,
                        "device": str(engine.device),
                    }
                except Exception as error:
                    st.session_state.pop("demo_prediction", None)
                    st.error("Inference could not be completed. Check the local model files and environment.")
                    st.caption(f"Details: {type(error).__name__}: {error}")

            result = st.session_state.get("demo_prediction")
            if result and result.get("digest") == upload_digest:
                scores = result["scores"]
                st.success("Local inference completed.")
                st.caption(f"Runtime device: {result['device']}")
                st.markdown("### Model output")
                st.markdown(f"#### Highest score: {scores[0]['category']}")
                st.caption(
                    "This is the category with the largest softmax score for this input. "
                    "The score does not indicate the chance that the category is medically correct."
                )
                chart = pd.DataFrame(
                    {"Model score": [row["probability"] for row in scores]},
                    index=[row["category"] for row in scores],
                )
                st.bar_chart(chart, horizontal=True, x_label="Softmax score", y_label="Dataset category", width="stretch")
                display = pd.DataFrame(scores)[["class_index", "category", "probability"]].copy()
                display["probability"] = display["probability"].map(lambda x: f"{x:.1%}")
                st.dataframe(display, hide_index=True, width="stretch")
                st.caption("Scores sum to 100% by construction; they have not been calibrated for clinical use.")


elif page == "Fairness dashboard":
    hero(
        "What the existing evidence shows",
        "Historical subgroup summaries from saved evaluation artifacts. These describe the original checkpoint’s previous test predictions; they are not fresh app evaluations.",
        tag="EXPLORATORY · HISTORICAL TEST RESULTS",
    )
    st.error(
        "The upstream checkpoint was selected using this test split as validation, and fairness hypotheses were examined on the same results. "
        "Treat every test-set comparison below as exploratory, not confirmatory."
    )
    try:
        overall = parse_baseline_report()
        group_metrics = load_evaluation_csv("skin_tone_fairness_results_fixed8.csv")
        accuracy_cis = load_evaluation_csv("fairness_confidence_intervals.csv")
        diagnosis_recall = load_evaluation_csv("per_class_skin_tone_recall.csv")
        priority = load_evaluation_csv("priority_fairness_tests.csv")
    except Exception as error:
        st.error("A saved evaluation artifact could not be loaded.")
        st.caption(f"Details: {type(error).__name__}: {error}")
    else:
        cols = st.columns(3)
        metric_card(cols[0], "Existing evaluated images", f"{overall['evaluated_images']:,}", "Saved test predictions")
        metric_card(cols[1], "Accuracy", f"{overall['accuracy']:.1%}", "Historical overall result")
        metric_card(cols[2], "Macro F1", f"{overall['macro_f1']:.4f}", "Historical overall result")

        st.markdown("### Group-level results")
        st.caption("Support, accuracy, and eight-class macro F1 from the existing fixed-eight-class summary.")
        fitz, monk = st.tabs(["Fitzpatrick", "Monk"])
        for tab, scale in [(fitz, "Fitzpatrick"), (monk, "Monk")]:
            with tab:
                frame = group_metrics.loc[group_metrics["Grouping"] == scale].copy()
                frame = frame.rename(columns={
                    "Skin_tone_group": "Skin-tone group",
                    "n": "Support",
                    "correct": "Correct",
                    "accuracy": "Accuracy",
                    "macro_f1_all_8_classes": "Macro F1 (8 classes)",
                })
                frame = frame[["Skin-tone group", "Support", "Correct", "Accuracy", "Macro F1 (8 classes)"]]
                frame["Accuracy"] = frame["Accuracy"].map(lambda x: f"{x:.1%}")
                frame["Macro F1 (8 classes)"] = frame["Macro F1 (8 classes)"].map(lambda x: f"{x:.3f}")
                st.dataframe(frame, hide_index=True, width="stretch")

        st.markdown("### Accuracy uncertainty")
        st.caption("The following 95% intervals are copied from the existing saved analysis; small groups have wide uncertainty.")
        ci_scale = st.selectbox("Skin-tone scale", ["Fitzpatrick", "Monk"], key="ci_scale")
        ci = accuracy_cis.loc[accuracy_cis["Scale"] == ci_scale].copy()
        ci = ci.rename(columns={"Group": "Group", "N": "Support", "Accuracy": "Accuracy", "CI95_Lower": "95% CI lower", "CI95_Upper": "95% CI upper"})
        ci = ci[["Group", "Support", "Accuracy", "95% CI lower", "95% CI upper"]]
        for col in ["Accuracy", "95% CI lower", "95% CI upper"]:
            ci[col] = ci[col].map(lambda x: f"{x:.1%}")
        st.dataframe(ci, hide_index=True, width="stretch")

        st.markdown("### Diagnosis-specific recall and support")
        selected_diagnosis = st.selectbox("Diagnosis", list(verified_label_order()), key="diagnosis_recall")
        scale = st.selectbox("Skin-tone annotation", ["Fitzpatrick", "Monk"], key="recall_scale")
        recall = diagnosis_recall.loc[
            (diagnosis_recall["Grouping"] == scale)
            & (diagnosis_recall["Disease_class"] == selected_diagnosis)
        ].copy()
        recall = recall.rename(columns={
            "Skin_tone_group": "Skin-tone group",
            "Support": "Support",
            "Correct": "Correct",
            "Recall": "Recall",
        })
        recall = recall[["Skin-tone group", "Support", "Correct", "Recall"]]
        recall["Recall"] = recall["Recall"].map(lambda x: f"{x:.1%}")
        st.dataframe(recall, hide_index=True, width="stretch")

        st.markdown("### Historical Pigmentary Disorders comparison")
        row = priority.loc[
            (priority["Scale"] == "Fitzpatrick")
            & (priority["Diagnosis"] == "Pigmentary Disorders")
            & (priority["Group_A"] == "FST 3")
            & (priority["Group_B"] == "FST 5")
        ]
        if not row.empty:
            item = row.iloc[0]
            gap = st.columns(4)
            metric_card(gap[0], "FST 3 recall", f"{item['A_recall']:.1%}", f"{int(item['A_correct'])}/{int(item['A_n'])} correct")
            metric_card(gap[1], "FST 5 recall", f"{item['B_recall']:.1%}", f"{int(item['B_correct'])}/{int(item['B_n'])} correct")
            metric_card(gap[2], "Difference", f"{item['Difference_A_minus_B_pp']:+.1f} pp", "FST 3 minus FST 5")
            metric_card(gap[3], "Holm-adjusted p", f"{item['Holm_adjusted_p']:.3f}", "Historical saved test analysis")
        st.caption(
            "This pre-existing subgroup comparison is post hoc and tied to a checkpoint selected using the same test split. "
            "It does not prove causal bias, fairness, or a successful intervention."
        )
        st.info("Revision-3 Arm A is incomplete and Arm B did not run. Neither partial Arm A metrics nor these historical figures are evidence of an intervention effect.")


else:
    hero(
        "Methods, status, and limitations",
        "A concise model card for this local research prototype.",
        tag="MODEL & RESEARCH NOTES",
    )
    st.markdown("### Model and preprocessing")
    st.markdown(
        "- **Architecture:** timm `swin_base_patch4_window12_384`, configured for 512 × 512 inputs and eight output classes.\n"
        "- **Checkpoint:** original `checkpoints/Swin_MC_best_model.pth`; MD5 verified against the published artifact.\n"
        "- **Inference preprocessing:** RGB conversion, resize to 512 × 512, tensor conversion, and the verified channel normalization.\n"
        "- **Class mapping:** fixed sorted `Main_class` order from the preserved experiment configuration and audited training artifacts."
    )
    try:
        for index, label in enumerate(verified_label_order()):
            st.write(f"**{index}.** {label}")
    except Exception as error:
        st.error(f"Class mapping could not be verified: {error}")

    st.markdown("### Current research status")
    st.write(
        "Revision 3 Arm A completed six of seven planned epochs and was stopped at a completed epoch boundary. "
        "Arm B was not run. Its model-only checkpoint is not an exact-resume checkpoint. "
        "The demo intentionally uses the original verified checkpoint, not the incomplete Arm A model."
    )
    st.markdown("### Limitations")
    st.markdown(
        "- The output categories are broad dataset labels, not diagnoses.\n"
        "- The model has not been clinically validated and may fail unpredictably on images unlike its training data.\n"
        "- Softmax scores are not calibrated clinical confidence.\n"
        "- Existing subgroup metrics are historical, exploratory test-set summaries with uneven and sometimes sparse support.\n"
        "- Upstream checkpoint selection used the test split; a new independent cohort is needed for confirmatory claims.\n"
        "- No Swin-compatible explanation map has been validated for this demo; no heatmap is shown."
    )
    st.markdown("### Dataset")
    st.write("DermaCon-IN clinical dermatology images and metadata. See the [Harvard Dataverse record](https://doi.org/10.7910/DVN/W7OUZM) and its license/usage terms before reuse.")
    st.markdown("### Intended use")
    st.warning(
        "Educational research demonstration only. Not a medical device or diagnostic service. "
        "Never use an image-only model output to make health decisions."
    )


st.divider()
st.caption(
    f"Local research prototype · original checkpoint MD5 {EXPECTED_CHECKPOINT_MD5} · "
    "no training, external inference, or uploaded-image storage"
)
