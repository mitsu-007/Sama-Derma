# Phase 9 — Accelerated preparation, partial training, and safe stop

## Outcome

Revision 3 passed preflight and its runtime gate. Arm A ran six complete train/validation epochs, then training was stopped at the epoch boundary requested by the user, before epoch 7 and before Arm B. The best checkpoint is epoch 6. The official test split was not used. The process has exited and GPU memory returned to desktop baseline.

The stop is **not resumable** as an exact optimizer trajectory. The runner saves selected model weights, validation predictions, and completed epoch logs, but no optimizer, scheduler, GradScaler, RNG, sampler-generator, or in-progress epoch state.

## Phase A — Revision 3 and preflight

Revision 3 is isolated under `experiments/revision_03/`. Configuration SHA-256: `d85e7547d1f6a8012019f9019a7d1fa99be335e4b2639cccef3d4c2bdf296a5a`. It uses the verified official Swin-B initialization, the existing training-only subject-disjoint split, the two pre-specified samplers, microbatch 1, accumulation 8, effective batch 8, and a seven-epoch maximum. AdamW, fp16 autocast/GradScaler, smoothed cross entropy, cosine scheduling, validation cadence and selection/tie rules are shared by both arms. Existing patience 4 / minimum macro-F1 gain 0.002 remains the pre-specified early-stop rule.

Two pinned, persistent DataLoader workers were used identically in both arms. The preflight checked 3,519 train rows / 1,917 subjects, 880 validation rows / 479 subjects, zero subject overlap, pretrained SHA-256, strict backbone compatibility (only the new classifier head is missing), and sampler mass 1.0 for every diagnosis in both arms. Initial free VRAM was 5.032 GiB of 5.999 GiB. Preflight passed and created no run directory.

The revision-3 timing gate used these measured checks:

- Training benchmark: 80 images / 10 measured effective-batch updates with two workers and pinned memory; 4.205 images/s, 2.695 GiB peak allocated, 2.746 GiB peak reserved, 4,110 MiB peak total GPU use, 2,034 MiB minimum free.
- Full internal validation timing pass: all 880 validation images; 64.893 seconds including decode, or 0.073737 seconds/image (13.561 images/s); peak total device use 1,986 MiB, 4,158 MiB minimum free. No scores or predictions were retained by this timing pass.
- Checkpoint serialization probe: 347,671,405 bytes; 0.400 seconds observed. The estimate budgets 0.801 seconds per selected checkpoint.
- Estimated two-arm runtime at seven epochs each, with measured training/validation, a 20% margin, and five-minute startup reserve: 4.296 hours. The 5.5-hour cap left an estimated 72.3-minute buffer.

The full config, separate runner, timing probes, and outputs are in `experiments/revision_03/`. No earlier revision or original script was changed.

## Accumulation, saving, and resume audit

Each one-image loss is divided by the actual accumulation-group size. The runner scales/backpropagates each loss, then performs one optimizer step and GradScaler update per eight-image group (or the final partial group); the scheduler advances once per completed epoch. This is shared across arms.

Selected checkpoints and validation prediction CSVs are saved atomically at completed validation boundaries. Epoch JSONL is flushed after each completed epoch. Revision 3 catches ordinary OOMs and Python keyboard interrupts within the arm loop, but the explicit console interrupt at the epoch boundary terminated the process before the outer runner finalized. I reconciled `run_result.json` and `run_manifest.json` from the durable epoch log and verified the checkpoint/prediction files.

The checkpoint contains model weights only. `epoch_log.jsonl` records the learning rate for the next epoch but not the scheduler's internal state. The run does not save optimizer, scheduler, scaler, RNG, sampler-generator, or current-epoch gradients. There is no exact resume command. The original launch command was:

```powershell
.\.venv\Scripts\python.exe -u experiments\revision_03\run_experiments.py
```

Do not rerun that command as a resume: revision 3 refuses to reuse its existing output directory. Tomorrow, an exact continuation cannot be reconstructed. A scientifically matched restart would need a new versioned run, initialized from the verified official weights, and both arms rerun from their common initialization. Do not treat the epoch-6 model-only checkpoint as resumable state.

## Phase B — Arm A actual run state

Arm A (`A_standard_class_balanced`) completed six of seven maximum epochs. Current epoch 6 completed validation, selection, checkpoint write, prediction write, and epoch-log flush. Epoch 7 was not started. Arm B was not started and has no directory.

