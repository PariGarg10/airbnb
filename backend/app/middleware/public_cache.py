from collections.abc import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

PUBLIC_CACHE = "public, max-age=60"


def _is_public_listing_get(path: str) -> bool:
    if path in ("/api/amenities", "/api/categories"):
        return True
    if not path.startswith("/api/listings"):
        return False
    if path.endswith("/quote"):
        return False
    return True


class PublicCacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        response = await call_next(request)
        if request.method != "GET":
            return response
        if request.headers.get("X-User-Id"):
            return response
        if not _is_public_listing_get(request.url.path):
            return response
        if response.status_code == 200:
            response.headers.setdefault("Cache-Control", PUBLIC_CACHE)
        return response
