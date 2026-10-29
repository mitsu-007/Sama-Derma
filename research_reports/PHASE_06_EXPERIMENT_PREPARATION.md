# Phase 6 — Matched experiment preparation and compute gate

## Objective

Verify the prior handoff, create a deterministic training-only subject-disjoint split, investigate fresh pretrained Swin weights, specify matched arms and stopping rules, and measure disposable training throughput without starting full training or evaluating the official test set.

## Prior findings verified

- Rechecked the phase 1–5 reports against the CSVs, checkpoint, local environment, and existing reports.
- Training metadata has 4,399 rows and the SHA-256 in `experiment_config.json`; the resulting fold and manifest regenerate exactly with the specified splitter.
- Existing `baseline_report.txt` contains 1,051 evaluated images, accuracy 0.706946, and macro F1 0.447159. The existing priority CSV contains FST 3 Pigmentary Disorders 28/48 and FST 5 38/44, matching the handoff. These are previously saved figures; this phase ran no test inference or evaluation.
- The current checkpoint hash, label map, installed package versions, and CUDA status agree with the previous phase reports.

## Subject-disjoint training/validation split

- Source: `data/metadata/train_split-1.csv` only; the preparation script contains no path or read of the official test metadata.
- Method: `StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=20261026)`, fold 0; group by `Subject_ID`, stratify by `Main_class`, using scikit-learn 1.9.1.
- Result: 3,519 training rows / 1,917 subjects; 880 validation rows / 479 subjects; zero subject and image overlap. The exact fold is deterministic and was independently recomputed against the saved manifest.
- All eight diagnoses occur in validation; support is 6 for No Definite Diagnosis and 8 for Neoplasms and tumors, so their validation class metrics will be noisy.
- The official test split was not opened by the split or benchmark scripts and remains unchanged.

## Fresh ImageNet-pretrained Swin investigation

- The installed timm configuration resolves `swin_base_patch4_window12_384` tag `ms_in22k_ft_in1k` to `swin_base_patch4_window12_384_22kto1k.pth` in the official Swin Transformer release.
- The matching artifact is not present in the checked Torch/Hugging Face caches. The official release asset listing reports 348 MB.
- `shutil.disk_usage('C:/')` reported 122.498 GiB free, sufficient for the weight file and planned outputs. No download was attempted.
- A direct metadata-only HEAD request could not connect from the execution environment, including after escalation. Thus the asset is listed by the official release but machine-side download reachability remains unresolved. A SHA-256 must be recorded after an authorized/reachable download and before training.

## Frozen matched-arm design

Full parameters are in `experiments/experiment_config.json` and the human-readable protocol in `experiments/PROPOSED_PROTOCOL.md`.

- Arm A uses the upstream-style inverse diagnosis-frequency image sampler, `w_i = 1/n_y`.
- Arm B multiplies that by a capped square-root inverse diagnosis/Fitzpatrick frequency: `q_(y,g) = min(3, max(1, sqrt(n_y/n_(y,g))))` for cells with at least 20 unique training subjects; otherwise `q=1`. It normalizes raw weights by their **sum within each diagnosis**, so every class has the same total sampler mass as Arm A. All counts and eligibility use only the training partition; missing tone and sparse cells retain baseline weight.
- The generated training partition has 16 eligible cells out of 32 observed diagnosis/FST cells at the 20-subject threshold.
- Shared training proposal: fresh ImageNet pretrained backbone, same seeded classifier head, 512×512, official normalization and flip/rotation augmentation, batch 2 with accumulation 4, fp16 autocast + GradScaler, AdamW lr 1e-4 / weight decay 1e-4, label-smoothed cross entropy (0.1), cosine schedule for at most 12 epochs.
- Checkpoint selection: best validation eight-class macro F1; differences below 0.002 count as ties resolved by lower validation loss. Stop each arm after four epochs without a ≥0.002 macro-F1 gain, or at 12 epochs. Test results cannot tune or select anything.

## Disposable GPU benchmark

- Ran `experiments/benchmark_smoke.py` on five measured and two warm-up steps, batch 2, 512×512, random initialization (`pretrained=False`), fp16 autocast, and five batches drawn from the first rows of the training CSV. It included image decode, transforms, and optimizer steps.
- No weights were saved. Median step time was 0.3706 s/batch; mean 0.3753 s/batch. Peak allocated/reserved GPU memory was 3.54/3.84 GiB on the RTX 3050 6 GB.
- This short sample is a planning estimate, not an epoch guarantee. The reported pre-run system use was 1,455 MiB, leaving less than 1 GiB nominal reserve at the measured peak; background GPU use could cause memory pressure.

## Compute and storage estimate

- Training partition has 3,519 images; batch 2 gives 1,760 microbatches per epoch.
- At 0.3706 seconds per measured microbatch: approximately 10.9 minutes of training steps per epoch, 2.18 hours per 12-epoch arm, and 4.35 hours for two full arms. Reserve about **5.5–6 hours** including validation, checkpoint I/O, initialization, and runtime variation. Early stopping may reduce this.
- Pretrained initialization is about 348 MB; two selected model checkpoints add about 696 MB. With temporary working space, reserving 2 GB is adequate; 122.5 GiB was free at the check.

## Files created or changed

- Created `experiments/prepare_split.py`, `experiments/benchmark_smoke.py`, `experiments/experiment_config.json`, `experiments/PROPOSED_PROTOCOL.md`, `experiments/train_val_split_manifest.csv`, `experiments/train_val_split_summary.json`, and `experiments/smoke_benchmark.json`.
- Updated only the new `research_reports/HANDOFF_SUMMARY.md` and created this phase report.
- No full training, pretrained-weight download, test evaluation, existing checkpoint write, source data edit, or existing result edit occurred.

## Errors and failed attempts

- Disk space via PowerShell/CIM and `fsutil` was unavailable in the sandbox; Python `shutil.disk_usage` successfully measured free space.
- The metadata-only request to the official pretrained weight URL could not connect. The official release asset listing was available through read-only browsing, so size could be checked without downloading.

## Scientific assumptions and unresolved questions

- The source test set has historical selection leakage; any future evaluation on it is exploratory, not confirmatory.
- The fresh pretrained asset's machine-side reachability and checksum remain unverified. Do not begin training until the exact file is downloaded from the listed official source and its local hash is recorded.
- Batch-2 VRAM reserve is limited and workload contention can vary. If training OOMs, reduce microbatch to 1 and double accumulation to preserve effective batch 8; do not change other arm settings.
- Short smoke timing has uncertainty; use it as a budget estimate, not a promise.
- Validation supports for rare classes are small; report support and uncertainty and avoid treating these metrics as stable.

## Recommended next phase

Resolve pretrained-weight reachability and verify its local checksum. Then, only after that gate passes, run the two configured arms within a 5.5–6-hour budget, saving outputs only in their new per-arm directories. Do not evaluate the official test set during training or selection.
