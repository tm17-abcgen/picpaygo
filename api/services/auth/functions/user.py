"""User CRUD + email verification helpers."""

from __future__ import annotations

import base64
import secrets
from datetime import timedelta
from typing import Optional
from uuid import UUID

import asyncpg

import config
from services.auth.functions.password import hash_password, validate_password
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


async def verify_email_token(conn: asyncpg.Connection, token: str) -> Optional[UUID]:
    """Verify email token and return user_id on success, None on failure."""
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
        return None

    if row["expires_at"] < now_utc():
        raise ValueError("Verification token expired")

    user_id = row["user_id"]
    await conn.execute("UPDATE users SET is_verified = true WHERE id = $1", user_id)
    await conn.execute("DELETE FROM email_verifications WHERE token_hash = $1", token_hash)
    return user_id


async def ensure_credits_row(conn: asyncpg.Connection, user_id: UUID) -> None:
    """Create credits row for user with signup bonus (if configured)."""
    initial_balance = config.SIGNUP_FREE_CREDITS
    async with conn.transaction():
        inserted = await conn.fetchval(
            """INSERT INTO credits (user_id, balance) VALUES ($1, $2)
               ON CONFLICT (user_id) DO NOTHING
               RETURNING user_id""",
            user_id, initial_balance
        )
        if inserted and initial_balance > 0:
            await conn.execute(
                """INSERT INTO credit_ledger (user_id, delta, reason)
                   VALUES ($1, $2, 'signup_bonus')""",
                user_id, initial_balance
            )


async def create_password_reset(conn: asyncpg.Connection, user_id: UUID) -> str:
    """Create a password reset token. Replaces any existing token for this user (UNIQUE constraint)."""
    # Opportunistic cleanup of all expired tokens
    await conn.execute("DELETE FROM password_resets WHERE expires_at < $1", now_utc())

    reset_token = secrets.token_urlsafe(32)
    token_hash = hash_token(reset_token)
    expires_at = now_utc() + timedelta(hours=1)

    await conn.execute(
        """
        INSERT INTO password_resets (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id) DO UPDATE SET
            token_hash = EXCLUDED.token_hash,
            expires_at = EXCLUDED.expires_at,
            created_at = now()
        """,
        user_id,
        token_hash,
        expires_at,
    )
    return reset_token


async def consume_and_verify_password_reset_token(conn: asyncpg.Connection, token: str) -> Optional[UUID]:
    """Atomically verify and consume reset token. Returns user_id if valid, None if not found."""
    token_hash = hash_token(token)
    row = await conn.fetchrow(
        """
        DELETE FROM password_resets
        WHERE token_hash = $1
        RETURNING user_id, expires_at
        """,
        token_hash,
    )
    if not row:
        return None
    if row["expires_at"] < now_utc():
        raise ValueError("Password reset token expired")
    return row["user_id"]


async def update_user_password(conn: asyncpg.Connection, user_id: UUID, new_password: str) -> None:
    """Update user's password with new salt. Validates password strength."""
    is_valid, error_msg = validate_password(new_password)
    if not is_valid:
        raise ValueError(error_msg)
    salt = secrets.token_bytes(16)
    salt_b64 = base64.b64encode(salt).decode("ascii")
    password_hash = hash_password(new_password, salt)

    await conn.execute(
        "UPDATE users SET password_hash = $1, salt = $2 WHERE id = $3",
        password_hash,
        salt_b64,
        user_id,
    )


async def delete_user(conn: asyncpg.Connection, user_id: UUID) -> bool:
    """Delete user account. CASCADE handles related data."""
    result = await conn.execute("DELETE FROM users WHERE id = $1", user_id)
    return result == "DELETE 1"
