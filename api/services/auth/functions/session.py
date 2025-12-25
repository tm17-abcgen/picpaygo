"""Session management functions"""
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict
from fastapi import Request

from ...database.connection import db_pool
from ...config import SESSION_COOKIE, SESSION_TTL_HOURS
from .utils import get_now

# Legacy in-memory storage (fallback)
sessions: Dict[str, Dict] = {}
user_lock = None  # Will be imported from main if needed


async def get_session_user(request: Request) -> Optional[Dict[str, str]]:
    """Get user from session token"""
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None
    
    if db_pool:
        try:
            async with db_pool.acquire() as conn:
                row = await conn.fetchrow("""
                    SELECT u.email, u.id
                    FROM sessions s
                    JOIN users u ON s.user_id = u.id
                    WHERE s.session_token = $1 AND s.expires_at > now()
                """, token)
                if row:
                    return {"email": row["email"]}
                # Clean up expired session
                await conn.execute("DELETE FROM sessions WHERE session_token = $1", token)
        except Exception as e:
            print(f"Database error in get_session_user: {e}")
    
    # Fallback to in-memory (if available)
    # This would require importing user_lock from main, but we'll handle it differently
    return None


async def create_session(user_id: str, expires_at: datetime) -> str:
    """Create a new session and return the token"""
    token = secrets.token_hex(32)
    
    if db_pool:
        try:
            async with db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO sessions (user_id, session_token, expires_at)
                    VALUES ($1, $2, $3)
                """, user_id, token, expires_at)
                return token
        except Exception as e:
            print(f"Database error in create_session: {e}")
    
    # Fallback would go here if needed
    return token


async def delete_session(token: str) -> None:
    """Delete a session by token"""
    if db_pool:
        try:
            async with db_pool.acquire() as conn:
                await conn.execute("DELETE FROM sessions WHERE session_token = $1", token)
        except Exception as e:
            print(f"Database error in delete_session: {e}")


def get_session_expiry() -> datetime:
    """Get session expiry datetime"""
    return get_now() + timedelta(hours=SESSION_TTL_HOURS)

