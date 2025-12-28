"""Shared rate limiter instance for all endpoints."""

from __future__ import annotations

from slowapi import Limiter

from services.auth.functions.utils import get_client_ip

# Single shared limiter instance - import this in all endpoint modules
limiter = Limiter(key_func=get_client_ip)
