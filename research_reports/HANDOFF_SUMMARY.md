# DermaFair AI — Research handoff

## Current state

Revision 3 Arm A was safely stopped after six completed train/validation epochs at the user's request. Epoch 6 is the selected best checkpoint. Epoch 7 was not started, Arm B was not started, and there is no two-arm comparison. The process has stopped and GPU memory returned to desktop baseline.

The model checkpoint is **not an exact-resume checkpoint**. Only model weights were saved; optimizer, scheduler, GradScaler, RNG, sampler-generator, and partial-epoch state were not. No exact resume command exists. A continuation tomorrow must be a new versioned run restarting both arms from the shared official pretrained initialization; do not load the epoch-6 weights as if resuming.

## Revision 3 experiment

- Config: `experiments/revision_03/experiment_config.json`, SHA-256 `d85e7547d1f6a8012019f9019a7d1fa99be335e4b2639cccef3d4c2bdf296a5a`.
- Initialization: official Swin-B `experiments/pretrained/swin_base_patch4_window12_384_22kto1k.pth`, SHA-256 `0f6f7d28cb1ddf43af5583163310b29cb3805a32044f226025352494702c606e`.
- Data: saved subject-disjoint training/validation split only (3,519 train images / 1,917 subjects; 880 validation images / 479 subjects; zero subject overlap). Test metadata was not used.
- Common setup: seed 20261026; microbatch 1 / accumulation 8; effective batch 8; two pinned persistent loader workers; same initialization, transforms, optimizer, loss, schedule, validation and checkpoint selection across arms. The only planned arm difference is sampling strategy.
- Runtime preflight estimate: 4.296 hours for both seven-epoch arms including 20% margin and five-minute startup reserve, within the 5.5-hour cap.

## Actual Arm A results

Completed six epochs in 4,344.62 seconds (72.41 minutes). Epoch 6 validation: accuracy 0.697727, macro F1 0.485632, loss 1.193351; selected best checkpoint. Peak reserved VRAM was 2.746 GiB. The detailed per-class and subgroup results are in the phase report and epoch log.

At epoch 6, Pigmentary Disorders recall was FST 3: 25/31 (0.8065) and FST 5: 27/35 (0.7714), a difference of +0.0350. These are single-arm validation results with sparse supports; they do not establish a fairness effect. No Arm B results exist.

- Checkpoint: `experiments/revision_03/runs_revision_03/A_standard_class_balanced/best_model.pth`
- Checkpoint SHA-256: `88c5d13ad9648b6fb0d08ff967b7b96395573c339078bf72a57d98700bdd2500`
- Run result: `experiments/revision_03/runs_revision_03/A_standard_class_balanced/run_result.json`
- Run manifest: `experiments/revision_03/runs_revision_03/run_manifest.json`
- Epoch metrics, including class and diagnosis/Fitzpatrick supports: `experiments/revision_03/runs_revision_03/A_standard_class_balanced/epoch_log.jsonl`
- Best validation predictions: `experiments/revision_03/runs_revision_03/A_standard_class_balanced/best_validation_predictions.csv`

Original checkpoint, test metadata, and existing evaluation hashes remain unchanged: checkpoint MD5 `1071116c406f14625ccd653bf1fde094`; test CSV SHA-256 `8e83c029afb5ef7eec05968763b240060e8caecef854bb43fa0b66676f3dd496`; existing predictions SHA-256 `9bbdb4cddfdf0fafbd4dd81ffc95de306d6da185a713a67284e5a2b82ac8e351`; baseline report SHA-256 `020134495912d10ac4d1e4e499fb20bfd496a997980f228518b73218e792710`.

## Safe restart instructions

Original launch command:

```powershell
.\.venv\Scripts\python.exe -u experiments\revision_03\run_experiments.py
```

