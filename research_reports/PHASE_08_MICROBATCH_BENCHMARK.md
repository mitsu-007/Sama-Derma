# Phase 8 — Microbatch benchmark and runtime gate

## Objective

Create a new revision with microbatch 1 and gradient accumulation 8, verify accumulation behavior, benchmark training and validation under live RTX 3050 background load, estimate the full two-arm runtime, and gate full training. Preserve the first protocol revision, prior run, original model, test split, and existing evaluation outputs.

## Files inspected

- `AGENTS.md` and the latest handoff/Phase 7 report.
- `experiments/run_experiments.py`, `experiments/experiment_config.json`, `experiments/PROPOSED_PROTOCOL.md`, Phase 7 run manifest, and Arm A run configuration.
- timm's installed Swin implementation for checkpointing support.

## New files

- `experiments/revision_02/experiment_config.json`
- `experiments/revision_02/PROTOCOL.md`
- `experiments/revision_02/run_experiments.py`
- `experiments/revision_02/benchmark_microbatch1.py`
- `experiments/revision_02/benchmark_results.json`
- `experiments/revision_02/benchmark_validation.py`
- `experiments/revision_02/validation_benchmark_including_decode.json`
- `experiments/revision_02/validation_benchmark.json` (initial timing run; see note below)
- This report and the updated `research_reports/HANDOFF_SUMMARY.md`.

The original config and runner were not edited. Revision 2 writes full-run outputs to `experiments/revision_02/runs_revision_02/`; that directory was not created because the runtime gate failed.

## Revision 2 configuration

The new config has SHA-256 `d1bc5dd4822782f39f7d56d0aaf287788d2fcd17d5f99f6c95dc1e191f2be8e0`. It is a copy of the frozen first revision, retaining the seed (`20261026`), official pretrained Swin-B SHA-256 (`0f6f7d28cb1ddf43af5583163310b29cb3805a32044f226025352494702c606e`), eight labels, saved split, both sampling strategies, training transforms, fp16 autocast, AdamW settings, label smoothing, cosine scheduler, validation metrics, checkpoint-selection rule, patience, and 12-epoch maximum. Changes are microbatch 1, accumulation 8 (effective batch remains 8), a six-hour cap, revision metadata, and a distinct output directory.

The two arms remain identical in all shared settings. Arm A retains inverse diagnosis-frequency sampling. Arm B retains the capped diagnosis/Fitzpatrick sampling adjustment using training-only counts and the 20-unique-subject eligibility threshold.

## Gradient accumulation verification

The isolated runner was reviewed line by line. For a full group it backpropagates `loss / 8` for each one-image microbatch. It calls `GradScaler.step(optimizer)`, `GradScaler.update()`, and clears gradients after each group of eight. It also handles the final incomplete group by dividing by that group's actual size. The scheduler advances once after the training loop for a completed epoch and before validation; it does not advance per microbatch or per optimizer update.

With 3,519 training rows and no dropped final batch, that gives 3,519 microbatches per epoch: 439 updates over eight images, then one update over the final seven. The disposable benchmark executed four optimizer updates, each after eight one-image backward passes, with finite reported losses and no error. It saved no weights. A scheduler update was not benchmarked because it is explicitly an epoch-level action in the training runner.

## Training benchmark

Ran `experiments/revision_02/benchmark_microbatch1.py` using the verified pretrained initialization, Swin Base at 512×512, training transforms and saved training-partition images only. It performed one warm-up plus three measured optimizer updates (24 measured images). No checkpoint was written.

- Initial total device use: 1,369 / 6,144 MiB.
- Peak CUDA allocated/reserved: 2.695 / 2.746 GiB.
- Peak total device use sampled with `nvidia-smi` every 0.2 seconds: 4,303 / 6,144 MiB; minimum total free memory 1,841 MiB.
- Mean update of eight images: 2.333 seconds; 0.2916 seconds/image; 3.429 images/second.
- Benchmark completed without OOM or other error. Peak total device use is materially below the previous 5,656 MiB event, but future background contention can still change available headroom. The training runner aborts before an arm if free VRAM is below 4.5 GiB and stops after an epoch if its CUDA-reserved peak reaches 5.2 GiB.

