"""Automated backend test suite for SamaDerma FastAPI inference service.

Verifies:
- Checkpoint loading and health endpoint.
- Valid image inference and exact parity with demo_inference.py.
- 8-class diagnostic category labels and score distribution.
- Rejection of unsupported, corrupt, and oversized files.
- Rejection of images exceeding 40 megapixels.
- Absence of image file persistence.
- Strict CORS configuration for local frontend.
"""

from __future__ import annotations

import io
import os
from pathlib import Path
import pytest
from PIL import Image
from starlette.testclient import TestClient

from backend.app import app
import demo_inference

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
SAMPLE_IMAGE_PATH = PROJECT_ROOT / "dataset" / "DATASET_0" / "IMG_0002.jpg"


@pytest.fixture(scope="session")
def client():
    """Create a test client that exercises the lifespan context manager."""
    with TestClient(app) as test_client:
        yield test_client


def test_health_endpoint(client: TestClient):
    """GET /api/health must return healthy status and verified model details."""
    response = client.get("/api/health")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert data["architecture"] == "swin_base_patch4_window12_384"
    assert data["num_classes"] == 8
    assert data["device"] in ("cuda", "cpu")


def test_predict_valid_sample_and_parity(client: TestClient):
    """POST /api/predict with permitted sample matches demo_inference exactly."""
    assert SAMPLE_IMAGE_PATH.is_file(), f"Development sample missing: {SAMPLE_IMAGE_PATH}"
    with open(SAMPLE_IMAGE_PATH, "rb") as f:
        file_bytes = f.read()

    # 1. Direct model prediction via demo_inference
    direct_image = demo_inference.validate_uploaded_image(file_bytes)
    direct_scores = demo_inference.predict_image(direct_image, app.state.engine)

    # 2. Prediction via FastAPI endpoint
    response = client.post(
        "/api/predict",
        files={"file": ("IMG_0002.jpg", io.BytesIO(file_bytes), "image/jpeg")},
    )
    assert response.status_code == 200, response.text
    payload = response.json()

    assert payload["status"] == "success"
    assert payload["predicted_category"] == direct_scores[0]["category"]
    assert abs(payload["predicted_score"] - float(direct_scores[0]["probability"])) < 1e-6
    assert len(payload["scores"]) == 8

    # Verify probability sum is 1.0 within floating point precision
    score_sum = sum(s["uncalibrated_score"] for s in payload["scores"])
    assert abs(score_sum - 1.0) < 1e-5

    # Check each class score matches direct inference
    for direct, api in zip(direct_scores, payload["scores"]):
        assert direct["class_index"] == api["class_index"]
        assert direct["category"] == api["category"]
        assert abs(float(direct["probability"]) - api["uncalibrated_score"]) < 1e-6

    # Verify all 8 audited categories are present
    categories_returned = {s["category"] for s in payload["scores"]}
    assert categories_returned == set(demo_inference.EXPECTED_LABEL_ORDER)


