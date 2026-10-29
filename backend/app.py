"""FastAPI inference backend for SamaDerma (DermaFair AI).

Serves the verified Swin-B PyTorch checkpoint:
- In-memory decoding and verification strictly bounded to 12 MB and 40 MP.
- Strict class-index mapping across 8 disease categories.
- Zero local image file persistence or remote transmission.
- Sanitized error responses without internal paths or tracebacks.
- Configurable CORS origins via CORS_ORIGINS environment variable.
- In-process concurrency limiter protecting GPU/CPU capacity.
- Configurable sliding-window rate limiting per client IP.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import logging
import os
import sys
from pathlib import Path

# Ensure project root is on sys.path to import demo_inference
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI, File, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

import demo_inference
from demo_inference import (
    DemoInputError,
    MAX_UPLOAD_BYTES,
    load_inference_engine,
    predict_image,
    validate_uploaded_image,
)
from backend.concurrency import InferenceConcurrencyLimiter
from backend.rate_limiter import (
    SlidingWindowRateLimiter,
    get_client_ip,
    parse_trusted_proxies,
)
from backend.schemas import ErrorResponse, HealthResponse, PredictionResponse, ScoreItem

# Minimal, secure logging configuration: do NOT log image bytes or user identifiers
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("samaderma_api")

DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]


def parse_cors_origins(raw_origins: str | None) -> list[str]:
    """Parse and validate CORS origins from environment variable or defaults.
    
    Rejects wildcards ('*') when credentials are enabled.
    Ensures valid HTTP/HTTPS schemes.
    """
    if not raw_origins or not raw_origins.strip():
        return list(DEFAULT_ALLOWED_ORIGINS)

    parsed = []
    for item in raw_origins.split(","):
        origin = item.strip()
        if not origin:
            continue
        if origin == "*":
            logger.warning(
                "Wildcard '*' origin detected in CORS_ORIGINS. "
                "Wildcard with allow_credentials=True is rejected by Starlette. Ignoring wildcard."
            )
            continue
        if not (origin.startswith("http://") or origin.startswith("https://")):
            logger.warning("Invalid origin scheme (must start with http:// or https://): %s", origin)
            continue
        parsed.append(origin)

    return parsed if parsed else list(DEFAULT_ALLOWED_ORIGINS)


# Read environment configurations
ALLOWED_ORIGINS = parse_cors_origins(os.getenv("CORS_ORIGINS"))
MAX_INFERENCE_CONCURRENCY = int(os.getenv("MAX_INFERENCE_CONCURRENCY", "1"))
INFERENCE_QUEUE_TIMEOUT = float(os.getenv("INFERENCE_QUEUE_TIMEOUT", "0.0"))
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "15"))
TRUSTED_PROXIES = parse_trusted_proxies(os.getenv("TRUSTED_PROXIES"))

# Global resource limiters
inference_limiter = InferenceConcurrencyLimiter(
    max_concurrency=MAX_INFERENCE_CONCURRENCY,
    queue_timeout=INFERENCE_QUEUE_TIMEOUT,
)
rate_limiter = SlidingWindowRateLimiter(
    max_requests=RATE_LIMIT_PER_MINUTE,
    window_seconds=60.0,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the verified Swin-B model once during startup."""
    logger.info("Initializing Swin-B inference engine from verified checkpoint...")
    try:
        app.state.engine = load_inference_engine()
        logger.info(
            "Model successfully loaded. Compute device: %s, Classes: %d",
            app.state.engine.device,
            len(app.state.engine.labels),
        )
    except Exception as exc:
        logger.error("Failed to load model checkpoint: %s", exc)
        app.state.engine = None
    # Attach limiters to app state for test observability & overrides
    app.state.inference_limiter = inference_limiter
    app.state.rate_limiter = rate_limiter
    yield
    # Cleanup on shutdown
    app.state.engine = None
    logger.info("Inference engine released.")


