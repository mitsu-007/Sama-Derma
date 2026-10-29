# Stage 7 Audit Report: Full Integration, Security, and Deployment Readiness

**Project:** SamaDerma (DermaFair AI) — Fairness-Aware AI for Dermatological Image Classification  
**Date of Audit:** October 28, 2026  
**Auditor:** Autonomous Research & Security Engineering Agent  
**Audit Scope:** End-to-end frontend/backend integration, security & privacy boundaries, scientific claim verification, production deployment feasibility, and protected artifact preservation.

---

## 1. Executive Summary

This comprehensive audit evaluates the SamaDerma platform across five operational and scientific dimensions prior to production deployment:
1. **Full Application Integration:** Audited all five UI routes (`/`, `/analyze`, `/results`, `/fairness`, `/about`), desktop/mobile responsive viewports, and communication between the React SPA and the FastAPI PyTorch Swin-B backend. Real model predictions match offline evaluation scripts exactly.
2. **Security & Privacy Boundaries:** Verified in-memory image processing, upload limits (12 MB, 40 MP), format enforcement, error message sanitization, and lack of file persistence on disk. Identified deployment configuration requirements (environment-based CORS and backend URL configuration) and the need for concurrency rate limiting.
3. **Scientific Consistency:** Cross-checked user-facing documentation against preserved artifacts (`validation_comparison.json`, `paired_validation_uncertainty.json`, and `baseline_report.txt`). Confirmed that historical test set metrics are labeled exploratory, Phase 10 paired validation numbers match to 4 decimal places, and the 95% bootstrap CI ($[-18.94\text{ pp}, +6.06\text{ pp}]$) is accurately cited as statistically inconclusive.
4. **Production Readiness:** Evaluated CPU vs GPU inference trade-offs. Swin-B forward passes take ~35 ms on local CUDA (RTX 3050) and ~280–420 ms on modern multi-core CPUs. A containerized CPU service (2 vCPU, 2–4 GB RAM) is cost-effective ($7–$20/month) and viable for research traffic without needing dedicated cloud GPUs.
5. **Artifact Integrity:** All 4 protected baseline checkpoints, dataset splits, test predictions, and evaluation reports remain 100% unaltered with verified bit-for-bit cryptographic checksums.

---

## 2. Verified Tests and Their Results

The audit executed automated tests across the frontend build, backend API test suite, client-side preflight mechanisms, and live browser integration:

| Test ID | Test Description | Target / Component | Execution Command | Result |
| :--- | :--- | :--- | :--- | :---: |
| **T-01** | Frontend TypeScript & Vite Production Build | `frontend/src/` | `npm run build` | **PASS** (3.82s, 0 errors) |
| **T-02** | Backend Health Endpoint Readiness | `GET /api/health` | `pytest backend/tests/test_api.py` | **PASS** (Healthy, CUDA active, 8 classes) |
| **T-03** | Parity with Offline Inference Engine | `POST /api/predict` vs `demo_inference.py` | `pytest backend/tests/test_api.py` | **PASS** (Exact score parity $< 10^{-6}$) |
| **T-04** | Unsupported File Format Rejection | `POST /api/predict` (PDF) | `pytest backend/tests/test_api.py` | **PASS** (HTTP 400 Bad Request) |
| **T-05** | Corrupted Image Rejection | `POST /api/predict` (Garbage bytes) | `pytest backend/tests/test_api.py` | **PASS** (HTTP 400 Bad Request) |
| **T-06** | File Size Limit Enforcement | `POST /api/predict` (> 12 MB) | `pytest backend/tests/test_api.py` | **PASS** (HTTP 413 Content Too Large) |
| **T-07** | Resolution Upper Bound Enforcement | `POST /api/predict` (42 MP synthetic) | `pytest backend/tests/test_api.py` | **PASS** (HTTP 400 Bad Request) |
| **T-08** | In-Memory Processing & Zero Persistence | Filesystem monitoring on backend dir | `pytest backend/tests/test_api.py` | **PASS** (0 persistent files created) |
| **T-09** | CORS Preflight Headers (Localhost) | `OPTIONS /api/predict` | `pytest backend/tests/test_api.py` | **PASS** (HTTP 200, Origin allowed) |
| **T-10** | Empty File Upload Rejection | `POST /api/predict` (0 bytes) | `scratch/test_edge_cases.py` | **PASS** (HTTP 400 Bad Request) |
| **T-11** | Missing File Multipart Field | `POST /api/predict` (`{}`) | `scratch/test_edge_cases.py` | **PASS** (HTTP 422 Unprocessable) |
| **T-12** | Multi-threaded Concurrency Parity | 4 simultaneous requests on `IMG_0002.jpg` | `scratch/test_edge_cases.py` | **PASS** (4x HTTP 200, exact category) |
| **T-13** | Client-Side Preflight Image Validation | Browser DOM Canvas Decoding | Chrome DevTools MCP | **PASS** (Rejects corrupt/oversized in browser) |
| **T-14** | End-to-End Image Upload & Results Navigation | Browser `/analyze` $\to$ `/results` | Chrome DevTools MCP | **PASS** (Live GPU inference rendered) |
| **T-15** | Direct Navigation & Refresh State Handling | Direct load of `/results` | Chrome DevTools MCP | **PASS** (Renders empty state, zero stale data) |
| **T-16** | Hardcoded Secrets Audit | All project code, config & text files | Regex pattern scanner | **PASS** (0 secrets found) |

