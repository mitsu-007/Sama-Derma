# Stage 10 — Deployment preparation (no public deployment)

**Project:** SamaDerma / DermaFair AI  
**Date:** 2026-10-28  
**Outcome:** Backend container definition prepared; Linux/Docker image build is **not verified** because Docker and WSL are unavailable on this machine. Nothing was deployed publicly and no paid resources were created.

## Executive summary

The backend has a viable CPU-only container design: FastAPI loads one Swin-B model at process startup, performs inference on CPU when CUDA is absent, and returns the existing eight-score API response. A local forced-CPU API smoke check succeeded. The existing model-loading code resolves the checkpoint and label config relative to the project root; the proposed image places those files at the corresponding `/app` paths and copies the checkpoint exactly once.

The container has **not** been built or run. `docker` is not installed/on `PATH`, and WSL is not installed. Thus Linux wheel resolution, container startup, health behavior under Docker, image contents/size, and Linux memory usage remain blockers to a verified deployment-ready verdict. The Stage 9 “GO” is not equivalent to a tested Linux container.

## Files and project structure inspected

- `backend/app.py`, `backend/concurrency.py`, `backend/rate_limiter.py`, `backend/schemas.py`, `backend/tests/test_api.py`
- `demo_inference.py`, `requirements-backend.txt`, `.gitignore`
- `frontend/package.json`, `frontend/vite.config.ts`, `frontend/vercel.json`, `frontend/public/_redirects`, `frontend/src/api/inference.ts`, `frontend/src/vite-env.d.ts`, `frontend/.env.example`, existing `frontend/dist/`
- `research_reports/STAGE_8_REMEDIATION_REPORT.md`, `research_reports/STAGE_9_FINAL_INTEGRATION_AUDIT.md`
- Model/checkpoint and experiment-config paths

No backend route, API schema, model weights, dataset, split, historical result, or frontend source was modified.

## Backend architecture and exact container paths

The ASGI entry point is `backend.app:app`. For this layout, `backend/app.py` computes the project root as its grandparent directory. `demo_inference.py` then resolves:

| Purpose | Container path | Source path |
|---|---|---|
| API module | `/app/backend/app.py` | `backend/app.py` |
| Model/inference helpers | `/app/demo_inference.py` | `demo_inference.py` |
| Existing Swin-B checkpoint | `/app/checkpoints/Swin_MC_best_model.pth` | `checkpoints/Swin_MC_best_model.pth` |
| Verified output-label config | `/app/experiments/experiment_config.json` | `experiments/experiment_config.json` |

The model is `swin_base_patch4_window12_384`, configured for 512×512 inputs and eight classes. The checkpoint is 347,677,793 bytes and its audited MD5 is `1071116c406f14625ccd653bf1fde094`. `load_inference_engine()` verifies that fingerprint, reads the label order from the experiment config, constructs the model with `pretrained=False`, and strict-loads the state dict. It does not need the ImageNet initialization file or the training runs. The allow-listed Docker context copies one checkpoint path and only the small experiment config; it excludes `experiments/pretrained`, every other checkpoint, data, evaluation outputs, reports, and the frontend.

The Dockerfile contains one `COPY` instruction for the production checkpoint. `.dockerignore` is default-deny and re-includes only the required API modules, inference helper, checkpoint, and label config. This verifies the intended image recipe statically; actual image contents cannot be verified before a Docker build.

## Dependencies and Linux compatibility

The current tested Windows environment has Python 3.11.0, PyTorch 2.11.0+cu128, torchvision 0.26.0+cu128, timm 1.0.30, FastAPI 0.162.0, Uvicorn 0.54.0, Starlette 1.10.0, Pydantic 2.14.1, python-multipart 0.0.32, Pillow 13.0.0, and NumPy 2.4.6.

The existing `requirements-backend.txt` does **not** pin exact runtime versions despite the Stage 8/9 report wording; it specifies broad ranges and includes optional test packages. The new `backend/requirements-container.txt` pins the direct API runtime packages to versions present in the current environment, while the Dockerfile installs matching CPU-only PyTorch/torchvision from the official PyTorch CPU wheel index. Indirect dependencies are not hash-locked, and the base tag `python:3.11-slim-bookworm` is not digest-pinned. Linux wheel compatibility and dependency resolution remain unverified until the image is built.

No Docker executable was available (`docker` command not found); WSL reported that it is not installed. No Docker installation or system modification was attempted.

## CPU capability and observed resource use

I forced the local model loader to select CPU, used two Torch CPU threads, and inferred a local training-directory image (`dataset/DATASET_0/IMG_0002.jpg`). The process loaded the strict checkpoint, produced eight scores summing to 1 within floating-point tolerance, and returned the expected class mapping.

| Measurement | Observed on this Windows host |
|---|---:|
| Process RSS before model construction (after Python/Torch imports) | 578.6 MiB |
| RSS after model load | 1,277.9 MiB |
| Peak process RSS through one inference | 1,345.6 MiB |
| Model load time | 2.75 s |
| CPU inference time (one 512×512 image, two Torch threads) | 2.83 s |

