"""IP-based free credits tracking."""

from __future__ import annotations

import config
from services.database.connection import get_connection


async def get_ip_credits(ip: str) -> int:
    async with get_connection() as conn:
        row = await conn.fetchrow("SELECT free_remaining FROM ip_credits WHERE ip_address = $1", ip)
        if row:
            await conn.execute("UPDATE ip_credits SET last_seen_at = NOW() WHERE ip_address = $1", ip)
            return int(row["free_remaining"])

        await conn.execute(
            """
            INSERT INTO ip_credits (ip_address, free_remaining, last_seen_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (ip_address) DO UPDATE SET last_seen_at = NOW()
            """,
            ip,
            config.DEFAULT_FREE_CREDITS,
        )
        return config.DEFAULT_FREE_CREDITS


async def set_ip_credits(ip: str, remaining: int) -> None:
    async with get_connection() as conn:
        await conn.execute(
            """
            INSERT INTO ip_credits (ip_address, free_remaining, last_seen_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (ip_address) DO UPDATE
            SET free_remaining = $2, last_seen_at = NOW()
            """,
            ip,
            max(int(remaining), 0),
        )
