"""Job queue + generation persistence helpers."""

from __future__ import annotations

import asyncio
import base64
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

import asyncpg
import httpx

from services import storage

logger = logging.getLogger("picpaygo.jobs")
from services.database.connection import get_connection
from services.generate.functions.openrouter import download_image_from_url, send_openrouter_request

# =============================================================================
# Worker State
# =============================================================================

http_client: Optional[httpx.AsyncClient] = None
job_queue: asyncio.Queue[Dict[str, Any]] = asyncio.Queue()
job_tasks: list[asyncio.Task] = []


async def start_workers(worker_count: int) -> None:
    global http_client
    if http_client is None:
        http_client = httpx.AsyncClient()

    if job_tasks:
        return

    for _ in range(worker_count):
        job_tasks.append(asyncio.create_task(_worker_loop()))


async def stop_workers() -> None:
    global http_client
    for task in job_tasks:
        task.cancel()
    if job_tasks:
        await asyncio.gather(*job_tasks, return_exceptions=True)
    job_tasks.clear()

    if http_client:
        await http_client.aclose()
        http_client = None


async def enqueue_job(payload: Dict[str, Any]) -> None:
    await job_queue.put(payload)


async def _worker_loop() -> None:
    while True:
        try:
            payload = await job_queue.get()
        except asyncio.CancelledError:
            break

        job_id = payload["job_id"]
        try:
            async with get_connection() as conn:
                try:
                    await update_generation_status(conn, uuid.UUID(job_id), "processing")

                    input_info = await get_asset_url_info(conn, uuid.UUID(job_id), "input")
                    if not input_info:
                        raise RuntimeError("Input asset not found")

                    input_bytes = await storage.get_object_bytes_async(
                        input_info["bucket"], input_info["objectKey"]
                    )

                    assert http_client is not None
                    output_url = await send_openrouter_request(
                        http_client,
                        payload["prompt"],
                        input_bytes,
                        input_info["contentType"] or "image/jpeg",
                    )

                    if output_url.startswith("data:"):
                        header, data = output_url.split(",", 1)
                        output_bytes = base64.b64decode(data)
                        output_key = await storage.upload_output_async(job_id, output_bytes, "image/png")
                        await create_generation_asset(
                            conn,
                            uuid.UUID(job_id),
                            "output",
                            storage.BUCKET_GENERATED,
                            output_key,
                            "image/png",
                            len(output_bytes),
                        )
                    else:
                        assert http_client is not None
                        output_bytes = await download_image_from_url(http_client, output_url)
                        output_key = await storage.upload_output_async(job_id, output_bytes, "image/png")
                        await create_generation_asset(
                            conn,
                            uuid.UUID(job_id),
                            "output",
                            storage.BUCKET_GENERATED,
                            output_key,
                            "image/png",
                            len(output_bytes),
                        )

                    await update_generation_status(conn, uuid.UUID(job_id), "completed")
                except Exception as exc:
                    logger.exception("Worker error for job %s: %s", job_id, exc)
                    await update_generation_status(conn, uuid.UUID(job_id), "failed", error_message=str(exc))
        finally:
            job_queue.task_done()


# =============================================================================
# DB helpers (generations + assets)
# =============================================================================


def _uuid_to_str(value: Optional[UUID]) -> Optional[str]:
    return str(value) if value else None


async def create_generation(
    conn: asyncpg.Connection,
    user_id: Optional[UUID],
    guest_session_id: Optional[UUID],
    category: str,
) -> UUID:
    generation_id: UUID = await conn.fetchval(
        """
        INSERT INTO generations (user_id, guest_session_id, category, status)
        VALUES ($1, $2, $3, 'queued')
        RETURNING id
        """,
        user_id,
        guest_session_id,
        category,
    )
    return generation_id


