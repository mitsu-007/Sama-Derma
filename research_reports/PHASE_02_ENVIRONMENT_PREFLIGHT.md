# Phase 2 — Environment recovery and preflight

## Objective

Verify the project Python runtime and GPU, without replacing the existing environment or installing packages.

## Files inspected

- `.venv/pyvenv.cfg` and installed package metadata under `.venv/Lib/site-packages/`
- Existing project requirements files
- Existing checkpoint and training/test metadata (read only)

## Commands executed

- Checked Python interpreters using `py -0p`, `Get-Command`, and direct `--version` invocation.
- Invoked `.venv/Scripts/python.exe` to import PyTorch, timm, and torchvision and query CUDA.
- Ran `nvidia-smi`.
- Ran one checkpoint inference and one single-image optimization step in a short-lived Python process; no model state or result was saved.

## Actual results

- The project virtual environment is usable as-is with Python 3.11.0. Its configured base interpreter exists. The initial launcher error was transient/not reproducible; no environment repair or package installation was required.
- Versions: PyTorch 2.11.0+cu128; timm 1.0.30; torchvision 0.26.0+cu128.
- `torch.cuda.is_available()` is true. One GPU is visible: NVIDIA GeForce RTX 3050 6GB Laptop GPU.
- One 512×512 batch-1 inference returned an eight-logit output in 0.48 seconds; reported peak allocated VRAM was 0.51 GiB.
- One 512×512 batch-1 training step completed in 1.39 seconds; peak allocated VRAM was 1.89 GiB and peak reserved VRAM 2.25 GiB. This is a smoke check, not a runtime estimate for a full epoch.

## Files created or changed

- Created this report and the other research reports/handoff.
- No Python packages, environment files, model files, or outputs were modified.

## Errors and failed attempts

- The first `.venv` Python call failed to resolve its base interpreter, but a direct path check and subsequent invocations succeeded. The issue did not require a repair.
- The host Python 3.14 does not have PyTorch; it was not used for project execution.

## Scientific assumptions and unresolved questions

- A single-image smoke check does not establish throughput, stability, or fit at the upstream batch size of 84.
- The source training configuration used four visible GPUs; the local machine has one GPU with 6 GB VRAM.

## Recommended next phase

Authenticate the checkpoint against the published source, verify semantic output labels, and inspect upstream checkpoint-selection behavior.