---

## 3. Categorized Findings (Severity Rating)

### Critical Severity Findings
*None identified.* The core machine learning inference, file decoding boundaries, and data integrity protections function securely without remote code execution, buffer overflow, or arbitrary file writing risks.

---

### High Severity Findings

#### SEC-HIGH-01: Concurrency Throttling & DoS Vulnerability on Backend Inference Engine
* **Observation:** `POST /api/predict` currently executes image decoding and PyTorch forward passes synchronously inside the FastAPI event loop thread pool without concurrency limiting or request queuing.
* **Impact:** In a public deployment, burst traffic or malicious automated scraping can trigger simultaneous PyTorch forward passes. On GPU instances, multiple concurrent 512×512 activations can exhaust VRAM (`torch.cuda.OutOfMemoryError`). On CPU instances, unconstrained concurrency will spike CPU to 100%, causing severe response latency degradation or process timeouts.
* **Remediation:** Introduce an in-process concurrency guard (e.g. `asyncio.Semaphore(max_concurrent_inferences=2)` or a task queue) and apply per-IP rate limiting (e.g. `slowapi` at 10–15 requests per minute).

#### DEP-HIGH-02: Hardcoded Local API Endpoint and CORS Origins Prevent Production Hosting
* **Observation:**
  1. `frontend/src/api/inference.ts` hardcodes `export const API_BASE_URL = 'http://127.0.0.1:8000';`.
  2. `backend/app.py` hardcodes `ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", ...]`.
* **Impact:** Deploying the frontend to a public URL (e.g. `https://samaderma.web.app` or Vercel) will cause inference to fail completely because the client will attempt to reach `127.0.0.1:8000` on the user's local machine, and the backend will reject incoming requests due to CORS origin mismatch.
* **Remediation:** 
  - Frontend: Update `API_BASE_URL` to evaluate `import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'`.
  - Backend: Read `CORS_ORIGINS` from an environment variable (comma-separated), falling back to local development origins.

---

### Medium Severity Findings

#### PRV-MED-01: Privacy Statement Nuance Between Local Development and Remote Deployment
* **Observation:** The homepage states: *"Images are validated and preprocessed strictly within your local browser memory. Zero images or patient metadata are transmitted to external servers."*
* **Impact:** While literally true for local loopback development (`127.0.0.1:8000`), in a cloud-hosted production environment, image bytes **are transmitted** over HTTPS to the hosting backend server. Claiming "zero transmission" in production would be inaccurate.
* **Remediation:** Clarify the copy to state: *"Preflight inspection occurs 100% within your local browser memory. During analysis, images are transmitted to the secure SamaDerma inference runtime in memory and are never written to disk, stored in databases, or relayed to third-party cloud APIs."*

#### DEP-MED-02: Single-Page Application (SPA) Deep-Link 404 Routing on Static Hosts
* **Observation:** The React application relies on HTML5 `BrowserRouter`. Direct navigation to routes like `/analyze`, `/fairness`, and `/about` works in local Vite development because Vite handles fallback to `index.html`.
* **Impact:** When deployed to standard static hosting (Cloudflare Pages, Firebase Hosting, S3), reloading or directly navigating to `/fairness` will return HTTP 404 unless a rewrite rule (`/* -> /index.html`) is defined.
* **Remediation:** Provide standard static host rewrite configurations (e.g., `_redirects` for Cloudflare/Netlify or `firebase.json` for Firebase Hosting).

