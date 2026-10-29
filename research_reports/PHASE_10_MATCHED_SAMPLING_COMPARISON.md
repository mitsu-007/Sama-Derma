# Phase 10 — Matched sampling-strategy comparison

## Objective and decision

Complete a paired comparison of standard class-balanced sampling (Arm A) and the prespecified capped Fitzpatrick-aware sampling strategy (Arm B), starting from the same verified ImageNet-pretrained Swin-B initialization and using the saved subject-disjoint training/validation split. Keep the official test split untouched.

Both arms completed seven epochs and selected their checkpoints using validation macro F1 under the frozen rule. The intervention reduced the point-estimated FST 3 versus FST 5 Pigmentary Disorders recall gap, but had lower overall accuracy and macro F1, lower recall for several classes, and a paired subject-bootstrap interval for the gap change that includes zero. The fairness hypothesis is **unresolved**; this run does not support a general fairness-improvement claim.

## Audit and preserved prior state

- Read `AGENTS.md`, `README.md`, `PROJECT_STATUS.md`, the handoff, Phase 9, revision-3 artifacts, and the existing run implementation before starting.
- Revision 3 Arm A had six completed epochs, with an epoch-6 selected checkpoint and validation predictions; it lacked optimizer/scheduler/scaler/RNG/sampler state and was not resumable. Revision-3 Arm B had never started.
- A fresh matched restart was feasible under the prior 5.5-hour budget. Revision-4 preflight reported a 4.296-hour guarded estimate (15,464 seconds including startup) and 5.032 GiB free VRAM. It verified 3,519 training rows / 1,917 subjects, 880 validation rows / 479 subjects, zero subject overlap, exact pretrained SHA-256, architecture compatibility, and per-class sampler mass of 1.0 in both arms.
- Revision 4 Arm A completed seven epochs. Its subsequent Arm B start was safely refused: only 3.813 GiB VRAM was free, below the configured 4.5 GiB minimum. `failure.json` records this; zero B epochs ran in revision 4.
- A separate revision-5 runner reused the byte-identical revision-4 configuration (SHA-256 `75a9b4da27d1002cab0f51cc77747dbbd093646f5507c9675db63aee8fc04872`), verified the completed revision-4 Arm A status, epoch count, configuration hash and checkpoint fingerprint, and trained only Arm B from the common pretrained initialization. The A and B run configurations have the same protocol hash and initial classifier-head SHA-256 `5da21077fc8d294b6c243cb446f16b6b14d2386fb863e88471421bc611b0242f`.
- One initial revision-5 launch was rejected before creating its run directory because the paired-config verifier looked for the hash in Arm A's `run_result.json`; the runner correctly records it in `run_config.json`. The new runner was fixed to read the preserved run config, then passed preflight and the result/checkpoint checks. No existing run artifact was changed by this correction.
- Official initialization: `experiments/pretrained/swin_base_patch4_window12_384_22kto1k.pth`, SHA-256 `0f6f7d28cb1ddf43af5583163310b29cb3805a32044f226025352494702c606e`.
- Shared settings: seed 20261026; Swin-B at 512×512; microbatch 1, accumulation 8 (effective batch 8); two pinned persistent workers; AdamW; fp16 autocast/GradScaler; label-smoothed cross entropy; cosine schedule; the same train/validation transforms and validation selection. The only experimental difference is the prespecified sampler.
- Arm A uses per-image weight `1/n_y`. Arm B uses training-partition counts only: for diagnosis-tone cells with at least 20 unique subjects, `q_(y,g)=min(3,max(1,sqrt(n_y/n_(y,g))))`; otherwise tone factor 1. Raw weight is `(1/n_y)*q_(y,g)`, normalized within diagnosis so each diagnosis has total sampler mass 1.
- Both selected epoch 7. Arm A training time was 4,910.02 seconds; Arm B was 4,751.83 seconds. Combined training time was 9,661.85 seconds (2.684 hours), plus separate preflight/startup. Peak reserved VRAM recorded in epoch logs was 2.746 GiB for both. GPU use after completion returned to approximately 1.0 GiB / 6 GiB and 3% utilization.
- The revision-5 manifest is completed and records the external paired Arm A result. The official test split was not read by either run. No additional test inference was run for this comparison.

