from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, select
from starlette.requests import Request

from app.core.config import settings
from app.core.exceptions import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from app.db import SessionLocal, init_db
from app.models import User
from app.routers import bookings, coupons, host, listings, uploads, users, wishlist
from app.seed import run_seed

settings.upload_dir.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    init_db()
    db = SessionLocal()
    try:
        user_count = db.scalar(select(func.count()).select_from(User)) or 0
    finally:
        db.close()
    if not user_count:
        run_seed(reset=False)
    yield


app = FastAPI(title="Airbnb API", lifespan=lifespan)


def _error_response(status_code: int):
    async def handler(_request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(status_code=status_code, content={"detail": exc.message})

    return handler


for _error, _status in (
    (NotFoundError, 404),
    (ForbiddenError, 403),
    (ConflictError, 409),
    (BadRequestError, 400),
):
    app.add_exception_handler(_error, _error_response(_status))

app.include_router(users.router)
app.include_router(listings.router)
app.include_router(bookings.router)
app.include_router(coupons.router)
app.include_router(host.router)
app.include_router(wishlist.router)
app.include_router(uploads.router)
app.mount("/static/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
