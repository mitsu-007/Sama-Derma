# CPU-only inference container for SamaDerma. The Windows/CUDA host is not a
# substitute for a Linux build; see the Stage 10 report for verification limits.
FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    OMP_NUM_THREADS=2 \
    MKL_NUM_THREADS=2 \
    OPENBLAS_NUM_THREADS=2 \
    TMPDIR=/tmp \
    PORT=8000 \
    MAX_INFERENCE_CONCURRENCY=1 \
    INFERENCE_QUEUE_TIMEOUT=0.0 \
    RATE_LIMIT_PER_MINUTE=15

WORKDIR /app

RUN apt-get update \
    && apt-get install --yes --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 samaderma \
    && useradd --uid 10001 --gid 10001 --home-dir /app --no-create-home --shell /usr/sbin/nologin samaderma

# Match the verified model stack while installing CPU wheels only.
RUN python -m pip install --no-cache-dir \
      --index-url https://download.pytorch.org/whl/cpu \
      --extra-index-url https://pypi.org/simple \
      torch==2.11.0+cpu torchvision==0.26.0+cpu

COPY backend/requirements-container.txt /tmp/requirements-container.txt
RUN python -m pip install --no-cache-dir -r /tmp/requirements-container.txt \
    && rm /tmp/requirements-container.txt

# Only inference code and the label configuration are copied. The pretrained
# initialization, datasets, reports, predictions, frontend, and training runs
# are outside the allow-listed build context.
COPY --chown=10001:10001 backend/app.py backend/concurrency.py backend/rate_limiter.py backend/schemas.py /app/backend/
COPY --chown=10001:10001 demo_inference.py /app/demo_inference.py
COPY --chown=10001:10001 experiments/experiment_config.json /app/experiments/experiment_config.json
COPY --chown=10001:10001 --chmod=0444 checkpoints/Swin_MC_best_model.pth /app/checkpoints/Swin_MC_best_model.pth

USER 10001:10001
EXPOSE 8000
STOPSIGNAL SIGTERM

HEALTHCHECK --interval=30s --timeout=5s --start-period=180s --retries=3 \
  CMD python -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:' + os.getenv('PORT', '8000') + '/api/health', timeout=3)" || exit 1

# Single worker is deliberate: each worker loads a full model copy and owns an
# independent in-process concurrency limiter and rate-limit window.
CMD ["sh", "-c", "exec uvicorn backend.app:app --host 0.0.0.0 --port \"${PORT:-8000}\" --workers 1 --proxy-headers --forwarded-allow-ips \"${FORWARDED_ALLOW_IPS:-127.0.0.1}\""]
