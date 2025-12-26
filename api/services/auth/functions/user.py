"""User CRUD + email verification helpers."""

from __future__ import annotations

import base64
import secrets
from datetime import timedelta
from typing import Optional
from uuid import UUID

import asyncpg

from services.auth.functions.password import hash_password
from services.auth.functions.utils import hash_token, now_utc


async def get_user_id_from_email(conn: asyncpg.Connection, email: str) -> Optional[UUID]:
    return await conn.fetchval("SELECT id FROM users WHERE email = $1", email.lower())


async def create_user(conn: asyncpg.Connection, email: str, password: str) -> tuple[UUID, str, str]:
    salt = secrets.token_bytes(16)
    salt_b64 = base64.b64encode(salt).decode("ascii")
    password_hash = hash_password(password, salt)

    user_id: UUID = await conn.fetchval(
        """
        INSERT INTO users (email, password_hash, salt)
        VALUES ($1, $2, $3)
        RETURNING id
        """,
        email.lower(),
        password_hash,
        salt_b64,
    )

    return user_id, salt_b64, password_hash


async def get_user_auth_row(conn: asyncpg.Connection, email: str) -> Optional[asyncpg.Record]:
    return await conn.fetchrow(
        "SELECT id, password_hash, salt, is_verified FROM users WHERE email = $1",
        email.lower(),
    )


async def touch_last_login(conn: asyncpg.Connection, user_id: UUID) -> None:
    await conn.execute("UPDATE users SET last_login_at = NOW() WHERE id = $1", user_id)


async def create_email_verification(conn: asyncpg.Connection, user_id: UUID) -> str:
    verification_token = secrets.token_urlsafe(32)
    token_hash = hash_token(verification_token)
    expires_at = now_utc() + timedelta(hours=24)

    await conn.execute(
        """
        INSERT INTO email_verifications (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
        """,
        user_id,
        token_hash,
        expires_at,
    )

    return verification_token


async def verify_email_token(conn: asyncpg.Connection, token: str) -> bool:
    token_hash = hash_token(token)

    row = await conn.fetchrow(
        """
        SELECT ev.user_id, ev.expires_at
        FROM email_verifications ev
        WHERE ev.token_hash = $1
        """,
        token_hash,
    )

    if not row:
        return False

    if row["expires_at"] < now_utc():
        raise ValueError("Verification token expired")

    user_id = row["user_id"]
    await conn.execute("UPDATE users SET is_verified = true WHERE id = $1", user_id)
    await conn.execute("DELETE FROM email_verifications WHERE token_hash = $1", token_hash)
    return True


async def ensure_credits_row(conn: asyncpg.Connection, user_id: UUID) -> None:
    await conn.execute("INSERT INTO credits (user_id, balance) VALUES ($1, 0)", user_id)
