"""In-process sliding-window rate limiter for SamaDerma API endpoints.

Architecture & Limitations:
- Tracks request timestamps per client IP in process memory using time.monotonic().
- Does not substitute for edge rate limiting (Cloudflare, AWS WAF) or a shared
  Redis store across multiple horizontally scaled uvicorn workers.
- Safe client IP resolution: never trusts arbitrary X-Forwarded-For headers
  unless the immediate connecting host is an explicitly configured trusted proxy.
"""

from __future__ import annotations

import logging
import os
import threading
import time
from typing import Optional, Set
from fastapi import Request

logger = logging.getLogger("samaderma_ratelimit")


def parse_trusted_proxies(raw_proxies: Optional[str]) -> Set[str]:
    """Parse comma-separated list of trusted reverse proxy IP addresses."""
    if not raw_proxies:
        return set()
    return {ip.strip() for ip in raw_proxies.split(",") if ip.strip()}


def get_client_ip(request: Request, trusted_proxies: Set[str]) -> str:
    """Resolve the client IP address safely.
    
    If the request originates from a trusted reverse proxy, the client IP is
    extracted from the X-Forwarded-For header (leftmost client IP).
    Otherwise, request.client.host is strictly used to prevent IP spoofing.
    """
    immediate_client = request.client.host if request.client else "127.0.0.1"

    if immediate_client in trusted_proxies:
        x_forwarded_for = request.headers.get("x-forwarded-for")
        if x_forwarded_for:
            # Client IP is the first entry in X-Forwarded-For
            ips = [ip.strip() for ip in x_forwarded_for.split(",") if ip.strip()]
            if ips:
                return ips[0]

    return immediate_client


class SlidingWindowRateLimiter:
    """Thread-safe sliding-window rate limiter using time.monotonic()."""

    def __init__(self, max_requests: int = 15, window_seconds: float = 60.0):
        self.max_requests = max(1, max_requests)
        self.window_seconds = max(1.0, window_seconds)
        self._history: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def check(self, client_id: str, now: Optional[float] = None) -> tuple[bool, int]:
        """Check whether client_id may proceed under the current rate limit.
        
        Args:
            client_id: Unique client identifier (e.g. IP address).
            now: Optional timestamp override for deterministic testing.
            
        Returns:
            Tuple of (allowed: bool, retry_after_seconds: int).
        """
        if now is None:
            now = time.monotonic()
        cutoff = now - self.window_seconds

        with self._lock:
            history = self._history.get(client_id, [])
            # Evict timestamps older than the sliding window
            active = [t for t in history if t > cutoff]

            if len(active) >= self.max_requests:
                oldest = active[0]
                retry_after = max(1, int(self.window_seconds - (now - oldest)))
                self._history[client_id] = active
                return False, retry_after

            active.append(now)
            self._history[client_id] = active
            return True, 0

    def reset(self) -> None:
        """Clear all tracking state. Used for test isolation."""
        with self._lock:
            self._history.clear()
