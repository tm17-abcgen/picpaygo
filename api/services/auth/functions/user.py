"""User management functions"""
from typing import Optional
import uuid
from datetime import datetime

from services.database.connection import db_pool
from .utils import get_now

# Legacy in-memory storage (fallback)
users: dict = {}


async def get_user_by_email(email: str) -> Optional[dict]:
    """Get user by email from database"""
    if db_pool:
        try:
            async with db_pool.acquire() as conn:
                row = await conn.fetchrow("""
                    SELECT id, email, name, surname, password_hash, 
                           is_google_account, google_id, created_at, 
                           last_login_at, last_login_location, stripe_id
                    FROM users
                    WHERE email = $1
                """, email)
                if row:
                    return dict(row)
        except Exception as e:
            print(f"Database error in get_user_by_email: {e}")
    
    # Fallback to in-memory
    return users.get(email)


async def create_user(
    email: str,
    password_hash: Optional[str] = None,
    name: Optional[str] = None,
    surname: Optional[str] = None,
    is_google_account: bool = False,
    google_id: Optional[str] = None,
    last_login_location: Optional[str] = None,
) -> str:
    """Create a new user and return user ID"""
    now = get_now()
    
    if db_pool:
        try:
            async with db_pool.acquire() as conn:
                user_id = await conn.fetchval("""
                    INSERT INTO users (
                        email, name, surname, password_hash,
                        is_google_account, google_id,
                        created_at, last_login_at, last_login_location
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8)
                    RETURNING id
                """, email, name, surname, password_hash, is_google_account, google_id, now, last_login_location)
                
                # Initialize credits for new user
                await conn.execute("""
                    INSERT INTO credits (user_id, balance)
                    VALUES ($1, 0)
                    ON CONFLICT (user_id) DO NOTHING
                """, user_id)
                
                return str(user_id)
        except Exception as e:
            print(f"Database error in create_user: {e}")
    
    # Fallback to in-memory
    user_id = str(uuid.uuid4())
    users[email] = {
        "userID": user_id,
        "email": email,
        "name": name or "",
        "surname": surname or "",
        "password_hash": password_hash,
        "credits": 0,
        "creationDate": now.isoformat(),
        "lastLogin": None,
        "lastLoginLocation": last_login_location,
        "stripeID": None,
        "isGoogleAccount": is_google_account,
        "googleID": google_id,
    }
    return user_id


async def update_user_login(email: str, last_login_location: Optional[str] = None) -> None:
    """Update user's last login information"""
    if db_pool:
        try:
            async with db_pool.acquire() as conn:
                await conn.execute("""
                    UPDATE users
                    SET last_login_at = now(),
                        last_login_location = COALESCE($1, last_login_location)
                    WHERE email = $2
                """, last_login_location, email)
        except Exception as e:
            print(f"Database error in update_user_login: {e}")
    
    # Fallback to in-memory
    if email in users:
        users[email]["lastLogin"] = get_now().isoformat()
        if last_login_location:
            users[email]["lastLoginLocation"] = last_login_location


async def user_exists(email: str) -> bool:
    """Check if user exists"""
    if db_pool:
        try:
            async with db_pool.acquire() as conn:
                row = await conn.fetchrow("SELECT 1 FROM users WHERE email = $1", email)
                return row is not None
        except Exception as e:
            print(f"Database error in user_exists: {e}")
    
    # Fallback to in-memory
    return email in users

