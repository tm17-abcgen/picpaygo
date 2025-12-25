"""
Database module for PostgreSQL operations.
Provides connection pooling and query functions for guest history.
"""

import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

import asyncpg

# Database connection configuration
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DB = os.getenv("POSTGRES_DB", "picpaygo")
POSTGRES_USER = os.getenv("POSTGRES_USER", "picpaygo")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "picpaygo_dev")

DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

# Global connection pool
_pool: Optional[asyncpg.Pool] = None


async def init_pool() -> asyncpg.Pool:
    """Initialize the database connection pool."""
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=2,
            max_size=10,
            command_timeout=30,
        )
    return _pool


async def close_pool() -> None:
    """Close the database connection pool."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


@asynccontextmanager
async def get_connection():
    """Get a database connection from the pool."""
    pool = await init_pool()
    async with pool.acquire() as conn:
        yield conn


def _now() -> datetime:
    """Get current UTC datetime."""
    return datetime.now(timezone.utc)


def _uuid_to_str(uuid_value: Optional[UUID]) -> Optional[str]:
    """Convert UUID to string or return None."""
    return str(uuid_value) if uuid_value else None


def _str_to_uuid(str_value: Optional[str]) -> Optional[UUID]:
    """Convert string to UUID or return None."""
    return UUID(str_value) if str_value else None


# =============================================================================
# Guest Sessions
# =============================================================================


async def get_or_create_guest_session(conn: asyncpg.Connection, token_hash: str) -> UUID:
    """
    Get existing guest session by token hash, or create a new one.
    Updates last_seen_at for existing sessions.
    Returns the guest session ID.
    """
    row = await conn.fetchrow(
        "SELECT id FROM guest_sessions WHERE token_hash = $1",
        token_hash
    )
    if row:
        # Update last_seen_at
        await conn.execute(
            "UPDATE guest_sessions SET last_seen_at = NOW() WHERE id = $1",
            row["id"]
        )
        return row["id"]

    # Create new guest session
    guest_id = await conn.fetchval(
        "INSERT INTO guest_sessions (token_hash) VALUES ($1) RETURNING id",
        token_hash
    )
    return guest_id


async def get_guest_session(conn: asyncpg.Connection, guest_id: UUID) -> Optional[Dict[str, Any]]:
    """Get guest session by ID."""
    row = await conn.fetchrow(
        "SELECT id, created_at, last_seen_at FROM guest_sessions WHERE id = $1",
        guest_id
    )
    if not row:
        return None
    return {
        "id": _uuid_to_str(row["id"]),
        "createdAt": row["created_at"].isoformat(),
        "lastSeenAt": row["last_seen_at"].isoformat(),
    }


async def rotate_guest_token(conn: asyncpg.Connection, old_token_hash: str, new_token_hash: str) -> UUID:
    """
    Rotate guest token (used after clearing history).
    Returns the same guest session ID.
    """
    guest_id = await conn.fetchval(
        "UPDATE guest_sessions SET token_hash = $1, last_seen_at = NOW() WHERE token_hash = $2 RETURNING id",
        new_token_hash, old_token_hash
    )
    if not guest_id:
        raise ValueError("Guest session not found")
    return guest_id


async def delete_guest_generations(conn: asyncpg.Connection, guest_id: UUID) -> int:
    """
    Delete all generations owned by a guest session.
    Returns the number of generations deleted.
    """
    result = await conn.execute(
        "DELETE FROM generations WHERE guest_session_id = $1",
        guest_id
    )
    # parse "DELETE <count>"
    count = int(result.split()[-1]) if result else 0
    return count


async def claim_guest_history(conn: asyncpg.Connection, user_id: UUID, guest_id: UUID) -> int:
    """
    Transfer guest generations to a user account.
    Returns the number of generations claimed.
    """
    result = await conn.execute(
        """
        UPDATE generations
        SET user_id = $1, guest_session_id = NULL
        WHERE user_id IS NULL AND guest_session_id = $2
        """,
        user_id, guest_id
    )
    count = int(result.split()[-1]) if result else 0
    return count


# =============================================================================
# Generations
# =============================================================================


async def create_generation(
    conn: asyncpg.Connection,
    user_id: Optional[UUID],
    guest_session_id: Optional[UUID],
    category: str,
) -> UUID:
    """Create a new generation record. Returns the generation ID."""
    generation_id = await conn.fetchval(
        """
        INSERT INTO generations (user_id, guest_session_id, category, status)
        VALUES ($1, $2, $3, 'queued')
        RETURNING id
        """,
        user_id, guest_session_id, category
    )
    return generation_id


async def get_generation(
    conn: asyncpg.Connection,
    generation_id: UUID,
    user_id: Optional[UUID],
    guest_session_id: Optional[UUID],
) -> Optional[Dict[str, Any]]:
    """
    Get a generation by ID with ownership check.
    Returns None if generation doesn't exist or doesn't belong to the user/guest.
    """
    row = await conn.fetchrow(
        """
        SELECT id, user_id, guest_session_id, category, status, error_message, created_at, completed_at
        FROM generations
        WHERE id = $1 AND (user_id = $2 OR guest_session_id = $3)
        """,
        generation_id, user_id, guest_session_id
    )
    if not row:
        return None

    return {
        "id": _uuid_to_str(row["id"]),
        "category": row["category"],
        "status": row["status"],
        "error": row["error_message"],
        "createdAt": row["created_at"].isoformat(),
        "completedAt": row["completed_at"].isoformat() if row["completed_at"] else None,
    }


async def list_generations(
    conn: asyncpg.Connection,
    user_id: Optional[UUID],
    guest_session_id: Optional[UUID],
    scope: str = "auto",
    limit: int = 20,
    cursor: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    List generations based on scope.

    Scopes:
    - "auto": returns user generations if logged in, else guest generations
    - "user": only user generations (requires user_id)
    - "guest": only guest generations (requires guest_session_id)
    - "all": both user and guest generations (requires user_id, useful after login before claim)
    """
    query_parts = []
    params: List[Any] = []
    param_count = 0

    # Base query
    query_parts.append("SELECT id, category, status, error_message, created_at, completed_at FROM generations")

    # Build WHERE clause based on scope
    if scope == "auto":
        # Use whichever is available
        owner_id = user_id if user_id else guest_session_id
        if not owner_id:
            # scope=auto requires at least one owner context
            return []
        param_count += 1
        query_parts.append(f"WHERE (user_id = ${param_count} OR guest_session_id = ${param_count})")
        params.append(owner_id)
    elif scope == "user":
        if not user_id:
            # scope=user requires authentication - return empty to avoid leaking data
            return []
        param_count += 1
        query_parts.append(f"WHERE user_id = ${param_count}")
        params.append(user_id)
    elif scope == "guest":
        if not guest_session_id:
            # scope=guest requires a guest session
            return []
        param_count += 1
        query_parts.append(f"WHERE guest_session_id = ${param_count}")
        params.append(guest_session_id)
    elif scope == "all":
        if not user_id:
            # scope=all requires authenticated user
            return []
        param_count += 1
        query_parts.append(f"WHERE (user_id = ${param_count}")
        params.append(user_id)
        if guest_session_id:
            param_count += 1
            query_parts.append(f"OR guest_session_id = ${param_count})")
            params.append(guest_session_id)
        else:
            query_parts.append(")")

    # Add cursor pagination if provided
    if cursor:
        try:
            cursor_dt = datetime.fromisoformat(cursor)
            param_count += 1
            if "WHERE" in " ".join(query_parts):
                query_parts.append(f"AND created_at < ${param_count}")
            else:
                query_parts.append(f"WHERE created_at < ${param_count}")
            params.append(cursor_dt)
        except ValueError:
            pass  # Invalid cursor, ignore

    # Order and limit
    query_parts.append("ORDER BY created_at DESC")
    param_count += 1
    query_parts.append(f"LIMIT ${param_count}")
    params.append(limit)

    query = " ".join(query_parts)
    rows = await conn.fetch(query, *params)

    return [
        {
            "id": _uuid_to_str(row["id"]),
            "category": row["category"],
            "status": row["status"],
            "error": row["error_message"],
            "createdAt": row["created_at"].isoformat(),
            "completedAt": row["completed_at"].isoformat() if row["completed_at"] else None,
        }
        for row in rows
    ]


