"""User credits helpers."""

from __future__ import annotations

from services.auth.functions.user import get_user_id_from_email
from services.database.connection import get_connection


async def get_user_credits(email: str) -> int:
    async with get_connection() as conn:
        user_id = await get_user_id_from_email(conn, email)
        if not user_id:
            return 0
        balance = await conn.fetchval("SELECT balance FROM credits WHERE user_id = $1", user_id)
        return int(balance) if balance else 0


async def set_user_credits(email: str, credits: int) -> None:
    async with get_connection() as conn:
        user_id = await get_user_id_from_email(conn, email)
        if not user_id:
            return
        await conn.execute(
            "UPDATE credits SET balance = $1, updated_at = NOW() WHERE user_id = $2",
            max(int(credits), 0),
            user_id,
        )


async def add_user_credits(email: str, amount: int) -> None:
    async with get_connection() as conn:
        user_id = await get_user_id_from_email(conn, email)
        if not user_id:
            return
        await conn.execute(
            "UPDATE credits SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2",
            int(amount),
            user_id,
        )