app = FastAPI(
    title="SamaDerma AI Research API",
    description="Local inference service for verified dermatological Swin-B model.",
    version="1.0.0",
    lifespan=lifespan,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid input or decoding failure"},
        413: {"model": ErrorResponse, "description": "File size exceeds 12 MB limit"},
        429: {"model": ErrorResponse, "description": "Rate limit exceeded"},
        503: {"model": ErrorResponse, "description": "Model engine unavailable or busy"},
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get(
    "/api/health",
    response_model=HealthResponse,
    summary="Health Check",
    tags=["System"],
)
async def health_check():
    """Verify backend status and model readiness.
    
    Remains immediately responsive even while model inference is actively running.
    """
    engine = getattr(app.state, "engine", None)
    if engine is None:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "degraded",
                "model_loaded": False,
                "device": "unavailable",
                "architecture": demo_inference.ARCHITECTURE,
                "num_classes": len(demo_inference.EXPECTED_LABEL_ORDER),
            },
        )
    return HealthResponse(
        status="healthy",
        model_loaded=True,
        device=str(engine.device),
        architecture=demo_inference.ARCHITECTURE,
        num_classes=len(engine.labels),
    )


@app.post(
    "/api/predict",
    response_model=PredictionResponse,
    summary="Run In-Memory Image Category Inference",
    tags=["Inference"],
)
async def predict(
    request: Request,
    file: UploadFile = File(..., description="Dermatology clinical image (JPEG, PNG, WebP)"),
):
    """Accept an uploaded image in memory, validate dimensions, and return uncalibrated 8-class scores.

    Enforces:
    - Rate limit per client IP
    - Bounded inference concurrency (default = 1)
    - File size <= 12 MB
    - Decoded resolution <= 40 megapixels
    - In-memory decoding with zero disk persistence
    """
    # 1. Rate limit inspection
    active_rate_limiter = getattr(app.state, "rate_limiter", rate_limiter)
    client_ip = get_client_ip(request, TRUSTED_PROXIES)
    allowed, retry_after = active_rate_limiter.check(client_ip)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Maximum {active_rate_limiter.max_requests} requests per minute allowed.",
            headers={"Retry-After": str(retry_after)},
        )

    engine = getattr(app.state, "engine", None)
    if engine is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The model inference engine is not ready or failed to initialize.",
        )

    # 2. Read file bytes with an upper bound to prevent memory exhaustion
    try:
        contents = await file.read(MAX_UPLOAD_BYTES + 1024)
    except Exception as exc:
        logger.error("Error reading upload stream: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read uploaded file stream.",
        )

    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file content provided (empty upload).",
        )

    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"File exceeds the 12 MB upload limit (received {len(contents) / (1024 * 1024):.2f} MB).",
        )

    # 3. Server-side format and decoding preflight validation
    try:
        image = validate_uploaded_image(contents)
    except DemoInputError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )
    except Exception as exc:
        logger.error("Unexpected image validation failure: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The upload could not be decoded as a valid, supported image.",
        )

    # 4. Concurrency-guarded model inference execution
    active_concurrency_limiter = getattr(app.state, "inference_limiter", inference_limiter)
    if not await active_concurrency_limiter.acquire():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The inference engine is currently busy processing another request. Please retry shortly.",
            headers={"Retry-After": "2"},
        )

    try:
        # Offload synchronous PyTorch forward pass to worker threadpool
        raw_scores = await run_in_threadpool(predict_image, image, engine)
    except Exception as exc:
        logger.error("Inference execution failure: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Inference could not be completed on the uploaded input.",
        )
    finally:
        active_concurrency_limiter.release()

    # Format structured response
    score_items = [
        ScoreItem(
            class_index=item["class_index"],
            category=str(item["category"]),
            uncalibrated_score=float(item["probability"]),
        )
        for item in raw_scores
    ]

    return PredictionResponse(
        status="success",
        predicted_category=str(raw_scores[0]["category"]),
        predicted_score=float(raw_scores[0]["probability"]),
        scores=score_items,
        device=str(engine.device),
        timestamp=datetime.now(timezone.utc).isoformat(),
        disclaimer=(
            "Educational & research prototype only. Scores are uncalibrated"
            " model outputs and not clinical diagnoses. Never make medical decisions based on automated classifications."
        ),
    )
