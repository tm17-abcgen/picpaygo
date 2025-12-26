"""
Cleanup worker for old guest sessions and their associated data.

This script can be run as a standalone script or scheduled via cron to:
1. Delete guest sessions that haven't been seen in N days
2. Delete generations owned by those guest sessions
3. Delete associated MinIO objects

Usage:
    python -m api.workers.cleanup
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the api directory to the path
api_dir = Path(__file__).parent.parent
sys.path.insert(0, str(api_dir))

from services import storage
from datetime import datetime, timedelta, timezone
import config
from services.database.connection import close_pool, get_connection, init_pool


# Configuration
GUEST_RETENTION_DAYS = config.GUEST_RETENTION_DAYS


async def cleanup_old_guest_sessions(days: int = GUEST_RETENTION_DAYS) -> dict:
    """
    Delete guest sessions and their data that haven't been seen in N days.

    Returns:
        A dictionary with cleanup statistics.
    """
    print(f"Starting cleanup of guest sessions older than {days} days...")

    async with get_connection() as conn:
        # Find old guest sessions with their generations
        rows = await conn.fetch(
            """
            SELECT gs.id as guest_session_id, gs.last_seen_at,
                   COUNT(g.id) as generation_count
            FROM guest_sessions gs
            LEFT JOIN generations g ON gs.id = g.guest_session_id
            WHERE gs.last_seen_at < NOW() - INTERVAL '1 day' * $1
              AND gs.id NOT IN (
                SELECT DISTINCT guest_session_id
                FROM generations
                WHERE user_id IS NOT NULL
              )
            GROUP BY gs.id, gs.last_seen_at
            """,
            days
        )

        if not rows:
            print("No old guest sessions found.")
            return {
                "guest_sessions_deleted": 0,
                "generations_deleted": 0,
                "bytes_freed": 0,
            }

        guest_session_ids = [row["guest_session_id"] for row in rows]
        total_generations = sum(row["generation_count"] or 0 for row in rows)

        print(f"Found {len(guest_session_ids)} old guest sessions with {total_generations} generations.")

        # Get all generation IDs for these sessions to delete MinIO objects
        generation_ids = []
        for guest_id in guest_session_ids:
            gen_rows = await conn.fetch(
                "SELECT id FROM generations WHERE guest_session_id = $1",
                guest_id
            )
            generation_ids.extend([row["id"] for row in gen_rows])

        # Delete from MinIO (fire and forget - errors logged but don't stop cleanup)
        bytes_freed = 0
        for gen_id in generation_ids:
            try:
                storage.delete_generation_files(str(gen_id))
                bytes_freed += 0  # MinIO doesn't easily return bytes without HEAD requests
            except Exception as e:
                print(f"Warning: Failed to delete MinIO files for generation {gen_id}: {e}")

        # Delete generations (cascade will delete generation_assets)
        result = await conn.execute(
            "DELETE FROM generations WHERE guest_session_id = ANY($1::uuid[])",
            guest_session_ids
        )
        generations_deleted = int(result.split()[-1]) if result else 0

        # Delete guest sessions
        result = await conn.execute(
            "DELETE FROM guest_sessions WHERE id = ANY($1::uuid[])",
            guest_session_ids
        )
        sessions_deleted = int(result.split()[-1]) if result else 0

    print(f"Cleanup complete: {sessions_deleted} sessions, {generations_deleted} generations deleted.")

    return {
        "guest_sessions_deleted": sessions_deleted,
        "generations_deleted": generations_deleted,
        "bytes_freed": bytes_freed,
    }


async def main():
    """Main entry point for the cleanup worker."""
    print("=" * 60)
    print("Guest Session Cleanup Worker")
    print("=" * 60)
    print(f"Started at: {datetime.now(timezone.utc).isoformat()}")

    try:
        # Initialize database pool
        await init_pool()

        # Run cleanup
        stats = await cleanup_old_guest_sessions()

        print(f"\nStats:")
        print(f"  Guest sessions deleted: {stats['guest_sessions_deleted']}")
        print(f"  Generations deleted: {stats['generations_deleted']}")
        print(f"  Bytes freed: {stats['bytes_freed']}")
        print(f"Completed at: {datetime.now(timezone.utc).isoformat()}")

    except Exception as e:
        print(f"Error during cleanup: {e}")
        raise
    finally:
        await close_pool()


if __name__ == "__main__":
    asyncio.run(main())