def test_predict_unsupported_format(client: TestClient):
    """Non-image files must be rejected with HTTP 400."""
    pdf_bytes = b"%PDF-1.4 mock text file content"
    response = client.post(
        "/api/predict",
        files={"file": ("document.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"] or "valid" in response.json()["detail"]


def test_predict_corrupt_image(client: TestClient):
    """Corrupt bytes with image extension must be rejected with HTTP 400."""
    garbage = b"\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\xff\xfe"
    response = client.post(
        "/api/predict",
        files={"file": ("broken.png", io.BytesIO(garbage), "image/png")},
    )
    assert response.status_code == 400
    assert "could not be decoded" in response.json()["detail"].lower()


def test_predict_oversized_file(client: TestClient):
    """Files exceeding 12 MB must be rejected with HTTP 413."""
    oversized = b"0" * (12 * 1024 * 1024 + 1024)
    response = client.post(
        "/api/predict",
        files={"file": ("huge.jpg", io.BytesIO(oversized), "image/jpeg")},
    )
    assert response.status_code == 413
    assert "12 MB" in response.json()["detail"]


def test_predict_resolution_limit(client: TestClient):
    """Images exceeding 40 megapixels must be rejected with HTTP 400."""
    huge_img = Image.new("RGB", (7000, 6000), color=(100, 150, 200))
    buffer = io.BytesIO()
    huge_img.save(buffer, format="JPEG", quality=20)
    buffer.seek(0)

    response = client.post(
        "/api/predict",
        files={"file": ("huge_res.jpg", buffer, "image/jpeg")},
    )
    assert response.status_code == 400
    assert "dimensions are outside the supported limit" in response.json()["detail"].lower()


def test_no_file_persistence(client: TestClient):
    """Verify that uploaded images are processed in-memory and not written to disk."""
    backend_dir = Path(__file__).resolve().parent.parent
    before_files = set(backend_dir.rglob("*"))

    with open(SAMPLE_IMAGE_PATH, "rb") as f:
        file_bytes = f.read()

    response = client.post(
        "/api/predict",
        files={"file": ("test_persistence.jpg", io.BytesIO(file_bytes), "image/jpeg")},
    )
    assert response.status_code == 200

    after_files = set(backend_dir.rglob("*"))
    # No new file should be created in the backend directory (other than potential __pycache__)
    new_non_cache_files = [f for f in (after_files - before_files) if "__pycache__" not in str(f)]
    assert len(new_non_cache_files) == 0, f"Unexpected files created: {new_non_cache_files}"


def test_cors_headers(client: TestClient):
    """CORS preflight request from http://localhost:5173 must be accepted."""
    response = client.options(
        "/api/predict",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_disallowed_origin(client: TestClient):
    """CORS preflight from an unauthorized origin must be rejected."""
    response = client.options(
        "/api/predict",
        headers={
            "Origin": "https://unauthorized-malicious-site.example.com",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.headers.get("access-control-allow-origin") != "https://unauthorized-malicious-site.example.com"


def test_parse_cors_origins_logic():
    """Unit test for parse_cors_origins handling defaults, wildcards, and schemes."""
    from backend.app import parse_cors_origins, DEFAULT_ALLOWED_ORIGINS

    # Default fallback
    assert parse_cors_origins(None) == DEFAULT_ALLOWED_ORIGINS
    assert parse_cors_origins("") == DEFAULT_ALLOWED_ORIGINS

    # Valid origins
    custom = "https://app.samaderma.org, http://localhost:3000"
    parsed = parse_cors_origins(custom)
    assert parsed == ["https://app.samaderma.org", "http://localhost:3000"]

    # Reject wildcard with allow_credentials
    assert parse_cors_origins("*") == DEFAULT_ALLOWED_ORIGINS

    # Filter invalid schemes
    invalid = "ftp://bad-scheme.com, not-a-url, https://good.com"
    assert parse_cors_origins(invalid) == ["https://good.com"]


def test_concurrency_protection_with_test_double(client: TestClient, monkeypatch):
    """Test concurrency protection using a controlled test double to simulate workload without heavy GPU load."""
    import time
    from concurrent.futures import ThreadPoolExecutor

    # Ensure rate limiter does not interfere
    app.state.rate_limiter.reset()

    # Controlled test double: sleeps 0.35s to simulate an in-progress model forward pass
    def mock_predict_image(image, engine):
        time.sleep(0.35)
        return [
            {"class_index": 6, "category": "Pigmentary Disorders", "probability": 0.95},
            {"class_index": 0, "category": "Infectious Disorders", "probability": 0.05},
        ]

    monkeypatch.setattr("backend.app.predict_image", mock_predict_image)

    with open(SAMPLE_IMAGE_PATH, "rb") as f:
        file_bytes = f.read()

    def send_predict(req_id: int):
        return client.post(
            "/api/predict",
            files={"file": (f"test_conc_{req_id}.jpg", io.BytesIO(file_bytes), "image/jpeg")},
        )

    # Launch two requests virtually simultaneously
    with ThreadPoolExecutor(max_workers=2) as executor:
        f1 = executor.submit(send_predict, 1)
        time.sleep(0.05)  # Ensure f1 enters acquire() first
        f2 = executor.submit(send_predict, 2)
        # Verify health check is responsive during active inference
        health_resp = client.get("/api/health")
        assert health_resp.status_code == 200
        assert health_resp.json()["status"] == "healthy"

        resp1 = f1.result()
        resp2 = f2.result()

    # One request succeeds, the concurrent request is rejected with HTTP 503
    status_codes = {resp1.status_code, resp2.status_code}
    assert 200 in status_codes, f"Expected a 200, got: {status_codes}"
    assert 503 in status_codes, f"Expected 503 capacity rejection, got: {status_codes}"

    rejection = resp1 if resp1.status_code == 503 else resp2
    assert "busy processing another request" in rejection.json()["detail"].lower()
    assert rejection.headers.get("retry-after") == "2"


def test_concurrency_slot_released_on_exception(client: TestClient, monkeypatch):
    """Exceptions during model execution must unconditionally release the concurrency slot."""
    app.state.rate_limiter.reset()

    def faulty_predict(image, engine):
        raise RuntimeError("Synthetic model crash")

    monkeypatch.setattr("backend.app.predict_image", faulty_predict)

    with open(SAMPLE_IMAGE_PATH, "rb") as f:
        file_bytes = f.read()

    # Request fails with 500
    resp_fail = client.post(
        "/api/predict",
        files={"file": ("error.jpg", io.BytesIO(file_bytes), "image/jpeg")},
    )
    assert resp_fail.status_code == 500

    # Ensure slot was cleanly released: a subsequent valid request succeeds
    monkeypatch.undo()
    resp_ok = client.post(
        "/api/predict",
        files={"file": ("ok.jpg", io.BytesIO(file_bytes), "image/jpeg")},
    )
    assert resp_ok.status_code == 200


def test_rate_limiter_enforcement_and_rejection(client: TestClient):
    """Requests exceeding the configured rate limit must receive HTTP 429."""
    from backend.rate_limiter import SlidingWindowRateLimiter

    # Use a small test rate limiter on app state
    test_limiter = SlidingWindowRateLimiter(max_requests=2, window_seconds=60.0)
    app.state.rate_limiter = test_limiter

    with open(SAMPLE_IMAGE_PATH, "rb") as f:
        file_bytes = f.read()

    def send_one():
        return client.post(
            "/api/predict",
            files={"file": ("rl_test.jpg", io.BytesIO(file_bytes), "image/jpeg")},
        )

    # First 2 requests succeed
    assert send_one().status_code == 200
    assert send_one().status_code == 200

    # Third request is rate limited
    resp_limited = send_one()
    assert resp_limited.status_code == 429
    assert "Rate limit exceeded" in resp_limited.json()["detail"]
    assert "retry-after" in resp_limited.headers

    # Reset limiter allows requests again
    test_limiter.reset()
    assert send_one().status_code == 200

    # Restore default rate limiter
    app.state.rate_limiter = SlidingWindowRateLimiter(max_requests=15, window_seconds=60.0)


def test_rate_limiter_trusted_proxy_logic():
    """Verify that X-Forwarded-For is only parsed when immediate client is in trusted_proxies."""
    from backend.rate_limiter import get_client_ip
    from starlette.requests import Request

    trusted = {"10.0.0.1"}

    # Case 1: Untrusted client sending spoofed X-Forwarded-For
    scope_untrusted = {
        "type": "http",
        "client": ("198.51.100.5", 5000),
        "headers": [(b"x-forwarded-for", b"203.0.113.195")],
    }
    req_untrusted = Request(scope_untrusted)
    assert get_client_ip(req_untrusted, trusted) == "198.51.100.5"

    # Case 2: Trusted proxy sending client X-Forwarded-For
    scope_trusted = {
        "type": "http",
        "client": ("10.0.0.1", 5000),
        "headers": [(b"x-forwarded-for", b"203.0.113.195, 10.0.0.1")],
    }
    req_trusted = Request(scope_trusted)
    assert get_client_ip(req_trusted, trusted) == "203.0.113.195"