## Validation benchmark

Ran the evaluation-mode disposable benchmark only on 24 images from the saved internal validation partition; the official test metadata was not opened. Batch size was 1 with validation transforms and fp16 autocast. The current result, including image fetch/decode and forward, is `validation_benchmark_including_decode.json`:

- Initial total device use: 1,368 / 6,144 MiB.
- Peak CUDA allocated/reserved: 0.495 / 0.563 GiB.
- Peak total device use: 2,052 MiB; minimum free: 4,092 MiB.
- Mean validation time: 0.12584 seconds/image (7.947 images/second).
- No weights were saved and no errors occurred.

`validation_benchmark.json` is an earlier diagnostic run whose recorded interval covered model-forward only despite its then-current field naming. The estimate below uses the later `validation_benchmark_including_decode.json`, which includes data fetching and decoding.

## Runtime estimate and decision

Using measured throughput, 3,519 training images take approximately 1,026.3 seconds (17.10 minutes) per epoch. A full 12 epochs in each of two arms therefore require about **6.842 hours for training alone**. Validation on 880 images at the measured 0.12584 seconds/image adds about 112.3 seconds per epoch, or **0.738 hours** across 24 validation passes. The measured subtotal is **7.580 hours**, before checkpoint serialization, initialization, per-epoch metric calculation, and runtime variability. A 20% planning margin raises it to about **9.10 hours**.

This exceeds both the six-hour hard cap in revision 2 and the 5.5–6-hour compute budget. Full training was not launched. The GPU memory benchmark passed under the observed 1.37 GiB desktop baseline; the runtime gate failed on time.

The smallest plausible protocol adjustment is a new revision capped at **7 epochs per arm**, with all other settings unchanged. Based on measured rates, 14 total epochs plus validation take about 4.422 hours; adding 20% gives 5.306 hours. That fits the 5.5-hour lower bound narrowly, so a new revision should include a predeclared 5.5-hour wall-clock stop and monitor actual run time. Six epochs per arm would provide more margin (about 4.55 hours with 20% overhead) but may reduce convergence opportunity. No epoch cap was changed in revision 2 and no full training was attempted.

## Gradient checkpointing and other memory options

The installed timm Swin class exposes `set_grad_checkpointing`, but checkpointing was not needed in this run: batch 1 peaked at 2.746 GiB CUDA-reserved and total GPU memory retained 1.8 GiB free. Gradient checkpointing can increase compute time, which worsens the binding runtime constraint. No memory-saving option was added; both arms in any future run should use identical model execution settings.

## Protected artifact check

Hashes after the benchmark match the prior handoff: original checkpoint MD5 `1071116c406f14625ccd653bf1fde094`; test metadata SHA-256 `8e83c029afb5ef7eec05968763b240060e8caecef854bb43fa0b66676f3dd496`; existing `evaluation_results/test_predictions.csv` SHA-256 `9bbdb4cddfdf0fafbd4dd81ffc95de306d6da185a713a67284e5a2b82ac8e351`; existing `evaluation_results/baseline_report.txt` SHA-256 `020134495912d10ac4d1e4e499fb20bfd496a997980f228518b73218e792710`. No test metadata was read by either benchmark or the preflight.

## Commands and errors

- `python -m py_compile` on the new runner and benchmark scripts: passed.
- `python experiments/revision_02/run_experiments.py --preflight-only`: passed; reported 3,519/880 rows, 1,917/479 subjects, zero subject overlap, both sampler masses equal to one per diagnosis, and no run directory created.
- `python experiments/revision_02/benchmark_microbatch1.py`: passed.
- `python experiments/revision_02/benchmark_validation.py`: passed.
- No code/runtime errors or CUDA OOM occurred in either benchmark. Full training was intentionally gated off because measured runtime exceeds budget.

## Recommended next phase

If proceeding on this RTX 3050, freeze a new protocol revision with a maximum of seven epochs per arm, preserve the same split/initialization/sampling/selection rules, and add a 5.5-hour hard total-time stop. Re-run preflight under representative GPU load, then start the two arms only if observed conditions still support the runtime estimate. The official test split remains off-limits during selection and has not been touched.