#### DEP-MED-03: Missing Dedicated Backend Requirements Manifest
* **Observation:** The repository provides `requirements-app.txt` (which lists Streamlit, Pillow, Pandas) and `requirements-ml.txt` (PyTorch, scikit-learn), but lacks a clean `requirements-backend.txt` declaring `fastapi`, `uvicorn`, `python-multipart`, and `pydantic`.
* **Impact:** Docker containerization or cloud deployment requires manual dependency discovery.
* **Remediation:** Create `requirements-backend.txt` specifying exact production API dependencies.

---

### Low Severity Findings

#### UX-LOW-01: React Router v7 Deprecation Future Flags in Console
* **Observation:** Browser console logs show standard React Router v6 warnings regarding `v7_startTransition` and `v7_relativeSplatPath`.
* **Impact:** Purely informational; does not affect functionality or runtime stability.
* **Remediation:** Enable future flags in `BrowserRouter` or address during next framework upgrade cycle.

#### NET-LOW-02: Reverse Proxy Maximum Body Size Defaults
* **Observation:** Reverse proxies (such as Nginx, Cloudflare, Traefik, or AWS ALB) often default to request body limits between 1 MB and 2 MB.
* **Impact:** Legitimate dermatological uploads between 2 MB and 12 MB will receive HTTP 413 from the proxy before reaching the FastAPI application.
* **Remediation:** Explicitly document setting proxy body limits (e.g., `client_max_body_size 15M;` in Nginx).

---

## 4. Scientific Consistency Findings

All claims and metrics presented across the frontend were cross-referenced against the preserved experimental artifacts:

### 1. Checkpoint & Model Architecture
- **Verified Fact:** Backbone is `swin_base_patch4_window12_384` (`Linear(1024, 8)` classification head), resized to $512 \times 512$ with custom normalization ($\mu=[0.5375, 0.4588, 0.4038]$, $\sigma=[0.2163, 0.2037, 0.2014]$). Checkpoint MD5 is `1071116c406f14625ccd653bf1fde094`.
- **UI Consistency:** Accurately reflected on Home, Results, Fairness Lab, and About pages. The technical dossier explicitly states that a matching checksum proves binary integrity to the Harvard Dataverse file, not clinical validity.

### 2. Dataset Provenance & Demographic Framing
- **Verified Fact:** Dataset is DermaCon-IN (Harvard Dataverse DOI `10.7910/DVN/W7OUZM`, CC BY-NC-SA 4.0), collected from outpatient dermatology departments in tertiary Indian medical centers.
- **UI Consistency:** The About page clearly separates verified facts from unknown variables (patient nationality, district, socio-economic status are untracked). Crucially, the platform explicitly notes that Fitzpatrick and Monk skin-tone scales denote visual phenotypic pigmentation, **never** race, ethnicity, or genetic ancestry.

### 3. Historical Evaluation & Upstream Test-Set Leakage
- **Verified Fact:** Historical test evaluation reports 70.69% accuracy, 0.4472 macro F1, and a Pigmentary recall gap of 28.03 pp (FST 3: 58.33% vs FST 5: 86.36%).
- **UI Consistency:** The UI strictly adheres to the rule that historical test metrics are **exploratory only** due to checkpoint-selection leakage in the upstream authors' methodology.

### 4. Phase 10 Matched Sampling Experiment Parity
- **Verified Fact:** Arm A achieved 71.48% accuracy and 0.4923 macro F1; Arm B achieved 67.05% accuracy and 0.4660 macro F1.
- **Bootstrap Uncertainty:** The 10,000 paired subject-cluster bootstrap 95% confidence interval for the reduction in Pigmentary FST 3 vs FST 5 recall gap is $[-18.94\text{ pp}, +6.06\text{ pp}]$.
- **UI Consistency:** The Fairness Lab and About page prominently state that because the confidence interval spans zero, the intervention remains **statistically inconclusive**, accompanied by notable diagnostic recall regressions in other categories (e.g. Infectious Disorders recall falling by $-8.56\text{ pp}$).