This is **not** a resume command. Revision 3 refuses to reuse its existing run directory, and the required training state was not saved. For a matched comparison, create a new versioned config/runner/output directory and restart both arms from the verified official pretrained weights with the same saved split and frozen arm definitions. Do not start only Arm B and present it as a paired comparison to the partial Arm A.

## Earlier findings and limitations

The existing test report gives accuracy 70.6946% and macro F1 0.447159; prior Pigmentary Disorders recall was FST 3 28/48 and FST 5 38/44. The upstream checkpoint was selected using this test split as validation, so those findings are exploratory, not confirmatory. The current revision did not read the test set.

## Reports

- [Phase 1 — project/data audit](PHASE_01_PROJECT_DATA_AUDIT.md)
- [Phase 2 — environment preflight](PHASE_02_ENVIRONMENT_PREFLIGHT.md)
- [Phase 3 — checkpoint and mapping](PHASE_03_CHECKPOINT_AND_MAPPING.md)
- [Phase 4 — training subgroup counts](PHASE_04_TRAINING_SUBGROUP_COUNTS.md)
- [Phase 5 — experiment design and gate](PHASE_05_EXPERIMENT_DESIGN_AND_GATE.md)
- [Phase 6 — experiment preparation](PHASE_06_EXPERIMENT_PREPARATION.md)
- [Phase 7 — initial training stop](PHASE_07_TRAINING_RESULTS.md)
- [Phase 8 — microbatch benchmark and runtime gate](PHASE_08_MICROBATCH_BENCHMARK.md)
- [Phase 9 — accelerated execution and safe stop](PHASE_09_ACCELERATED_EXECUTION.md)

## Artifact protection

No original dataset, official split, original checkpoint, existing evaluation output, or original project script was modified. New revision-specific files and run artifacts are under `experiments/revision_03/`; reports are under `research_reports/`.

## Local demonstration milestone

A standalone local Streamlit demo is available in `demo_app.py`, with inference and safe image-validation helpers in `demo_inference.py`. It strictly loads the original verified Swin-B checkpoint, uses the audited eight-class mapping and 512×512 preprocessing, and displays all eight uncalibrated softmax scores with a non-diagnostic-use warning. It also presents the existing historical fairness artifacts as exploratory and explicitly does not claim an intervention effect. No Grad-CAM is shown because a suitable Swin explanation method was not validated for this app.

Verification: strict model load and training-image inference succeeded on CUDA; eight finite outputs summed to 1 within floating-point precision. Invalid and oversized inputs were rejected. Headless Streamlit health returned HTTP 200, and all four pages passed Streamlit AppTest without exceptions. The official test split was not used for demo inference verification. Protected checkpoint, test CSV, existing predictions, and baseline report hashes matched the prior handoff values. The app does not train, save uploads, or use external inference services.

Launch from the project root with `\.venv\Scripts\python.exe -m streamlit run demo_app.py`. Full environment, tested behavior, and limitations are recorded in [Demo app handoff](DEMO_APP_HANDOFF.md).

## Core sampling experiment milestone (Phase 10)

The matched validation comparison is complete. Revision 4 Arm A and revision 5 Arm B both trained seven epochs from the same verified official Swin-B initialization, on the same saved subject-disjoint training/validation split, with identical protocol SHA-256 `75a9b4da27d1002cab0f51cc77747dbbd093646f5507c9675db63aee8fc04872` and identical initial classifier-head fingerprint. Revision 4's first Arm B start was stopped before optimization because only 3.813 GiB VRAM was free; the failure was preserved. Revision 5's separate B-only runner verified Arm A's config/checkpoint and completed Arm B sequentially. Both run manifests record no official test split read.

