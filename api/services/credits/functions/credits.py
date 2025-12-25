"""Credit management functions"""
from typing import Optional
from ...database.connection import db_pool

# Legacy in-memory storage (fallback)
users: dict = {}


async def get_user_credits(email: str) -> int:
    """Get user credits balance"""
    if db_pool:
        try:
            async with db_pool.acquire() as conn:
                row = await conn.fetchrow("""
                    SELECT c.balance
                    FROM credits c
                    JOIN users u ON c.user_id = u.id
                    WHERE u.email = $1
                """, email)
                return int(row["balance"]) if row else 0
        except Exception as e:
            print(f"Database error in get_user_credits: {e}")
    
    # Fallback to in-memory
    user = users.get(email)
    return int(user.get("credits", 0)) if user else 0


async def set_user_credits(email: str, credits: int) -> None:
    """Set user credits balance"""
    credits = max(credits, 0)
    if db_pool:
        try:
            async with db_pool.acquire() as conn:
                await conn.execute("""
                    UPDATE credits
                    SET balance = $1, updated_at = now()
                    FROM users
                    WHERE credits.user_id = users.id AND users.email = $2
                """, credits, email)
        except Exception as e:
            print(f"Database error in set_user_credits: {e}")
    
    # Fallback to in-memory
    user = users.get(email)
    if user:
        user["credits"] = credits


async def add_user_credits(email: str, amount: int) -> None:
    """Add credits to user balance"""
    if db_pool:
        try:
            async with db_pool.acquire() as conn:
                await conn.execute("""
                    UPDATE credits
                    SET balance = balance + $1, updated_at = now()
                    FROM users
                    WHERE credits.user_id = users.id AND users.email = $2
                """, amount, email)
        except Exception as e:
            print(f"Database error in add_user_credits: {e}")
            # Fall through to in-memory
    
    # Fallback to in-memory
    current = await get_user_credits(email)
    await set_user_credits(email, current + amount)


async def deduct_user_credits(email: str, amount: int) -> None:
    """Deduct credits from user balance"""
    if db_pool:
        try:
            async with db_pool.acquire() as conn:
                await conn.execute("""
                    UPDATE credits
                    SET balance = GREATEST(balance - $1, 0), updated_at = now()
                    FROM users
                    WHERE credits.user_id = users.id AND users.email = $2
                """, amount, email)
        except Exception as e:
            print(f"Database error in deduct_user_credits: {e}")
            # Fall through to in-memory
    
    # Fallback to in-memory
    current = await get_user_credits(email)
    await set_user_credits(email, max(current - amount, 0))