async def update_generation_status(
    conn: asyncpg.Connection,
    generation_id: UUID,
    status: str,
    error_message: Optional[str] = None,
) -> None:
    """Update generation status."""
    if status == "completed":
        await conn.execute(
            "UPDATE generations SET status = $1, completed_at = NOW() WHERE id = $2",
            status, generation_id
        )
    else:
        await conn.execute(
            "UPDATE generations SET status = $1, error_message = $2 WHERE id = $3",
            status, error_message, generation_id
        )


# =============================================================================
# Generation Assets
# =============================================================================


async def create_generation_asset(
    conn: asyncpg.Connection,
    generation_id: UUID,
    kind: str,  # "input" or "output"
    bucket: str,
    object_key: str,
    content_type: Optional[str] = None,
    bytes_size: Optional[int] = None,
    sha256_hash: Optional[str] = None,
) -> UUID:
    """Create a generation asset record. Returns the asset ID."""
    asset_id = await conn.fetchval(
        """
        INSERT INTO generation_assets (generation_id, kind, bucket, object_key, content_type, bytes, sha256)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
        """,
        generation_id, kind, bucket, object_key, content_type, bytes_size, sha256_hash
    )
    return asset_id


async def get_generation_assets(
    conn: asyncpg.Connection,
    generation_id: UUID,
) -> List[Dict[str, Any]]:
    """Get all assets for a generation."""
    rows = await conn.fetch(
        """
        SELECT kind, bucket, object_key, content_type, bytes, sha256
        FROM generation_assets
        WHERE generation_id = $1
        ORDER BY kind ASC
        """,
        generation_id
    )

    return [
        {
            "kind": row["kind"],
            "bucket": row["bucket"],
            "objectKey": row["object_key"],
            "contentType": row["content_type"],
            "bytes": row["bytes"],
            "sha256": row["sha256"],
        }
        for row in rows
    ]


