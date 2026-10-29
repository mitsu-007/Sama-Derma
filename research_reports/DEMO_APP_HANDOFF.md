# DermaFair AI local demo handoff

## Files created

- `demo_app.py` — standalone Streamlit interface; existing `app.py` was left unchanged.
- `demo_inference.py` — local image validation, verified checkpoint loading, preprocessing, and inference helpers.

No training was started. No datasets, checkpoints, split files, existing predictions, evaluation reports, or existing research reports other than the requested handoff summary were changed. No image is written to disk or sent to an external inference service.

## Launch

From the project root in PowerShell:

```powershell
.\.venv\Scripts\python.exe -m streamlit run demo_app.py
```

Open the local URL printed by Streamlit (normally `http://localhost:8501`). The verified original checkpoint must remain at `checkpoints/Swin_MC_best_model.pth` and `experiments/experiment_config.json` must remain available for label-order verification.

## Environment and model

The tested project environment has Python 3.11.0, Streamlit 1.66.1, PyTorch 2.11.0+cu128, timm 1.0.30, torchvision 0.26.0+cu128, Pillow 13.0.0, and pandas 3.1.0. CUDA was available on the RTX 3050. The app also selects CPU when CUDA is unavailable.

The app loads only the original `checkpoints/Swin_MC_best_model.pth`; its expected MD5 is `1071116c406f14625ccd653bf1fde094`. Architecture is timm `swin_base_patch4_window12_384`, configured with 512-pixel input and eight outputs. Input preprocessing is RGB, resize to 512×512, tensor conversion, then channel normalization with means `(0.53749797, 0.45875554, 0.40382471)` and standard deviations `(0.21629889, 0.20366619, 0.20136241)`. Output labels are verified against the preserved experiment config:

0. Infectious Disorders
1. Inflammatory Disorders
2. Keratanisation Disorders
3. Neoplasms and tumors
4. No Definite Diagnosis
5. Other skin disorders
6. Pigmentary Disorders
7. Skin Appendages Disorders

## Verification performed

- Strict checkpoint loading succeeded; there were no missing or unexpected model-state keys.
- Inference on `dataset/DATASET_0/IMG_0002.jpg` succeeded on CUDA. The output contained eight finite scores, in the verified class order, summing to `1.0000000088` (floating-point precision).
- Empty bytes, invalid image bytes, and an upload above the 12 MB limit were rejected with handled input errors. The upload validator also limits formats to JPEG/PNG/WebP and decoded size to 40 megapixels.
- Streamlit headless startup returned HTTP 200 at `/_stcore/health`. Streamlit `AppTest` rendered Overview, Image demo, Fairness dashboard, and Research notes with no exceptions.
- The official test split was not loaded for app verification. The inference sample came from the training-image directory.
- Protected hashes remained unchanged: original checkpoint MD5 `1071116c406f14625ccd653bf1fde094`; `data/metadata/test_split-1.csv` SHA-256 `8e83c029afb5ef7eec05968763b240060e8caecef854bb43fa0b66676f3dd496`; existing `evaluation_results/test_predictions.csv` SHA-256 `9bbdb4cddfdf0fafbd4dd81ffc95de306d6da185a713a67284e5a2b82ac8e351`; existing `evaluation_results/baseline_report.txt` SHA-256 `020134495912d10ac4d1e4e499fb20bfd496a997980f228518b73218e792710`.

## What the app displays

- Overview of intended research use and status.
- Local image upload/preview, guarded decoding, predicted category, and eight softmax scores.
- Existing historical subgroup support, accuracy, macro F1, accuracy intervals, diagnosis-specific recall/support, and the saved FST 3 versus FST 5 Pigmentary Disorders comparison where present.
- Model, preprocessing, mapping, experiment status, intended use, and limitations.

Historical evaluation values are identified as exploratory because the upstream checkpoint was selected using the same test split and subgroup hypotheses were examined on those results. The app does not claim an intervention improved fairness and does not display partial Arm A outcomes as an intervention result.

## Limitations and unfinished features

- The output is a broad dataset category prediction, not a diagnosis. Softmax values are not calibrated clinical confidence; the app warns against health decisions and notes that an image alone is insufficient.
- This is not a medical device and has no clinical validation.
- Existing subgroup estimates are historical and exploratory, with uneven and sometimes sparse support. They do not establish causal bias or confirmatory fairness.
- No Grad-CAM or heatmap is implemented. A Swin explanation method was not validated here, so an approximate explanation is not presented.
- Image upload and rendering were exercised through helper-level validation and Streamlit page rendering; browser-specific file-uploader interaction was not automated.
- The historical CSVs are expected to retain their current headers. Missing or malformed artifacts produce an on-page error rather than fabricated metrics.
