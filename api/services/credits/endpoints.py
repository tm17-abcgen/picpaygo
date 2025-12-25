"""Credits endpoints"""
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Request, Response

from ...models import CreditsResponse
from ...services.auth.functions.session import get_session_user
from ...services.auth.functions.utils import get_client_ip
from .functions.credits import get_user_credits, add_user_credits, deduct_user_credits
from .functions.ip_credits import get_ip_credits, set_ip_credits

router = APIRouter(prefix="/api/credits", tags=["credits"])


@router.get("", response_model=CreditsResponse)
async def credits(request: Request) -> CreditsResponse:
    """Get user credits balance"""
    user = await get_session_user(request)
    ip = get_client_ip(request)
    free_credits = await get_ip_credits(ip)
    user_credits = await get_user_credits(user["email"]) if user else 0
    return CreditsResponse(
        balance=free_credits + user_credits,
        freeCredits=free_credits,
        userCredits=user_credits,
        isLoggedIn=bool(user),
    )


@router.post("/consume", response_model=CreditsResponse)
async def consume_credits(request: Request) -> CreditsResponse:
    """Consume credits for generation"""
    payload = await request.json()
    amount = max(int(payload.get("amount", 1)), 1)
    user = await get_session_user(request)
    ip = get_client_ip(request)
    free_credits = await get_ip_credits(ip)
    user_credits = await get_user_credits(user["email"]) if user else 0

    total = free_credits + user_credits
    if total < amount:
        raise HTTPException(status_code=400, detail="Insufficient credits")

    remaining = amount
    if free_credits > 0:
        consume = min(free_credits, remaining)
        free_credits -= consume
        remaining -= consume
        await set_ip_credits(ip, free_credits)

    if remaining > 0:
        if not user:
            raise HTTPException(status_code=400, detail="Login required for paid credits")
        await deduct_user_credits(user["email"], remaining)
        user_credits = await get_user_credits(user["email"])

    return CreditsResponse(
        balance=free_credits + user_credits,
        freeCredits=free_credits,
        userCredits=user_credits,
        isLoggedIn=bool(user),
    )


@router.post("/checkout")
async def checkout(request: Request) -> Dict[str, Any]:
    """Purchase credits pack"""
    payload = await request.json()
    pack_size = int(payload.get("packSize", 0))
    if pack_size not in {5, 10, 20}:
        raise HTTPException(status_code=400, detail="Invalid pack size")
    user = await get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")

    await add_user_credits(user["email"], pack_size)
    return {"ok": True, "added": pack_size}


