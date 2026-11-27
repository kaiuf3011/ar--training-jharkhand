"""
Minimal in-process rate limiter (sliding 60s window, per client IP).

This is intentionally simple: an in-memory dict, no Redis. It is correct
for one process (fine for a demo / single-instance deployment) and openly
NOT correct across multiple uvicorn workers or replicas — each process
would enforce its own independent limit. A real multi-instance deployment
should move this to Redis (INCR + EXPIRE) without changing the middleware
contract below.
"""
from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings

_WINDOW_SECONDS = 60
_hits: dict[str, deque[float]] = defaultdict(deque)


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        settings = get_settings()
        limit = settings.RATE_LIMIT_PER_MINUTE
        client_ip = request.client.host if request.client else "unknown"
        now = time.monotonic()
        q = _hits[client_ip]
        while q and now - q[0] > _WINDOW_SECONDS:
            q.popleft()
        if len(q) >= limit:
            return Response("Rate limit exceeded", status_code=429)
        q.append(now)
        return await call_next(request)