Commands used:

```powershell
.\.venv\Scripts\python.exe -u experiments\revision_04\run_experiments.py --preflight-only
.\.venv\Scripts\python.exe -u experiments\revision_04\run_experiments.py
.\.venv\Scripts\python.exe -u experiments\revision_05\run_paired_arm_b.py --preflight-only
.\.venv\Scripts\python.exe -u experiments\revision_05\run_paired_arm_b.py --paired-arm-a-result experiments\revision_04\runs_revision_04\A_standard_class_balanced\run_result.json
```

## Validation results

Both arms evaluated the same 880 images from 479 subjects. B-minus-A deltas are from each arm's validation-selected checkpoint.

| Metric | Arm A: class-balanced | Arm B: capped tone-aware | B − A |
|---|---:|---:|---:|
| Accuracy | 71.48% | 67.05% | −4.43 pp |
| Macro F1 (8 classes) | 0.4923 | 0.4660 | −0.0262 |
| Cross-entropy loss | 1.1805 | 1.2051 | +0.0246 |

Paired subject-cluster bootstrap (10,000 resamples, seed 20261028) 95% percentile intervals for the deltas were −6.83 to −2.10 percentage points for accuracy and −0.0475 to −0.0064 for macro F1. These quantify validation-subject sampling uncertainty conditional on these fitted checkpoints; they do not include training-seed or model-selection uncertainty.

### Per-class validation metrics

| Diagnosis | Support | Arm A P / R / F1 | Arm B P / R / F1 | Recall delta |
|---|---:|---:|---:|---:|
| Infectious Disorders | 362 | 0.766 / 0.815 / 0.790 | 0.737 / 0.729 / 0.733 | −0.086 |
| Inflammatory Disorders | 257 | 0.626 / 0.626 / 0.626 | 0.578 / 0.619 / 0.598 | −0.008 |
| Keratanisation Disorders | 12 | 0.636 / 0.583 / 0.609 | 0.538 / 0.583 / 0.560 | 0.000 |
| Neoplasms and tumors | 8 | 0.182 / 0.250 / 0.211 | 0.182 / 0.250 / 0.211 | 0.000 |
| No Definite Diagnosis | 6 | 0.000 / 0.000 / 0.000 | 0.000 / 0.000 / 0.000 | 0.000 |
| Other skin disorders | 26 | 0.429 / 0.115 / 0.182 | 0.600 / 0.115 / 0.194 | 0.000 |
| Pigmentary Disorders | 133 | 0.797 / 0.797 / 0.797 | 0.765 / 0.759 / 0.762 | −0.038 |
| Skin Appendages Disorders | 76 | 0.724 / 0.724 / 0.724 | 0.635 / 0.711 / 0.671 | −0.013 |

### Fitzpatrick-group metrics

| Fitzpatrick group | Support | Arm A accuracy / macro F1 | Arm B accuracy / macro F1 | Accuracy delta |
|---|---:|---:|---:|---:|
| FST 3 | 213 | 0.6854 / 0.3519 | 0.6620 / 0.3456 | −2.35 pp |
| FST 4 | 433 | 0.7321 / 0.4837 | 0.6674 / 0.4345 | −6.47 pp |
| FST 5 | 212 | 0.7028 / 0.5233 | 0.6698 / 0.5338 | −3.30 pp |
| FST 6 | 19 | 0.8947 / 0.4531 | 0.9474 / 0.4778 | +5.26 pp |
| Missing | 3 | 0.0000 / 0.0000 | 0.0000 / 0.0000 | 0.00 pp |

Detailed diagnosis-by-Fitzpatrick support, correct count, recall, and B-minus-A recall delta for every observed cell are in `experiments/revision_05/runs_revision_05/paired_validation_uncertainty.json`.

### Pigmentary Disorders FST 3 versus FST 5

