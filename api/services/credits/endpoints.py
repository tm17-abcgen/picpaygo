"""Credits endpoints."""

from __future__ import annotations

import logging
import uuid
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Request

import config
import stripe
from models import CreditsResponse
from services.auth.functions.session import get_session_user
from services.auth.functions.user import get_user_id_from_email
from services.auth.functions.utils import get_client_ip
from services.credits.functions.credits import get_user_credits, set_user_credits
from services.credits.functions.ip_credits import get_ip_credits, set_ip_credits
from services.database.connection import get_connection
from services.payments.stripe_checkout import cancel_url, get_pack, success_url

router = APIRouter(prefix=f"{config.API_PREFIX}/credits")
logger = logging.getLogger("picpaygo.credits")


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
    pack_id = payload.get("packId")
    if not isinstance(pack_id, str) or not pack_id:
        raise HTTPException(status_code=400, detail="packId required")

    pack = get_pack(pack_id)
    if not pack:
        raise HTTPException(status_code=400, detail=f"Invalid pack: {pack_id}")
    if not pack.get("price_id"):
        raise HTTPException(status_code=500, detail=f"Stripe price not configured for pack: {pack_id}")

    user = await get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")

    if not config.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe is not configured (missing STRIPE_SECRET_KEY)")

    stripe.api_key = config.STRIPE_SECRET_KEY

    async with get_connection() as conn:
        user_id = await get_user_id_from_email(conn, user["email"])
        if not user_id:
            raise HTTPException(status_code=401, detail="User not found")

        try:
            session = stripe.checkout.Session.create(
                mode="payment",
                line_items=[
                    {
                        "price": pack["price_id"],
                        "quantity": 1,
                    }
                ],
                success_url=success_url(),
                cancel_url=cancel_url(),
                client_reference_id=str(user_id),
                metadata={
                    "user_id": str(user_id),
                    "pack_id": pack_id,
                    "credits": str(pack["credits"]),
                },
            )
        except stripe.error.StripeError as exc:
            error_id = uuid.uuid4().hex
            logger.exception(
                "Stripe checkout failed errorId=%s user=%s pack=%s ip=%s",
                error_id,
                user.get("email"),
                pack_id,
                get_client_ip(request),
            )
            raise HTTPException(status_code=502, detail=f"Stripe checkout failed (errorId: {error_id})")

        try:
            await conn.execute(
                """
                INSERT INTO payments (user_id, pack_id, credits, stripe_session_id, status)
                VALUES ($1, $2, $3, $4, 'created')
                """,
                user_id,
                pack_id,
                pack["credits"],
                session.id,
            )
        except Exception:
            error_id = uuid.uuid4().hex
            logger.exception(
                "Failed to record payment errorId=%s user_id=%s pack=%s stripe_session_id=%s",
                error_id,
                user_id,
                pack_id,
                session.id,
            )
            raise HTTPException(status_code=500, detail=f"Checkout created but payment record failed (errorId: {error_id})")

    return {"url": session.url}
