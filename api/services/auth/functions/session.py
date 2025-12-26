"""User session and guest session helpers."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

import asyncpg
from fastapi import Request

import config
from services.auth.functions.utils import hash_token
from services.database.connection import get_connection


async def create_session(conn: asyncpg.Connection, user_id: UUID, raw_token: str, expires_at: datetime) -> str:
    token_hash = hash_token(raw_token)
    await conn.execute(
        """
        INSERT INTO sessions (user_id, session_token_hash, expires_at)
        VALUES ($1, $2, $3)
        """,
        user_id,
        token_hash,
        expires_at,
    )
    return token_hash


async def delete_session_by_raw_token(conn: asyncpg.Connection, raw_token: str) -> None:
    token_hash = hash_token(raw_token)
    await conn.execute("DELETE FROM sessions WHERE session_token_hash = $1", token_hash)


async def get_session_user(request: Request) -> Optional[Dict[str, str]]:
    """Resolve the current authenticated user from the session cookie."""
    token = request.cookies.get(config.SESSION_COOKIE)
    if not token:
        return None
    token_hash = hash_token(token)

    async with get_connection() as conn:
        row = await conn.fetchrow(
            """
            SELECT u.email, s.expires_at
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token_hash = $1 AND s.expires_at > NOW()
            """,
            token_hash,
        )
        if not row:
            return None
        return {"email": row["email"]}


# =============================================================================
# Guest sessions (cookie-backed)
# =============================================================================


async def get_or_create_guest_session(conn: asyncpg.Connection, token_hash: str) -> UUID:
    row = await conn.fetchrow("SELECT id FROM guest_sessions WHERE token_hash = $1", token_hash)
    if row:
        await conn.execute("UPDATE guest_sessions SET last_seen_at = NOW() WHERE id = $1", row["id"])
        return row["id"]

    guest_id: UUID = await conn.fetchval(
        "INSERT INTO guest_sessions (token_hash) VALUES ($1) RETURNING id",
        token_hash,
    )
    return guest_id


async def rotate_guest_token(conn: asyncpg.Connection, old_token_hash: str, new_token_hash: str) -> UUID:
    guest_id: Optional[UUID] = await conn.fetchval(
        "UPDATE guest_sessions SET token_hash = $1, last_seen_at = NOW() WHERE token_hash = $2 RETURNING id",
        new_token_hash,
        old_token_hash,
    )
    if not guest_id:
        raise ValueError("Guest session not found")
    return guest_id


async def delete_guest_generations(conn: asyncpg.Connection, guest_session_id: UUID) -> int:
    result = await conn.execute("DELETE FROM generations WHERE guest_session_id = $1", guest_session_id)
    return int(result.split()[-1]) if result else 0


async def claim_guest_history(conn: asyncpg.Connection, user_id: UUID, guest_session_id: UUID) -> int:
    result = await conn.execute(
        """
        UPDATE generations
        SET user_id = $1, guest_session_id = NULL
        WHERE user_id IS NULL AND guest_session_id = $2
        """,
        user_id,
        guest_session_id,
    )
    return int(result.split()[-1]) if result else 0

