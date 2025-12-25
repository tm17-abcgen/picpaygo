"""IP-based free credits management"""
from datetime import datetime, timezone
from config import DEFAULT_FREE_CREDITS
from services.auth.functions.utils import get_now

# Legacy in-memory storage
ip_credits: dict = {}


async def get_ip_credits(ip: str) -> int:
    """Get free credits remaining for IP address"""
    record = ip_credits.get(ip)
    if record is None:
        ip_credits[ip] = {
            "free_remaining": DEFAULT_FREE_CREDITS,
            "last_seen_at": get_now(),
        }
        return DEFAULT_FREE_CREDITS
    record["last_seen_at"] = get_now()
    return int(record.get("free_remaining", DEFAULT_FREE_CREDITS))


async def set_ip_credits(ip: str, remaining: int) -> None:
    """Set free credits remaining for IP address"""
    record = ip_credits.setdefault(
        ip,
        {"free_remaining": DEFAULT_FREE_CREDITS, "last_seen_at": get_now()},
    )
    record["free_remaining"] = max(remaining, 0)
    record["last_seen_at"] = get_now()