| Group | Support | Arm A correct / recall (95% subject-bootstrap CI) | Arm B correct / recall (95% subject-bootstrap CI) |
|---|---:|---:|---:|
| FST 3 | 31 | 25/31 = 80.65% (64.00–95.65%) | 24/31 = 77.42% (58.33–94.74%) |
| FST 5 | 35 | 26/35 = 74.29% (55.56–88.37%) | 27/35 = 77.14% (59.09–90.48%) |

The FST 3 minus FST 5 recall gap was +6.36 pp for A and +0.28 pp for B, a B-minus-A change of −6.08 pp. The paired subject-bootstrap interval was −18.94 to +6.06 pp; it includes zero and allows both meaningful narrowing and some widening. The point estimate moves in the hypothesized direction, but the subgroup supports are small and the uncertainty is wide.

All eight diagnoses' FST 3 / FST 4 / FST 5 recall/supports are contained in the JSON artifact above. Several cells are extremely sparse (for example, one case in some diagnosis-tone cells); those point estimates are unstable and should not be interpreted in isolation.

## Artifacts and integrity

- Revision-4 frozen config and runner copy: `experiments/revision_04/experiment_config.json`, `experiments/revision_04/run_experiments.py`.
- Revision-4 run manifest: `experiments/revision_04/runs_revision_04/run_manifest.json` (records Arm A complete and Arm B stopped before optimization for low free VRAM).
- Revision-4 Arm A checkpoint, epoch log, run config/result and selected validation predictions: `experiments/revision_04/runs_revision_04/A_standard_class_balanced/`.
- Revision-5 B-only paired runner and byte-identical config: `experiments/revision_05/run_paired_arm_b.py`, `experiments/revision_05/experiment_config.json`.
- Completed paired manifest and validation comparison: `experiments/revision_05/runs_revision_05/run_manifest.json`, `validation_comparison.json`.
- Arm B checkpoint, epoch log, run config/result and selected validation predictions: `experiments/revision_05/runs_revision_05/B_capped_fitzpatrick_reweight/`.
- Paired bootstrap and complete diagnosis-tone table: `experiments/revision_05/runs_revision_05/paired_validation_uncertainty.json`.
- Arm A checkpoint SHA-256: `d0bf2c3f1d8aaeefec3fe10b27f741a39f250900916e030598f82af0da3a3bee`.
- Arm B checkpoint SHA-256: `744140d3e215be48b8627a1e0ed7a327ed0d0231fd7a72ff379ca8048cee7ff7`.

Protected hashes verified after the run: original checkpoint MD5 `1071116c406f14625ccd653bf1fde094`; official test CSV SHA-256 `8e83c029afb5ef7eec05968763b240060e8caecef854bb43fa0b66676f3dd496`; existing test predictions SHA-256 `9bbdb4cddfdf0fafbd4dd81ffc95de306d6da185a713a67284e5a2b82ac8e351`; existing baseline report SHA-256 `020134495912d10ac4d1e4e499fb20bffd496a997980f228518b73218e792710`. Existing app files and all prior reports were preserved.

## Scientific interpretation and limitations

The intervention narrowed the target Pigmentary Disorders recall gap in this single validation comparison, but the bootstrap interval for the change crosses zero. It also produced lower overall accuracy and macro F1 and a notable recall regression for Infectious Disorders. The result therefore suggests a possible trade-off and leaves the target fairness hypothesis unresolved; it does not establish a fairness improvement or causal bias.

This is one paired training seed and one subject-disjoint validation split. The bootstrap reflects sampling variation among the validation subjects conditional on the two trained models, not variation across training runs. Some class and tone intersections have very small support. Checkpoint selection was performed on this validation set, so selected-checkpoint metrics can be optimistic. The existing official test split was not used and remains inappropriate for confirmatory claims given the upstream checkpoint-selection leakage documented in earlier phases.

## Recommended next phase

Do not launch further training or read the official test split as a tuning step. Treat this as a completed exploratory pilot. For stronger evidence, preregister additional paired seeds and validation comparisons or obtain an independent cohort; report full accuracy, per-class regressions, subgroup supports, uncertainty and compute costs. Only consider one frozen exploratory test comparison after a deliberate model-selection decision, and do not call it confirmatory.
