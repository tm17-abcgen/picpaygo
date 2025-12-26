"""
PostgreSQL connection pool and schema initialization.

This module is intentionally "infrastructure-only" (pool + schema init). Domain
queries live in their respective service modules.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional

import asyncpg

import config

_pool: Optional[asyncpg.Pool] = None


async def init_pool() -> asyncpg.Pool:
    """Initialize the database connection pool."""
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            config.DATABASE_URL,
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
    """Acquire a connection from the pool."""
    pool = await init_pool()
    async with pool.acquire() as conn:
        yield conn


def _split_sql_statements(sql: str) -> List[str]:
    """Split SQL into statements, handling PL/pgSQL blocks."""
    statements: List[str] = []
    current: List[str] = []
    in_plpgsql = False
    plpgsql_depth = 0

    for line in sql.split("\n"):
        stripped = line.strip()
        if stripped.startswith("DO $$"):
            in_plpgsql = True
            plpgsql_depth = 1
            current.append(line)
        elif in_plpgsql:
            current.append(line)
            if "$$" in line:
                plpgsql_depth += line.count("$$")
                if plpgsql_depth % 2 == 0:
                    in_plpgsql = False
                    statements.append("\n".join(current))
                    current = []
        elif stripped.endswith(";"):
            current.append(line)
            statements.append("\n".join(current))
            current = []
        elif stripped and not stripped.startswith("--"):
            current.append(line)

    if current:
        statements.append("\n".join(current))

    return [s for s in statements if s.strip()]


def _schema_paths() -> List[Path]:
    """Return candidate schema paths for local dev and Docker."""
    env_path = os.getenv("SCHEMA_PATH")
    if env_path:
        return [Path(env_path)]

    here = Path(__file__).resolve()
    repo_root = here.parents[3]
    runtime_root = here.parents[2]

    return [
        runtime_root / "schema.sql",  # Dockerfile copies docs/db/schema.sql here
        runtime_root / "docs" / "db" / "schema.sql",
        repo_root / "docs" / "db" / "schema.sql",
        repo_root / "api" / "schema.sql",
    ]


async def init_schema() -> None:
    """Initialize database schema from SQL file (best-effort, idempotent)."""
    schema_path = next((p for p in _schema_paths() if p.exists()), None)
    if not schema_path:
        print("Warning: Schema file not found; skipping schema init")
        return

    schema_sql = schema_path.read_text()
    statements = _split_sql_statements(schema_sql)

    async with get_connection() as conn:
        for statement in statements:
            statement = statement.strip()
            if not statement:
                continue
            try:
                await conn.execute(statement)
            except Exception as exc:
                if "already exists" not in str(exc):
                    print(f"Schema init error: {exc}")

    print(f"Database schema initialized from {schema_path}")

