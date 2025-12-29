"""
Central configuration for the FastAPI backend.

Values are loaded from environment variables with sensible defaults for local
development and Docker Compose.
"""

from __future__ import annotations

import os
from typing import List, Optional


def _get_int(name: str, default: int, *, min_value: Optional[int] = None) -> int:
    raw = os.getenv(name)
    if raw is None or raw == "":
        value = default
    else:
        try:
            value = int(raw)
        except ValueError:
            value = default
    if min_value is not None:
        value = max(value, min_value)
    return value


def _get_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


# =============================================================================
# App / CORS
# =============================================================================

APP_TITLE = os.getenv("APP_TITLE", "PicPayGo")
API_PREFIX = "/api"

_default_cors = "http://localhost:8082,https://picpaygo.com,https://www.picpaygo.com"
CORS_ORIGINS: List[str] = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", _default_cors).split(",")
    if origin.strip()
]


# =============================================================================
# OpenRouter / Generation
# =============================================================================

OPENROUTER_API_URL = os.getenv("OPENROUTER_API_URL", "https://openrouter.ai/api/v1/chat/completions")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-3-pro-image-preview")

JOB_WORKERS = _get_int("JOB_WORKERS", 2, min_value=1)
JOB_TIMEOUT_SECONDS = _get_int("JOB_TIMEOUT_SECONDS", 120, min_value=1)


# =============================================================================
# Sessions / Credits
# =============================================================================

SESSION_COOKIE = os.getenv("SESSION_COOKIE", "session")
SESSION_TTL_HOURS = _get_int("SESSION_TTL_HOURS", 168, min_value=1)
DEFAULT_FREE_CREDITS = _get_int("FREE_CREDITS", 0, min_value=0)  # IP-based guest credits (disabled)
SIGNUP_FREE_CREDITS = _get_int("SIGNUP_FREE_CREDITS", 5, min_value=0)  # Credits for new registered users

GUEST_COOKIE_NAME = os.getenv("GUEST_COOKIE_NAME", "guest")
GUEST_COOKIE_MAX_AGE = _get_int("GUEST_COOKIE_MAX_AGE", 365 * 24 * 60 * 60, min_value=60)

# Default to secure cookies; explicitly set COOKIE_SECURE=false for local dev
COOKIE_SECURE = _get_bool("COOKIE_SECURE", True)
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")

# Trusted proxy CIDR ranges for X-Forwarded-For processing (comma-separated)
_default_proxies = "127.0.0.1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
TRUSTED_PROXIES: List[str] = [
    p.strip() for p in os.getenv("TRUSTED_PROXIES", _default_proxies).split(",") if p.strip()
]


# =============================================================================
# Database (PostgreSQL)
# =============================================================================

POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
POSTGRES_PORT = _get_int("POSTGRES_PORT", 5432, min_value=1)
POSTGRES_DB = os.getenv("POSTGRES_DB", "picpaygo")
POSTGRES_USER = os.getenv("POSTGRES_USER", "picpaygo")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "picpaygo_dev")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}",
)


# =============================================================================
# MinIO (object storage)
# =============================================================================

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ROOT_USER", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
MINIO_USE_HTTPS = _get_bool("MINIO_USE_HTTPS", False)

BUCKET_RAW = os.getenv("MINIO_BUCKET_RAW", "raw-uploads")
BUCKET_GENERATED = os.getenv("MINIO_BUCKET_GENERATED", "generated")


# =============================================================================
# Cleanup
# =============================================================================

GUEST_RETENTION_DAYS = _get_int("GUEST_RETENTION_DAYS", 30, min_value=1)


# =============================================================================
# Stripe (Credits Checkout)
# =============================================================================

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

STRIPE_PRICE_ID_2_99_15 = os.getenv("STRIPE_PRICE_ID_2_99_15", "")
STRIPE_PRICE_ID_4_99_30 = os.getenv("STRIPE_PRICE_ID_4_99_30", "")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8080").rstrip("/")


# =============================================================================
# Email (SMTP)
# =============================================================================

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = _get_int("SMTP_PORT", 465, min_value=1)
SMTP_USE_SSL = _get_bool("SMTP_USE_SSL", True)
EMAIL_ACCOUNT = os.getenv("EMAIL_ACCOUNT", "")
EMAIL_PW = os.getenv("EMAIL_PW", "")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "PicPayGo")
SUPPORT_EMAIL = os.getenv("SUPPORT_EMAIL", "")