The backend was also run under `TestClient` with CUDA disabled: `GET /api/health` returned 200 with `device=cpu`; `POST /api/predict` returned 200 with eight scores; corrupt image bytes returned 400. These checks exercise the local Windows CPU path, not Linux/Docker. A practical initial container budget is **3 GiB RAM and 2 vCPU**, one Uvicorn worker and inference concurrency 1; validate under load on the actual Linux target before reducing that budget. Linux RSS and startup time may differ.

## Frontend build and SPA routing

The frontend is React 18 / TypeScript / Vite 5 (`npm run build` runs `tsc && vite build`). Vite's development server listens on port 5173. Existing SPA fallback files are `frontend/public/_redirects` (copied to `dist/`) and `frontend/vercel.json`; they route application paths to `index.html`. The existing `frontend/dist/` and `_redirects` were inspected; this phase did not rebuild or modify them.

`VITE_API_BASE_URL` is compiled into the browser bundle and is public configuration, never a secret. `frontend/src/api/inference.ts` falls back to `http://127.0.0.1:8000` when unset or blank. Therefore production must set it **before** `npm run build` to a browser-reachable HTTPS API base URL, for example `https://api.example.org`, or to the same public site origin if a reverse proxy forwards `/api/*`. An empty value does not select a relative `/api` URL. The checked-in `.env.example` documents the local development URL; no production hostname or credential is hardcoded in the Dockerfile.

## API startup, health, upload, concurrency, and rate limiting

- Startup command in the prepared image: one Uvicorn worker, `backend.app:app`, host `0.0.0.0`, port from `PORT` (default 8000), with proxy headers accepted only from `FORWARDED_ALLOW_IPS` (default loopback). One worker avoids duplicate model copies and keeps in-process guards meaningful.
- Health endpoint: `GET /api/health`; 200 means the model loaded, 503 means the app process is alive but the model is unavailable. The lifespan currently catches model-load errors and continues startup, so a container can run while unhealthy; the Docker health check treats non-2xx as failure.
- Prediction contract is unchanged: `POST /api/predict`, multipart field `file`, same eight score fields and disclaimer.
- Application code reads at most 12 MiB plus a small detection buffer and rejects files over 12 MiB; image validation permits JPEG/PNG/WebP and limits decoded dimensions to 40 megapixels.
- Inference concurrency defaults to 1; when saturated the API returns 503. `INFERENCE_QUEUE_TIMEOUT` defaults to 0, meaning immediate rejection rather than queueing.
- Sliding-window request limiting defaults to 15 requests/minute per client. It is per process and in memory; do not use multiple workers/replicas as a substitute for a shared/edge limiter.
- CORS uses `CORS_ORIGINS`; if unset or invalid, backend code falls back to localhost development origins. Configure the exact production browser origins, comma-separated, without wildcards.
- Secrets were not found in the inspected backend/frontend runtime configuration. The source contains only the documented local development API fallback and example URL; override the Vite variable for a production build.

### Stage 9 documentation discrepancies found in live code

1. Stage 9 lists `RATE_LIMIT_REQUESTS_PER_MINUTE=30`; the code reads `RATE_LIMIT_PER_MINUTE` and defaults to **15**. The Stage 9 variable is ignored by current code.
2. Stage 9 gives `TRUSTED_PROXIES=10.0.0.0/8`; `parse_trusted_proxies()` stores literal strings and does not implement CIDR matching. Use exact immediate proxy IPs for this setting. Uvicorn's `FORWARDED_ALLOW_IPS` is a separate trust boundary and must be aligned with the actual ingress source.
3. Stage 9 says a blank `VITE_API_BASE_URL` can use relative `/api`; live frontend code instead falls back to `http://127.0.0.1:8000`.
4. Stage 9's sample health response includes a timestamp; the current `HealthResponse` does not.
5. Stage 8's example copies all of `experiments/`, which could include the separate pretrained Swin file. The prepared Docker recipe copies only `experiments/experiment_config.json`.

### Upload handling caveat

The endpoint bounds its `UploadFile.read()` call, but Starlette parses multipart uploads before the route handler runs. The installed Starlette multipart parser has a 1 MiB spool threshold and may spill larger uploaded files into its temporary directory. Consequently the absolute “zero disk persistence” description is not established for multipart uploads on a normal filesystem. The supplied local run command mounts `/tmp` as bounded tmpfs, so temporary spool data is RAM-backed in that test setup; production still needs an ingress body limit (about 15 MiB, including multipart overhead), bounded temporary storage, and a verified privacy statement. Rate limiting is applied after multipart parsing, so it alone does not prevent parser/temp-storage exhaustion.

## Files created in this phase

- `backend/Dockerfile` — CPU-only, non-root, one-worker container recipe with a health check and configurable port.
- `backend/requirements-container.txt` — pinned direct container dependencies.
- `.dockerignore` — default-deny context that allow-lists only the necessary runtime inputs.
- `research_reports/STAGE_10_DEPLOYMENT_PREPARATION.md` — this audit.
- `research_reports/HANDOFF_SUMMARY.md` — appended Stage 10 status only; prior findings retained.

