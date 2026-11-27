import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router, public_router
from app.core.config import get_settings
from app.core.rate_limit import RateLimitMiddleware
from app.db.base import Base
from app.db.session import engine

import app.models  # noqa: F401 — populates Base.metadata

settings = get_settings()
log = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if settings.ENV == "development":
        # Dev convenience only — a real deployment manages schema via
        # `alembic upgrade head`, never create_all(). See migrations/.
        Base.metadata.create_all(bind=engine)
    if settings.is_default_secret and settings.ENV != "development":
        log.error("JWT_SECRET is still the insecure default outside development — refusing to start.")
        sys.exit(1)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description=(
        "Compliance backend for the Jharkhand Safety AR training platform. "
        "See /docs for interactive OpenAPI docs, and /api/v1/* for the "
        "versioned API surface. /verify/{certificate_number} is the one "
        "public, unauthenticated, unversioned route — it is what a "
        "certificate's QR code encodes."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)
app.include_router(public_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "env": settings.ENV}
