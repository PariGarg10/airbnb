"""Request URL helpers for reverse proxies (Render, Railway)."""

from starlette.requests import Request


def request_base_url(request: Request) -> str:
    """Public origin for links, honoring X-Forwarded-Proto and X-Forwarded-Host."""
    forwarded_proto = request.headers.get("x-forwarded-proto")
    scheme = forwarded_proto.split(",")[0].strip() if forwarded_proto else request.url.scheme
    host = request.headers.get("x-forwarded-host") or request.headers.get("host") or request.url.netloc
    host = host.split(",")[0].strip()
    return f"{scheme}://{host}/"
