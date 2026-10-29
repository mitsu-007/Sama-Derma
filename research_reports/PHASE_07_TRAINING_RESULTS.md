# Phase 7 — Preflight and training attempt

## Outcome

The official pretrained asset and experiment preflight passed. Training was stopped during Arm A startup after GPU memory use reached 5,656 MiB of 6,144 MiB, leaving 346 MiB free. No epoch completed, no validation metrics were produced, Arm B was not started, and no model checkpoint was written. The experiment is therefore incomplete; there is no arm comparison to report.

## Phase 1 — Pretrained asset verification

- Exact asset: `swin_base_patch4_window12_384_22kto1k.pth` (Swin Base, ImageNet-22k pretraining followed by ImageNet-1k fine-tuning).
- Official source: [Swin Transformer v1.0.0 release asset](https://github.com/SwinTransformer/storage/releases/download/v1.0.0/swin_base_patch4_window12_384_22kto1k.pth); the release's [asset listing](https://github.com/SwinTransformer/storage/releases/expanded_assets/v1.0.0) identifies the corresponding 348 MB file.
- Local path: `experiments/pretrained/swin_base_patch4_window12_384_22kto1k.pth`.
- File size: 365,361,851 bytes (348.44 MiB; 365.36 MB decimal).
- Locally computed SHA-256: `0f6f7d28cb1ddf43af5583163310b29cb3805a32044f226025352494702c606e`.
- The asset was fetched from the exact official release URL. `torch.load(weights_only=True)` read its `model` state dictionary (364 tensors); its ImageNet classifier tensors have 1,000 outputs. No upstream checksum was published with the asset; the SHA-256 above is the local integrity record.
- The checkpoint loaded into `swin_base_patch4_window12_384` using timm's Swin checkpoint filter. After removing the source 1,000-class head, the only missing keys were the intended new `head.fc.weight` and `head.fc.bias`; there were no unexpected keys. Thus the full backbone was accepted and the eight-class head was freshly initialized.

## Phase 2 — Final preflight

- Saved fold was verified as training-only, subject-disjoint, and unchanged: training 3,519 images / 1,917 subjects; validation 880 images / 479 subjects; zero subject overlap. All eight diagnosis labels occur in validation. No test metadata was opened.
- The frozen experiment configuration and protocol were present. Both arms use the same split, seed (`20261026`), pretrained backbone, matching initial classifier, transforms, optimizer, loss, schedule, precision, effective batch size, epoch limit, validation selection rule, and stopping rule. The planned difference is the sampling weights. Configuration SHA-256: `91b4a5bd2d3efc375b5b5ef0c99b09c9e801cf20aae065c5b7590085b0744c83`.
- Preflight reported 5.032 GiB free of 5.9995 GiB total VRAM. Runtime background usage left less headroom than the short smoke estimate suggested. During the first arm, the GPU reached 5,656 / 6,144 MiB occupied (346 MiB free; 100% utilization), so training was interrupted safely. After interruption, the Python training process was gone and GPU use returned to 1,456 MiB with 4% utilization.
- Protected artifacts remain unchanged by hash: original checkpoint MD5 `1071116c406f14625ccd653bf1fde094`; official test CSV SHA-256 `8e83c029afb5ef7eec05968763b240060e8caecef854bb43fa0b66676f3dd496`; `evaluation_results/test_predictions.csv` SHA-256 `9bbdb4cddfdf0fafbd4dd81ffc95de306d6da185a713a67284e5a2b82ac8e351`; `evaluation_results/baseline_report.txt` SHA-256 `020134495912d10ac4d1e4e499fb20bfd496a997980f228518b73218e792710`. No evaluation script was run.

## Phase 3 — Run status and resource incident

- Run directory: `experiments/runs/`.
- Arm A created its run configuration, then stopped before any epoch completed. The arm directory contains only `run_config.json`; there is no training log, validation prediction, or checkpoint.
- Arm B was not started. The shared run manifest records `stopped_resource_limit`, the observed memory, and the incomplete arm status.
- The measured batch-2 smoke peak (3.54 GiB allocated / 3.84 GiB reserved) did not include the runtime's actual competing GPU usage. The live process left only 346 MiB available. Continuing with the frozen batch configuration would risk an out-of-memory failure and could exceed the safe resource margin.
- The prepared protocol permits batch 1 with doubled accumulation if training OOMs, but the observed condition was a live resource limit before any completed epoch. No automatic restart or unreviewed protocol change was made. A new run should use a revised, explicitly recorded microbatch-1 configuration and repeat a short memory preflight before full training.

## Phase 4 — Results comparison

No validation pass completed, so overall accuracy, macro F1, per-class precision/recall/F1, diagnosis-by-Fitzpatrick recalls, group supports, the Pigmentary Disorders FST 3 versus FST 5 difference, and training-time comparison are unavailable. No fairness or performance conclusion can be drawn from this attempt.

## Artifacts and reproducibility

- Frozen configuration and protocol: `experiments/experiment_config.json`, `experiments/PROPOSED_PROTOCOL.md`.
- Split manifest: `experiments/train_val_split_manifest.csv`.
- Verified initialization: `experiments/pretrained/swin_base_patch4_window12_384_22kto1k.pth`.
- Preflight/run record: `experiments/runs/run_manifest.json` and `experiments/runs/A_standard_class_balanced/run_config.json`.
- Original model and test/evaluation artifacts were not modified. No full training epoch and no test inference/evaluation were completed.

## Next step

Revise the run configuration as a new protocol revision to use microbatch 1 and accumulation 8 (effective batch 8), keep all other settings fixed, then repeat a disposable memory/throughput check under normal GPU background load. Resume full training only if both arms fit the remaining time budget and the revised run has enough observed VRAM headroom. The current stopped run is preserved and should not be represented as a completed comparison.
