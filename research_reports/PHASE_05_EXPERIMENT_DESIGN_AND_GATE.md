# Phase 5 — Experiment design and pre-training gate

## Objective

Define a defensible next experiment and determine whether the current model, data split, and compute can support it without using the test set for training or tuning.

## Files and sources inspected

- Training/test metadata, current evaluator and app, baseline/fairness outputs
- Official Swin training script, inference notebook, and Dataverse checkpoint metadata
- Project virtual environment and local GPU

## Commands executed

- One-batch CUDA inference and one-batch training smoke check using an actual training image; no outputs were saved.
- Read-only data and checkpoint checks described in Phases 1–4.

## Actual results and decision

- **Environment and class-mapping gates pass.** The exact upstream checkpoint hash matches the published Dataverse artifact; strict model loading succeeds; class indices match the upstream sorted-label rule; CUDA works.
- **The existing test split is contaminated for evaluation of this checkpoint.** The upstream code uses `test_split.csv` as validation data and selects the checkpoint by validation accuracy. The test set must not be presented as an independent held-out evaluation. The same split was also used for exploratory fairness analysis and hypothesis selection.
- **Validation leakage through checkpoint initialization:** the published checkpoint was trained on all official training rows. A validation split cut from those same rows is not independent if fine-tuning starts from this checkpoint. A clean training/validation experiment needs a fresh ImageNet-pretrained initialization or a separately held-out dataset, not this already trained checkpoint.
- The local cache contains no Swin-B ImageNet pretrained checkpoint; only unrelated EfficientNet/MobileNet weights and an EVA02 model. Obtaining the matching ImageNet pretrained weights would require a large external download.
- Local GPU preflight: RTX 3050 6 GB. Batch-1 full-precision training step fit (peak allocated 1.89 GiB, 1.39 seconds for the measured step); upstream batch size 84 is not feasible on this single GPU. The single-step timing is not a reliable epoch benchmark, but at batch 1, 4,399 images imply thousands of steps per epoch and a long run. Multi-run, multi-epoch training should not start without a smaller bounded design and more reliable throughput estimate.

## Proposed future experiment

1. Obtain the upstream ImageNet-pretrained Swin initialization and record its exact hash, then create a deterministic subject-disjoint validation subset from the official training split only.
2. Freeze two matched arms from the same fresh initialization: an ordinary class-balanced baseline and an intervention using capped inverse-frequency weights for adequately represented diagnosis × Fitzpatrick groups. Keep the sparse groups out of aggressive balancing and define the missing-tone policy in advance.
3. Use the internal validation split only for checkpoint selection. Do not inspect test outputs during model development. Limit epochs/runs based on a measured throughput estimate, and record seeds/configuration in a machine-readable log before training.
4. Evaluate the selected models on the existing test set only once for an **exploratory** comparison. Because the official checkpoint and intervention hypothesis were both selected using this test set historically, reserve confirmatory claims for a new independent cohort.
5. Report accuracy, macro F1, class metrics, diagnosis-specific subgroup recall and supports, confidence intervals, and any regressions. Do not claim causal bias or fairness improvement from a subgroup gap alone.

## Files created or changed

- Created this report and the accompanying phase reports/handoff.
- No model training, tuning, checkpoint write, test inference, or existing output modification was performed.

## Errors and failed attempts

- Initial restricted network access to Dataverse metadata failed; a read-only metadata request was subsequently approved and verified the checkpoint hash. No model weights or other large external files were downloaded.

## Scientific assumptions and unresolved questions

- The intervention is motivated by exploratory test findings; despite protocol separation, the existing test set cannot provide independent confirmatory evidence for this hypothesis.
- The source training script is configured for four GPUs and batch 84; a single 6 GB GPU will require a different bounded configuration and may materially change optimization behavior.
- A license/terms review is needed before external publication or redistribution; the dataset release lists CC BY-NC-SA 4.0.
- Fresh pretrained weight availability and download size must be confirmed before starting the experiment.

## Recommended next phase

Resolve access to a fresh pretrained initialization and decide whether to proceed with a clearly exploratory, bounded pilot. For confirmatory evaluation, acquire an independent test cohort before making claims.
