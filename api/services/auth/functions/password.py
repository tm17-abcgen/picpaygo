"""Password hashing helpers."""

from __future__ import annotations

import hashlib


def hash_password(password: str, salt: bytes) -> str:
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return hashed.hex()