async def get_asset_url_info(
    conn: asyncpg.Connection,
    generation_id: UUID,
    kind: str,
) -> Optional[Dict[str, str]]:
    """Get asset URL info for a specific kind (input/output)."""
    row = await conn.fetchrow(
        """
        SELECT bucket, object_key, content_type
        FROM generation_assets
        WHERE generation_id = $1 AND kind = $2
        """,
        generation_id, kind
    )
    if not row:
        return None
    return {
        "bucket": row["bucket"],
        "objectKey": row["object_key"],
        "contentType": row["content_type"],
    }


# =============================================================================
# Cleanup
# =============================================================================


async def cleanup_old_guest_sessions(
    conn: asyncpg.Connection,
    days: int = 30,
) -> int:
    """
    Delete guest sessions and their generations that haven't been seen in N days.
    Only deletes guest sessions that haven't been claimed (i.e., no associated user_id).
    Returns the number of guest sessions deleted.
    """
    result = await conn.execute(
        """
        DELETE FROM guest_sessions
        WHERE last_seen_at < NOW() - INTERVAL '1 day' * $1
          AND id NOT IN (
            SELECT DISTINCT guest_session_id
            FROM generations
            WHERE user_id IS NOT NULL
          )
        """,
        days
    )
    count = int(result.split()[-1]) if result else 0
    return count
