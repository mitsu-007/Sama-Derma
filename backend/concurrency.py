"""Inference concurrency protection for SamaDerma FastAPI backend.

Guarantees:
- Strictly bounds concurrent PyTorch model forward passes (default = 1).
- Non-blocking acquisition (or bounded queue timeout) returning HTTP 503 when saturated.
- Threadpool execution so the asyncio event loop remains responsive for /api/health.
- Unconditional slot release in finally block upon normal completion or exception.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Optional

logger = logging.getLogger("samaderma_concurrency")


class InferenceConcurrencyLimiter:
    """Manages active concurrency slots for the machine learning inference pipeline."""

    def __init__(self, max_concurrency: int = 1, queue_timeout: float = 0.0):
        self.max_concurrency = max(1, max_concurrency)
        self.queue_timeout = queue_timeout
        self._semaphore: Optional[asyncio.Semaphore] = None
        self._active_count: int = 0

    def _get_semaphore(self) -> asyncio.Semaphore:
        if self._semaphore is None:
            self._semaphore = asyncio.Semaphore(self.max_concurrency)
        return self._semaphore

    @property
    def is_busy(self) -> bool:
        """Returns True if all concurrency slots are currently engaged."""
        sem = self._get_semaphore()
        return sem.locked()

    @property
    def active_count(self) -> int:
        """Number of active requests currently holding an inference slot."""
        return self._active_count

    async def acquire(self) -> bool:
        """Attempt to acquire an inference execution slot.
        
        Returns:
            True if slot acquired, False if capacity is unavailable.
        """
        sem = self._get_semaphore()
        if self.queue_timeout <= 0.0:
            if sem.locked():
                return False
            await sem.acquire()
            self._active_count += 1
            return True

        try:
            await asyncio.wait_for(sem.acquire(), timeout=self.queue_timeout)
            self._active_count += 1
            return True
        except asyncio.TimeoutError:
            return False

    def release(self) -> None:
        """Release the acquired inference execution slot unconditionally."""
        sem = self._get_semaphore()
        self._active_count = max(0, self._active_count - 1)
        sem.release()

    def reset(self) -> None:
        """Reset internal state for testing."""
        self._semaphore = asyncio.Semaphore(self.max_concurrency)
        self._active_count = 0