Validation-selected scores: Arm A accuracy 71.48%, macro F1 0.4923; Arm B accuracy 67.05%, macro F1 0.4660. B-minus-A was −4.43 percentage points accuracy and −0.0262 macro F1. The Pigmentary Disorders FST 3 minus FST 5 recall gap moved from +6.36 pp (25/31 vs 26/35) to +0.28 pp (24/31 vs 27/35), a −6.08 pp change; the paired subject-bootstrap 95% interval for this change was −18.94 to +6.06 pp. Several overall and class metrics regressed. This is directionally consistent with narrowing the selected subgroup gap but remains inconclusive and does not establish fairness improvement.

The first B start's VRAM preflight failure, exact subgroup/class results, uncertainty method and intervals, artifact locations, and limitations are documented in [Phase 10 — matched sampling comparison](PHASE_10_MATCHED_SAMPLING_COMPARISON.md). Machine-readable metrics are in `experiments/revision_05/runs_revision_05/validation_comparison.json` and `paired_validation_uncertainty.json`. Actual training took 4,910.02 seconds for A plus 4,751.83 seconds for B (about 2.68 hours combined), excluding separate setup/preflight. Peak reserved CUDA memory was 2.746 GiB. Original checkpoint, test split, existing predictions, baseline report, application files, and prior reports remain preserved; the final protected-artifact hash values are recorded in the Phase 10 report.

No further tuning is authorized by these results. For stronger evidence, preregister additional paired seeds or use an independent cohort. Any eventual use of the existing test split must remain a one-time exploratory comparison because it was previously used for upstream checkpoint selection.

## Stage 10 — deployment preparation

Deployment preparation is documented in [Stage 10 report](STAGE_10_DEPLOYMENT_PREPARATION.md). A CPU-only backend Dockerfile, direct dependency pins, and default-deny `.dockerignore` were created. The image recipe copies the existing checkpoint once to `/app/checkpoints/Swin_MC_best_model.pth` and only the required label config at `/app/experiments/experiment_config.json`. Local forced-CPU inference and API smoke checks passed (health 200, prediction 200 with eight scores, invalid image 400); measured process peak RSS was about 1.35 GiB. Docker and WSL are not installed, so no Linux image was built or tested and deployment readiness is not yet verified. No public deployment or protected artifact changes occurred.

The deployment report records required environment variables and live-code discrepancies with Stage 9 (rate-limit variable name/default, proxy CIDR handling, frontend blank-URL fallback), plus the multipart parser's temporary-spooling risk and the need for an ingress upload limit. Next gate: build and test the image on Linux, inspect layers for one checkpoint copy, and measure container RSS/health before any public deployment.

## Competitive UI/UX Benchmark & Healthcare Refinement Milestone

The application UI/UX was evaluated against industry benchmarks—**VisualDx**, **Skinive**, **Ada Health**, and the **NHS Digital Service Manual / WCAG 2.2 AA**. High-value improvements were implemented while strictly preserving scientific integrity:

1. **Persistent Disclaimer:** Mounted `DisclaimerBanner.tsx` globally in `App.tsx` above `Navbar`, ensuring persistent non-clinical research notices without cluttering the approved homepage.
2. **Clinical Condition Dossier (`diseaseTaxonomy.ts`):** Added structured medical references for the 8 audited DermaCon-IN categories (Fitzpatrick's Dermatology 9th ed, Rook's 9th ed, ICD-11 Chapter 14) with explicit disclaimers separating broad category labels from individual disease diagnoses.
3. **Difference Between Top Two Model Scores:** Computed and displayed in percentage points (`+X.XX pp`) without clinical certainty labels or arbitrary thresholds.
4. **Accessible Dual View & Non-Color-Only Cues:** Added an interactive view switcher between the horizontal bar chart and an accessible semantic HTML table, with explicit `#1` to `#8` rank badges, numeric percentages, and high-contrast styling.
5. **Universal Accessibility:** Implemented and verified a WCAG 2.2 Level A skip link, `prefers-reduced-motion` CSS rules, and `:focus-visible` outlines. Verified keyboard tab navigation to `main#main-content` (`targetIsMain: true`).
6. **Historical Reference Evaluation (`referenceDemonstration.ts`):** Integrated fixed, genuine Swin-B evaluation outputs (`MD5: 1071116c406f14625ccd653bf1fde094`, CUDA:0) on curated DermaCon-IN reference data for direct `/results` visitors.
7. **Verification & Testing:** Production build passed cleanly (`npm run build`, 1,611 modules, exit code 0). Tested live and demo flows on desktop (1440×900) and mobile (390×844) with zero console errors. Full benchmark report and explicit unverified observation limitations documented in [Competitive UI/UX Benchmark Report](COMPETITIVE_UI_UX_BENCHMARK.md).

