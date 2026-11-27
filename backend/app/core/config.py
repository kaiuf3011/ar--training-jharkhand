"""
Application settings, loaded from environment variables / .env.

Nothing secret has a default that is safe for production — JWT_SECRET in
particular MUST be overridden via the environment outside local dev, or
startup raises. See .env.example for the full variable list.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Jharkhand Safety AR — Compliance API"
    API_V1_PREFIX: str = "/api/v1"
    ENV: str = "development"

    # Local dev defaults to SQLite so `uvicorn app.main:app` works with zero
    # setup. Point DATABASE_URL at Postgres for anything resembling
    # production: postgresql+psycopg://user:pass@host:5432/jharkhand_safety_ar
    DATABASE_URL: str = "sqlite:///./dev.db"

    # Dev-only default so the app boots out of the box. docker-compose and
    # any real deployment MUST set a random 32+ byte secret via env/.env.
    JWT_SECRET: str = "dev-only-insecure-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12

    CORS_ORIGINS: list[str] = ["*"]

    # Public base URL used to build the QR verification link embedded in
    # each certificate, e.g. https://compliance.example.gov.in
    PUBLIC_BASE_URL: str = "http://localhost:8000"

    RATE_LIMIT_PER_MINUTE: int = 120

    @property
    def is_default_secret(self) -> bool:
        return self.JWT_SECRET == "dev-only-insecure-secret-change-me"


@lru_cache
def get_settings() -> Settings:
    return Settings()
