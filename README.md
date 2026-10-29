# DermaFair AI — starter scaffold

**Project focus:** Fairness-aware dermatological image classification for Indian skin tones.

## Current state

This is an initial UI scaffold only. It does **not** contain a trained model, verified predictions, or experimental results. Do not present the upload preview as diagnosis.

## Run the starter app

Use Python 3.11 if available, then from this folder:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements-app.txt
streamlit run app.py
```

If PowerShell blocks activation, try:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-app.txt
.\.venv\Scripts\python.exe -m streamlit run app.py
```

## Dataset decision

Candidate: DermaCon-IN, a dataset of Indian clinical dermatology images. Before downloading the full release, check:
- disk space and download time (the Harvard Dataverse release is several GB);
- data schema and metadata;
- patient identifiers and predefined splits;
- skin-tone annotations and subgroup counts;
- licence (the release lists CC BY-NC-SA 4.0; non-commercial use and share-alike terms apply).

Dataset links:
- https://doi.org/10.7910/DVN/W7OUZM
- https://papers.nips.cc/paper_files/paper/2025/hash/a2c548b2ed3141400d86a235eaa6fad0-Abstract-Datasets_and_Benchmarks_Track.html

## Four-to-five-day delivery plan

1. **Day 1:** Run the UI, verify environment, inspect dataset metadata and choose a feasible data route.
2. **Day 2:** Prepare data and define a small, justified task; establish patient-safe splits.
3. **Day 3:** Train/adapt a baseline if feasible; save evaluation outputs.
4. **Day 4:** Integrate real inference and any supportable fairness metrics; otherwise clearly label these as pending.
5. **Day 5:** Polish the demo and write a short report based only on completed work.

## Research safeguards

- Split by patient, not image, whenever patient identifiers are available.
- Report real metrics only.
- Do not claim fairness improvement without a controlled comparison.
- Do not claim clinical validation.
- This is an educational research prototype, not a diagnostic tool.
