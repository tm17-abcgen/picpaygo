"""Utility functions for authentication"""
from datetime import datetime, timezone
from fastapi import Request


def get_now() -> datetime:
    """Get current UTC datetime"""
    return datetime.now(timezone.utc)


def get_client_ip(request: Request) -> str:
    """Extract client IP address from request"""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


