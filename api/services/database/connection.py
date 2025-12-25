"""Database connection and initialization"""
import os
from typing import Optional
import asyncpg

from ...config import DATABASE_URL

db_pool: Optional[asyncpg.Pool] = None


async def init_database() -> None:
    """Initialize database connection and schema"""
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=1,
            max_size=10,
            command_timeout=60,
        )
        
        # Create/update schema
        async with db_pool.acquire() as conn:
            # Create extension
            await conn.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
            
            # Update users table to include Google OAuth fields
            await conn.execute("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS name text,
                ADD COLUMN IF NOT EXISTS surname text,
                ADD COLUMN IF NOT EXISTS google_id text,
                ADD COLUMN IF NOT EXISTS is_google_account boolean NOT NULL DEFAULT false,
                ADD COLUMN IF NOT EXISTS last_login_location text,
                ADD COLUMN IF NOT EXISTS stripe_id text,
                ALTER COLUMN password_hash DROP NOT NULL
            """)
            
            # Ensure credits table exists
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS credits (
                    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    balance integer NOT NULL DEFAULT 0,
                    updated_at timestamptz NOT NULL DEFAULT now(),
                    CHECK (balance >= 0)
                )
            """)
            
            # Ensure sessions table exists with token (not hash)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    session_token text NOT NULL UNIQUE,
                    expires_at timestamptz NOT NULL,
                    created_at timestamptz NOT NULL DEFAULT now()
                )
            """)
            
            # Create indexes
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
                CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
                CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
                CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
            """)
    except Exception as e:
        print(f"Database initialization error: {e}")
        # Continue without database (fallback to in-memory)


async def close_database() -> None:
    """Close database connection pool"""
    global db_pool
    if db_pool:
        await db_pool.close()
        db_pool = None


