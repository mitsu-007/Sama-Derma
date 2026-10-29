# Protocol revision 2 — microbatch 1 with accumulation 8

**Status:** prepared for bounded benchmark only. Full training is gated on measured GPU safety and runtime feasibility.

## Why this revision exists

The prior attempt with microbatch 2 stopped during Arm A startup when the 6 GB RTX 3050 reached 5,656 MiB used and only 346 MiB remained free. This revision lowers the activation footprint while preserving effective batch size 8. The prior configuration and run artifacts remain unchanged.

## Frozen comparison

Revision 2 copies all dataset, split, model, initialization, labels, sampling definitions, augmentation, optimizer, loss, learning rate, weight decay, schedule, validation metrics, checkpoint-selection rule, stopping criteria, and seed from `../experiment_config.json`. It changes only:

- Microbatch size: 1 (was 2).
- Gradient accumulation: 8 microbatches (was 4).
- Effective batch size remains 8.
- Outputs go to this revision's `runs_revision_02/` directory.

Arm A retains the inverse diagnosis-frequency sampler. Arm B retains the capped square-root diagnosis/Fitzpatrick adjustment for cells with at least 20 unique training subjects, normalized within diagnosis. Both arms retain the same official pretrained Swin-B initialization, fresh eight-class head seed, training-only subject-disjoint split, validation-only selection, and six-hour hard run cap.

## Accumulation implementation review

The runner uses the number of microbatches in the current accumulation group as the divisor. For a full group it divides each mean loss by 8; if the final group is partial, it divides by that group's actual size. It invokes `GradScaler.scale(...).backward()` per microbatch, then calls `GradScaler.step(optimizer)`, `GradScaler.update()`, and clears gradients once per completed group. This preserves the mean gradient over each 8-image group (or the final partial group) under microbatch size 1.

With 3,519 training rows and `drop_last=False`, each epoch has 3,519 one-image microbatches, 439 full optimizer updates (3,512 images), then one final update over 7 images. The scheduler is stepped once after each full training epoch, after its optimizer updates and before validation. Validation does not step the optimizer or scheduler. No change to the training loop was needed; the new runner is an isolated copy configured to read this revision and write only within `revision_02/`.

## Memory and throughput gate

`benchmark_microbatch1.py` loads the verified official pretrained backbone, uses the same 512×512 training transforms and training-only rows, and performs one warm-up and three measured optimizer updates, each over eight microbatches. It writes no model weights. It records CUDA allocated/reserved peaks and samples total device memory via `nvidia-smi` so desktop/background use is included. A successful benchmark requires at least 4.5 GiB free before startup, no OOM, and enough remaining headroom to continue without approaching the prior resource ceiling. If enabled, gradient checkpointing must be applied identically to both arms and recorded as another revision; it is not enabled in this revision by default.

## Runtime gate

The full run contains 3,519 training images per epoch, two arms, at most 12 epochs each, plus 880 validation images after every epoch. Estimate both training and validation from measured batch-1 timings, then add model initialization and checkpoint I/O. Proceed only if the total estimate, including a documented uncertainty margin, fits six hours. The original batch-2 smoke estimate is not valid for this decision.

## Artifacts

- Configuration: `experiment_config.json`.
- Isolated training runner: `run_experiments.py`.
- Disposable benchmark and result: `benchmark_microbatch1.py`, `benchmark_results.json`.
- Full-run output path, if the gate passes: `runs_revision_02/`.
- The official test metadata is not read by either script.

## Benchmark outcome and gate decision

The training benchmark passed its memory gate: peak CUDA allocated/reserved was 2.695/2.746 GiB and peak total device use was 4,303 MiB, leaving 1,841 MiB free. Training throughput was 3.429 images/s. The validation benchmark measured 0.12584 seconds/image including decode, or 7.947 images/s. At 12 epochs per arm, these rates imply 7.580 hours for training and validation alone, before I/O and startup overhead. Revision 2 therefore does not pass the six-hour runtime gate. Full training was not started.

A seven-epoch-per-arm cap in a future protocol revision estimates to 4.422 hours before overhead and 5.306 hours with 20% overhead. Treat that as a candidate only; preserve the current revision and set an explicit total-time stop in any successor protocol.
