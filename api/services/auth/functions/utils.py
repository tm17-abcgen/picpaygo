"""Shared auth utilities (hashing, timestamps, IP extraction)."""

from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timezone

from fastapi import Request


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def hash_token(token: str) -> str:
    """Hash a token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def generate_guest_token() -> str:
    """Generate a new guest token."""
    return secrets.token_urlsafe(32)


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