## Stage 9: Final Integration, Regression Testing & Deployment Readiness Milestone

The comprehensive final integration audit across the entire application stack is complete. All user journeys (Flows A through H), automated backend tests (14/14 passed), empirical latency benchmarks (CUDA vs CPU), and cryptographic artifact checksum verifications have been successfully validated.

1. **End-to-End User Journeys (Flows A through H):** 100% pass rate in headless browser testing via Chrome DevTools MCP. Tested live upload & inference, reference demonstration loading, accessible table/chart toggle, Fairness Lab baseline and Phase 10 exploration, About page dossier, direct route access & hard reload across all routes (`/`, `/analyze`, `/results`, `/fairness`, `/about`), client-side rejection of invalid/oversized/corrupt uploads, and responsive mobile navigation with global disclaimer.
2. **Backend Automated Regression:** All 14 tests in `backend/tests/test_api.py` passed in 11.30s, verifying health monitoring, prediction parity, format/size/resolution guards, zero disk persistence, CORS origin filtering and wildcard rejection, in-process concurrency limiting, and sliding-window rate limiting with trusted proxy support.
3. **Empirical Latency Benchmarks (10 Passes):**
   - **CUDA (NVIDIA RTX 3050 6GB):** Mean 97.78 ms, median 96.07 ms, min 95.61 ms, max 108.18 ms. VRAM allocated: 368.9 MB, reserved: 568.0 MB.
   - **CPU (AMD Ryzen 5 / Host CPU):** Mean 2,063.99 ms, median 2,104.57 ms, min 1,763.82 ms, max 2,168.04 ms. Host RAM: ~1.2 GB.
4. **Frontend Production Build:** `tsc && vite build` compiled 1,611 modules in 3.49s with zero errors or warnings (`dist/index.html` 1.13 kB, JS 368 kB, CSS 39 kB). `_redirects` verified in `dist/`.
5. **Artifact Integrity:** Cryptographic hashes for all 4 protected baseline files (`checkpoints/Swin_MC_best_model.pth`, `data/metadata/test_split-1.csv`, `evaluation_results/test_predictions.csv`, `evaluation_results/baseline_report.txt`) match historical records with 100% precision. Zero model retraining or test set access occurred.
6. **Deployment Verdict:** **GO** for static edge CDN (frontend) + containerized Python 3.11 service (FastAPI backend). Detailed checklist and deployment topology documented in [Stage 9 Final Integration Audit Report](STAGE_9_FINAL_INTEGRATION_AUDIT.md).

## Latest gate — Stage 10 deployment preparation

Stage 10 supersedes the earlier Stage 9 container-readiness verdict pending Linux verification. The CPU-only Dockerfile, pinned direct runtime requirements, and default-deny build context are prepared, but Docker and WSL are absent; no image was built or tested. The local forced-CPU backend smoke test passed, with 1.35 GiB peak process RSS and 2.83-second image inference. The exact container paths, PowerShell build/test commands, environment variables, Stage 9 documentation mismatches, and upload spool/privacy risk are recorded in [STAGE_10_DEPLOYMENT_PREPARATION.md](STAGE_10_DEPLOYMENT_PREPARATION.md). Do not describe the container as working or publicly deploy it until the Linux build, health check, valid/invalid upload tests, and image layer inspection pass.