async def get_generation(
    conn: asyncpg.Connection,
    generation_id: UUID,
    user_id: Optional[UUID],
    guest_session_id: Optional[UUID],
) -> Optional[Dict[str, Any]]:
    row = await conn.fetchrow(
        """
        SELECT id, user_id, guest_session_id, category, status, error_message, created_at, completed_at
        FROM generations
        WHERE id = $1 AND (user_id = $2 OR guest_session_id = $3)
        """,
        generation_id,
        user_id,
        guest_session_id,
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
    """List generations with output URLs in a single query (avoiding N+1)."""
    query_parts: List[str] = []
    params: List[Any] = []
    param_count = 0

    # Use LEFT JOIN to get output asset in single query
    query_parts.append("""
        SELECT g.id, g.category, g.status, g.error_message, g.created_at, g.completed_at,
               a.bucket AS output_bucket, a.object_key AS output_key
        FROM generations g
        LEFT JOIN generation_assets a ON g.id = a.generation_id AND a.kind = 'output'
    """)

    if scope == "auto":
        owner_id = user_id if user_id else guest_session_id
        if not owner_id:
            return []
        param_count += 1
        query_parts.append(f"WHERE (g.user_id = ${param_count} OR g.guest_session_id = ${param_count})")
        params.append(owner_id)
    elif scope == "user":
        if not user_id:
            return []
        param_count += 1
        query_parts.append(f"WHERE g.user_id = ${param_count}")
        params.append(user_id)
    elif scope == "guest":
        if not guest_session_id:
            return []
        param_count += 1
        query_parts.append(f"WHERE g.guest_session_id = ${param_count}")
        params.append(guest_session_id)
    elif scope == "all":
        if not user_id:
            return []
        param_count += 1
        query_parts.append(f"WHERE (g.user_id = ${param_count}")
        params.append(user_id)
        if guest_session_id:
            param_count += 1
            query_parts.append(f"OR g.guest_session_id = ${param_count})")
            params.append(guest_session_id)
        else:
            query_parts.append(")")

    if cursor:
        try:
            cursor_dt = datetime.fromisoformat(cursor)
            param_count += 1
            if "WHERE" in " ".join(query_parts):
                query_parts.append(f"AND g.created_at < ${param_count}")
            else:
                query_parts.append(f"WHERE g.created_at < ${param_count}")
            params.append(cursor_dt)
        except ValueError:
            pass

    query_parts.append("ORDER BY g.created_at DESC")
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
            "outputBucket": row["output_bucket"],
            "outputKey": row["output_key"],
        }
        for row in rows
    ]


async def update_generation_status(
    conn: asyncpg.Connection,
    generation_id: UUID,
    status: str,
    error_message: Optional[str] = None,
) -> None:
    if status == "completed":
        await conn.execute(
            "UPDATE generations SET status = $1, completed_at = NOW() WHERE id = $2",
            status,
            generation_id,
        )
    else:
        await conn.execute(
            "UPDATE generations SET status = $1, error_message = $2 WHERE id = $3",
            status,
            error_message,
            generation_id,
        )


async def create_generation_asset(
    conn: asyncpg.Connection,
    generation_id: UUID,
    kind: str,
    bucket: str,
    object_key: str,
    content_type: Optional[str] = None,
    bytes_size: Optional[int] = None,
    sha256_hash: Optional[str] = None,
) -> UUID:
    asset_id: UUID = await conn.fetchval(
        """
        INSERT INTO generation_assets (generation_id, kind, bucket, object_key, content_type, bytes, sha256)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
        """,
        generation_id,
        kind,
        bucket,
        object_key,
        content_type,
        bytes_size,
        sha256_hash,
    )
    return asset_id


async def get_generation_assets(conn: asyncpg.Connection, generation_id: UUID) -> List[Dict[str, Any]]:
    rows = await conn.fetch(
        """
        SELECT kind, bucket, object_key, content_type, bytes, sha256
        FROM generation_assets
        WHERE generation_id = $1
        ORDER BY kind ASC
        """,
        generation_id,
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


async def get_asset_url_info(conn: asyncpg.Connection, generation_id: UUID, kind: str) -> Optional[Dict[str, str]]:
    row = await conn.fetchrow(
        """
        SELECT bucket, object_key, content_type
        FROM generation_assets
        WHERE generation_id = $1 AND kind = $2
        """,
        generation_id,
        kind,
    )
    if not row:
        return None
    return {
        "bucket": row["bucket"],
        "objectKey": row["object_key"],
        "contentType": row["content_type"],
    }