| Epoch | Validation accuracy | Macro F1 | Validation loss | Epoch wall time | Selected checkpoint |
|---:|---:|---:|---:|---:|:---:|
| 1 | 0.528409 | 0.387455 | 1.522463 | 13.81 min | yes |
| 2 | 0.575000 | 0.454236 | 1.342933 | 12.37 min | yes |
| 3 | 0.653409 | 0.481845 | 1.219995 | 11.80 min | yes |
| 4 | 0.647727 | 0.462056 | 1.269404 | 11.54 min | no |
| 5 | 0.684091 | 0.473749 | 1.236783 | 11.41 min | no |
| 6 | 0.697727 | **0.485632** | **1.193351** | 11.48 min | yes; best |

Arm elapsed time through epoch 6 was 4,344.62 seconds (72.41 minutes). Peak reserved CUDA memory was 2.746 GiB in all six epoch records. The selected model is `experiments/revision_03/runs_revision_03/A_standard_class_balanced/best_model.pth`, SHA-256 `88c5d13ad9648b6fb0d08ff967b7b96395573c339078bf72a57d98700bdd2500`, 347,676,013 bytes. The eight-class head shape is `(8, 1024)`, and the checkpoint loaded successfully for integrity verification.

At epoch 6, per-class validation precision / recall / F1 / support was:

| Diagnosis | Precision | Recall | F1 | Support |
|---|---:|---:|---:|---:|
| Infectious Disorders | 0.7573 | 0.7845 | 0.7707 | 362 |
| Inflammatory Disorders | 0.6169 | 0.6265 | 0.6216 | 257 |
| Keratanisation Disorders | 0.7000 | 0.5833 | 0.6364 | 12 |
| Neoplasms and tumors | 0.1818 | 0.2500 | 0.2105 | 8 |
| No Definite Diagnosis | 0.0000 | 0.0000 | 0.0000 | 6 |
| Other skin disorders | 0.5000 | 0.1154 | 0.1875 | 26 |
| Pigmentary Disorders | 0.7324 | 0.7820 | 0.7564 | 133 |
| Skin Appendages Disorders | 0.7067 | 0.6974 | 0.7020 | 76 |

Fitzpatrick-group support / accuracy / eight-class macro F1 at epoch 6: FST 3 = 213 / 0.6573 / 0.3383; FST 4 = 433 / 0.7113 / 0.4707; FST 5 = 212 / 0.6981 / 0.5403; FST 6 = 19 / 0.9474 / 0.4748; missing = 3 / 0.0000 / 0.0000.

For Pigmentary Disorders, validation recall was FST 3: 25/31 = 0.8065; FST 5: 27/35 = 0.7714; difference FST 3 minus FST 5 = +0.0350. These are single-arm, validation-selected exploratory metrics with small subgroup supports; they do not establish a fairness effect. No paired comparison, uncertainty interval, multiple-comparison analysis, or intervention conclusion is possible without Arm B.

## Stop and artifact status

- Reconciled stop status: `stopped_user_request_after_epoch_boundary` in `experiments/revision_03/runs_revision_03/run_manifest.json`.
- Detailed state: `experiments/revision_03/runs_revision_03/A_standard_class_balanced/run_result.json`.
- Durable per-epoch details and all diagnosis-by-Fitzpatrick recalls/supports: `experiments/revision_03/runs_revision_03/A_standard_class_balanced/epoch_log.jsonl`.
- Best validation predictions: `experiments/revision_03/runs_revision_03/A_standard_class_balanced/best_validation_predictions.csv`.
- No optimizer/scheduler/scaler/RNG/sampler resume state exists. No exact resume command exists.
- After stop: no Python training process remained; GPU use was 1,185 MiB / 6,144 MiB at 1% utilization (desktop baseline).
- Arm B was not started. The official test split was never used.

Protected hashes remain unchanged: original checkpoint MD5 `1071116c406f14625ccd653bf1fde094`; test CSV SHA-256 `8e83c029afb5ef7eec05968763b240060e8caecef854bb43fa0b66676f3dd496`; existing `test_predictions.csv` SHA-256 `9bbdb4cddfdf0fafbd4dd81ffc95de306d6da185a713a67284e5a2b82ac8e351`; existing `baseline_report.txt` SHA-256 `020134495912d10ac4d1e4e499fb20bfd496a997980f228518b73218e792710`.

## Recommended next step

Do not resume from the epoch-6 model file. If continuing tomorrow, create a new versioned run and restart both arms from the same verified official pretrained initialization and saved split. Keep the official test set untouched. If that compute is not available, analyze the completed Arm A validation artifacts descriptively and mark the intervention comparison incomplete.