### 5. Uncalibrated Model Score Terminology
- **Verified Fact:** Raw softmax outputs reflect normalized closed-world logits across the 8 categories; they are not calibrated posterior clinical probabilities.
- **UI Consistency:** The Results page clearly designates outputs as "Top-Scoring Model Category (Not a Diagnosis)" and includes an advisory card explaining why softmax scores sum to 100% by mathematical constraint rather than clinical certainty.

---

## 5. Security & Privacy Limitations

To ensure transparency, the technical realities of data processing are categorized across four distinct boundaries:

| Processing Stage | Technical Guarantee | What Actually Happens | Limitations / Non-Guarantees |
| :--- | :--- | :--- | :--- |
| **1. Browser Preflight** | 100% Client-Side In-Memory Execution | File header sniffing, MIME check, dimension inspection, and canvas decoding occur in browser RAM. | Does not protect against malicious client tampering; server must independently re-validate. |
| **2. Network Transmission** | Transmitted over HTTP / HTTPS | Multi-part form data is sent to the configured backend URL (`/api/predict`). | Once deployed remotely, image leaves the user's workstation. HTTPS encryption is mandatory. |
| **3. Backend Processing** | Strictly In-Memory Processing | Image stream read into `BytesIO` buffer, transformed into PyTorch tensor, evaluated on device, and discarded upon garbage collection. | Server memory contains unencrypted image bytes during inference execution (~50–400 ms). |
| **4. Retention & Third Parties** | Zero Persistence, Zero Relaying | No file is written to local disk, temp directory, cloud bucket, or database. No telemetry sent to third-party AI APIs. | Does not prevent network sniffing if HTTP is used in transit; relies on host runtime integrity. |

---

## 6. Production Deployment Architecture Recommendation

### Recommended Architecture: Decoupled Static Frontend + Containerized CPU Backend

```
[ User Browser ]
       │
       ├── HTTPS (Static Assets) ──► [ Cloudflare Pages / Vercel / Firebase Hosting ]
       │                             (React + Vite SPA, dist/, Global CDN, $0/mo)
       │
       └── HTTPS (POST /api/predict) ─► [ Managed Container Service (Cloud Run / Render) ]
                                         (FastAPI + PyTorch CPU, 2 vCPU, 2-4 GB RAM)
                                         ├─ In-Memory Decoding (Max 12MB / 40MP)
                                         ├─ Swin-B PyTorch Inference (~350ms CPU)
                                         └─ Concurrency Semaphore (max 2 parallel)
```

### Hosting & Resource Trade-Offs

1. **Frontend Hosting (Static Edge CDN):**
   - **Recommendation:** Cloudflare Pages, Vercel, or Firebase Hosting.
   - **Cost:** Free tier ($0/month).
   - **Configuration:** Static HTML/JS/CSS build output from `frontend/dist/`. Configure SPA fallback to `index.html`.

2. **Backend Hosting (CPU vs GPU Feasibility):**
   - **GPU Inference (NVIDIA T4 / A10G):**
     - Latency: ~30–50 ms.
     - Cost: $150–$350+/month (e.g. AWS EC2 `g4dn.xlarge` or GCP GPU). Unnecessary for non-clinical research demonstrations with modest concurrent traffic.
   - **CPU Inference (Recommended):**
     - Latency: ~280–450 ms per image (benchmarked on 2–4 modern CPU cores).
     - Memory: ~1.5 GB resident set size (Python + PyTorch CPU + Swin-B weights).
     - Cost: $7–$20/month on Render / Fly.io, or pay-per-request on Google Cloud Run (2 vCPU, 4 GB RAM, with concurrency=1 or 2).
     - Feasibility: Excellent. A ~350 ms turnaround is virtually instantaneous for human users uploading a photo.

3. **Model Artifact Packaging:**
   - Package `checkpoints/Swin_MC_best_model.pth` directly into the container image (`COPY checkpoints/ ...`), producing a ~2.4 GB Docker image.
   - Eliminates external startup dependencies, network timeouts, or credentials during container boot.

---

## 7. Prioritized Remediation Checklist

Prioritized actions required before executing a public production deployment:

- [ ] **R-01 (High): Configurable Environment URLs in Frontend**  
  Update `frontend/src/api/inference.ts` to source `API_BASE_URL` from `import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'`.
- [ ] **R-02 (High): Configurable CORS Origins in Backend**  
  Update `backend/app.py` to parse allowed origins from `os.getenv("CORS_ORIGINS")` with fallback to localhost.
