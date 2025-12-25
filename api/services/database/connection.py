"""Database connection and initialization"""
import os
from typing import Optional
import asyncpg

from config import DATABASE_URL

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
            
            # Create users table if it doesn't exist
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                    email text NOT NULL UNIQUE,
                    password_hash text,
                    is_verified boolean NOT NULL DEFAULT false,
                    created_at timestamptz NOT NULL DEFAULT now(),
                    last_login_at timestamptz,
                    name text,
                    surname text,
                    google_id text,
                    is_google_account boolean NOT NULL DEFAULT false,
                    last_login_location text,
                    stripe_id text
                )
            """)
            
            # Add columns that might not exist (for existing databases)
            # Only run if table already existed (not just created)
            await conn.execute("""
                DO $$
                BEGIN
                    -- Only alter if table existed before (check if any of the new columns are missing)
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='name') THEN
                            ALTER TABLE users ADD COLUMN name text;
                        END IF;
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='surname') THEN
                            ALTER TABLE users ADD COLUMN surname text;
                        END IF;
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='google_id') THEN
                            ALTER TABLE users ADD COLUMN google_id text;
                        END IF;
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_google_account') THEN
                            ALTER TABLE users ADD COLUMN is_google_account boolean NOT NULL DEFAULT false;
                        END IF;
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login_location') THEN
                            ALTER TABLE users ADD COLUMN last_login_location text;
                        END IF;
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='stripe_id') THEN
                            ALTER TABLE users ADD COLUMN stripe_id text;
                        END IF;
                        -- Make password_hash nullable if it's not already
                        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_hash' AND is_nullable='NO') THEN
                            ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
                        END IF;
                    END IF;
                EXCEPTION WHEN OTHERS THEN
                    -- Ignore errors in column additions
                    NULL;
                END $$;
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


