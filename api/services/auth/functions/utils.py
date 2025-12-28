"""Shared auth utilities (hashing, timestamps, IP extraction)."""

from __future__ import annotations

import hashlib
import ipaddress
import secrets
from datetime import datetime, timezone

from fastapi import Request

import config


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def hash_token(token: str) -> str:
    """Hash a token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def generate_guest_token() -> str:
    """Generate a new guest token."""
    return secrets.token_urlsafe(32)


def _is_trusted_proxy(ip: str) -> bool:
    """Check if IP is in trusted proxy range."""
    try:
        addr = ipaddress.ip_address(ip)
        for proxy in config.TRUSTED_PROXIES:
            if "/" in proxy:
                if addr in ipaddress.ip_network(proxy, strict=False):
                    return True
            elif ip == proxy:
                return True
    except ValueError:
        pass
    return False


def get_client_ip(request: Request) -> str:
    """Extract real client IP, accounting for proxies.

    Security: Only trusts X-Forwarded-For when request comes from a trusted proxy.
    Walks the chain from right to left to find the first non-proxy IP.
    """
    # Get direct connection IP
    client_ip = request.client.host if request.client else "127.0.0.1"

    # Only process X-Forwarded-For if request came from trusted proxy
    if not _is_trusted_proxy(client_ip):
        return client_ip

    forwarded = request.headers.get("x-forwarded-for")
    if not forwarded:
        return client_ip

    # Walk the chain from right to left, return first non-proxy IP
    ips = [ip.strip() for ip in forwarded.split(",")]
    for ip in reversed(ips):
        if not _is_trusted_proxy(ip):
            return ip

    return client_ip