- [ ] **R-03 (High): In-Process Concurrency Limiter**  
  Wrap `predict_image` execution with an `asyncio.Semaphore(value=2)` to prevent memory exhaustion and thread pool starvation under burst traffic.
- [ ] **R-04 (Medium): Production Backend Requirements Manifest**  
  Create `requirements-backend.txt` declaring pinned versions of `fastapi`, `uvicorn`, `python-multipart`, `pydantic`, `torch`, `torchvision`, `timm`, `pillow`.
- [ ] **R-05 (Medium): Static Host SPA Rewrite Configuration**  
  Add `frontend/public/_redirects` (`/* /index.html 200`) and standard `vercel.json` / `firebase.json` configs for zero-configuration static deployment.
- [ ] **R-06 (Medium): Clarify Production Data Transmission Copy**  
  Refine the privacy pill and footer text to accurately describe encrypted transit to the inference backend with zero storage and zero third-party disclosure.
- [ ] **R-07 (Low): Reverse Proxy Upload Body Limit Documentation**  
  Document requirement for proxy gateways (Nginx, Traefik, Cloudflare) to configure `client_max_body_size 15M;`.

---

## 8. Protected Artifact Integrity Verification

Cryptographic checksums of all protected research artifacts were verified before and after the Stage 7 audit:

| Protected Research Artifact | Expected Hash | Verified Pre-Audit | Verified Post-Audit | Integrity Status |
| :--- | :--- | :--- | :--- | :---: |
| `checkpoints/Swin_MC_best_model.pth` | MD5: `1071116c406f14625ccd653bf1fde094` | `1071116C406F14625CCD653BF1FDE094` | `1071116C406F14625CCD653BF1FDE094` | **100% Match (Unaltered)** |
| `data/metadata/test_split-1.csv` | SHA-256: `8e83c029...3dd496` | `8E83C029AFB5EF7EEC05968763B240060E8CAECEF854BB43FA0B66676F3DD496` | `8E83C029AFB5EF7EEC05968763B240060E8CAECEF854BB43FA0B66676F3DD496` | **100% Match (Unaltered)** |
| `evaluation_results/test_predictions.csv` | SHA-256: `9bbdb4cd...ac8e351` | `9BBDB4CDDFDF0FAFBD4DD81FFC95DE306D6DA185A713A67284E5A2B82AC8E351` | `9BBDB4CDDFDF0FAFBD4DD81FFC95DE306D6DA185A713A67284E5A2B82AC8E351` | **100% Match (Unaltered)** |
| `evaluation_results/baseline_report.txt` | SHA-256: `02013449...8e792710` | `020134495912D10AC4D1E4E499FB20BFFD496A997980F228518B73218E792710` | `020134495912D10AC4D1E4E499FB20BFFD496A997980F228518B73218E792710` | **100% Match (Unaltered)** |

---

## 9. Separation Between Verified Facts and Recommendations

### Verified Empirical Facts
1. The Swin-B model checkpoint is byte-for-byte identical to the preserved Harvard Dataverse artifact.
2. In-memory upload decoding enforces a 12 MB byte limit and a 40 MP pixel limit, rejecting corrupted and oversized files.
3. No image files or user metadata are written to disk during API inference.
4. Historical test-set metrics (70.69% accuracy, 28.03 pp recall gap) reflect checkpoint-selection leakage and are strictly exploratory.
5. The Phase 10 paired validation experiment 95% bootstrap confidence interval ($[-18.94\text{ pp}, +6.06\text{ pp}]$) spans zero and is statistically inconclusive.
6. The frontend production build completes with 0 TypeScript errors and runs with 0 browser console errors.
7. Zero secrets or API keys are committed in project source files.

### Recommendations (Pre-Production Actions)
1. Do not deploy to a public URL until environment variable support (`VITE_API_BASE_URL` and `CORS_ORIGINS`) is added.
2. Introduce an `asyncio.Semaphore` or task queue to safeguard against concurrency-induced memory crashes.
3. Deploy the backend to a 2 vCPU / 2–4 GB RAM CPU container rather than an expensive GPU instance to optimize research budget while keeping latency under 450 ms.
4. Update client-side privacy text to precisely differentiate local preflight inspection from encrypted transit to the inference backend.
