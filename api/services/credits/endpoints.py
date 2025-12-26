"""Credits endpoints."""

from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Request

import config
from models import CreditsResponse
from services.auth.functions.session import get_session_user
from services.auth.functions.utils import get_client_ip
from services.credits.functions.credits import add_user_credits, get_user_credits, set_user_credits
from services.credits.functions.ip_credits import get_ip_credits, set_ip_credits

router = APIRouter(prefix=f"{config.API_PREFIX}/credits")


@router.get("", response_model=CreditsResponse)
async def credits(request: Request) -> CreditsResponse:
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
        user_credits = max(user_credits - remaining, 0)
        await set_user_credits(user["email"], user_credits)

    return CreditsResponse(
        balance=free_credits + user_credits,
        freeCredits=free_credits,
        userCredits=user_credits,
        isLoggedIn=bool(user),
    )


@router.post("/checkout")
async def checkout(request: Request) -> Dict[str, Any]:
    payload = await request.json()
    pack_size = int(payload.get("packSize", 0))
    if pack_size not in {5, 10, 20}:
        raise HTTPException(status_code=400, detail="Invalid pack size")

    user = await get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")

    await add_user_credits(user["email"], pack_size)
    return {"ok": True, "added": pack_size}