No existing backend, frontend, model, dataset, test split, prediction, or historical evaluation file was changed.

## Local build and test commands (not executed: Docker unavailable)

Run from the repository root after installing a Linux-capable Docker Engine/Desktop with Linux containers:

```powershell
docker build --pull --file backend/Dockerfile --tag samaderma-backend:stage10 .
```

Start a local-only container for smoke testing. The bind address intentionally limits access to loopback; the sample image is from the training-image directory, not the test split.

```powershell
docker run --detach --rm --name samaderma-backend-stage10 `
  --memory=3g --cpus=2 --read-only `
  --tmpfs /tmp:rw,nosuid,nodev,noexec,size=64m `
  --publish 127.0.0.1:8000:8000 `
  --env PORT=8000 `
  --env CORS_ORIGINS=http://localhost:5173 `
  --env MAX_INFERENCE_CONCURRENCY=1 `
  --env INFERENCE_QUEUE_TIMEOUT=0.0 `
  --env RATE_LIMIT_PER_MINUTE=15 `
  --env OMP_NUM_THREADS=2 `
  samaderma-backend:stage10

Invoke-RestMethod http://127.0.0.1:8000/api/health
curl.exe --fail-with-body -F "file=@dataset/DATASET_0/IMG_0002.jpg;type=image/jpeg" http://127.0.0.1:8000/api/predict
docker inspect --format '{{.State.Health.Status}}' samaderma-backend-stage10
docker stop samaderma-backend-stage10
```

The image's health check waits up to 180 seconds for model loading. The test command above should not be described as passed until it is run and the container reports `healthy` plus 200 responses. To build the frontend locally with the API URL embedded, set `VITE_API_BASE_URL` before `npm run build` in `frontend/`; do not put secrets in it.

## Required environment variables

| Variable | Used by | Purpose / production guidance |
|---|---|---|
| `PORT` | Proposed Docker command | Bind port; default 8000. Map the host privately or put behind an ingress. |
| `CORS_ORIGINS` | Backend | Comma-separated exact frontend origins. Required operationally; unset falls back to localhost origins. |
| `MAX_INFERENCE_CONCURRENCY` | Backend | In-process inference slots; keep 1 initially. |
| `INFERENCE_QUEUE_TIMEOUT` | Backend | Queue wait seconds; default 0 means immediate 503 when busy. |
| `RATE_LIMIT_PER_MINUTE` | Backend | Per-process request limit; default 15. This is the actual variable name. |
| `TRUSTED_PROXIES` | Backend | Exact proxy IPs accepted by app-level client-IP parsing; no CIDR support. |
| `FORWARDED_ALLOW_IPS` | Uvicorn | Proxy-header trust list for Uvicorn; set to ingress source(s), not `*`. |
| `VITE_API_BASE_URL` | Frontend build | Public API URL embedded at build time; production must override the localhost fallback. Never a secret. |

## Commands executed and verification results

- Read Stage 8/9 reports, instructions, backend/frontend runtime files, requirements, SPA routing files, checkpoint/config, and existing build output.
- Checked `docker version` and `docker info`: command not found. Checked WSL: not installed. **No image build or container test was executed.**
- Inspected installed versions and Starlette multipart parser spool threshold.
- Forced CPU model load/inference with two Torch threads; measured memory/latency above.
- Ran local CPU `TestClient` smoke checks: health 200, valid training-image prediction 200 with 8 scores, invalid image 400.
- The first Windows peak-RSS probe failed with `WinError 6` because the ctypes declaration truncated the pseudo-handle. I corrected the Win32 `HANDLE` return type and reran the measurement successfully; no project file was changed by the failed probe.
- Rechecked checkpoint MD5 `1071116c406f14625ccd653bf1fde094`.
- Frontend production build was not rerun to avoid rewriting existing `frontend/dist/`; Stage 8/9 reports record their prior successful builds and SPA test.

## Remaining risks and next gate

1. Docker/WSL is absent; build and Linux runtime are the primary blocker. Install/use an approved Linux Docker engine, build the recipe, inspect image layers and file list for exactly one checkpoint, and run the local health/inference tests before describing it as container-ready.
2. Test CPU-only wheel install for Python 3.11/Linux and verify model load, API health, and measured RSS in the built image. Keep an initial 3 GiB memory limit and one worker.
3. Pin transitive dependencies and the base image digest after the first successful Linux build; the current direct dependency pins do not make a fully reproducible image.
4. Set production `CORS_ORIGINS`, frontend `VITE_API_BASE_URL`, and aligned proxy trust values. Correct the documented rate-limit variable and remove unsupported CIDR examples from operational deployment configuration.
5. Configure TLS termination and ingress request-body limits. Investigate bounded in-memory upload parsing if a strict no-disk-upload guarantee is required; current multipart parsing may spool to temporary storage before application checks/rate limiting.
6. Confirm the hosting platform's `PORT`, health-check grace period, writable `/tmp` behavior, shutdown grace period, and memory accounting. No public service has been created or deployed.
