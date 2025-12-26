"""Incoming webhook endpoints (Stripe)."""

from __future__ import annotations

from typing import Any, Dict

from asyncpg.exceptions import UniqueViolationError
from fastapi import APIRouter, HTTPException, Request

import config
import stripe
from services.database.connection import get_connection

router = APIRouter(prefix=f"{config.API_PREFIX}")


@router.post("/webhook")
async def stripe_webhook(request: Request) -> Dict[str, Any]:
    if not config.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="STRIPE_WEBHOOK_SECRET not configured")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, config.STRIPE_WEBHOOK_SECRET)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event.get("type")
    if event_type in {"checkout.session.completed", "checkout.session.async_payment_succeeded"}:
        session = event["data"]["object"]
        if event_type == "checkout.session.completed" and session.get("payment_status") != "paid":
            return {"ok": True}
        await _fulfill_checkout_session(session)
    elif event_type == "checkout.session.async_payment_failed":
        session = event["data"]["object"]
        await _mark_payment_status(session.get("id"), "failed")
    elif event_type == "checkout.session.expired":
        session = event["data"]["object"]
        await _mark_payment_status(session.get("id"), "canceled")

    return {"ok": True}


async def _fulfill_checkout_session(session: Dict[str, Any]) -> None:
    stripe_session_id = session.get("id")
    if not stripe_session_id:
        return

    payment_intent = session.get("payment_intent")
    amount_total = session.get("amount_total")
    currency = session.get("currency")

    metadata = session.get("metadata") or {}
    metadata_user_id = metadata.get("user_id")
    metadata_pack_id = metadata.get("pack_id")
    metadata_credits = metadata.get("credits")

    async with get_connection() as conn:
        async with conn.transaction():
            payment = await conn.fetchrow(
                """
                SELECT id, user_id, credits, status
                FROM payments
                WHERE stripe_session_id = $1
                FOR UPDATE
                """,
                stripe_session_id,
            )

            if payment:
                if payment["status"] == "fulfilled":
                    return
                payment_id = payment["id"]
                user_id = payment["user_id"]
                credits = int(payment["credits"])
            else:
                if not metadata_user_id or not metadata_pack_id or not metadata_credits:
                    return
                user_id = metadata_user_id
                credits = int(metadata_credits)
                try:
                    payment_id = await conn.fetchval(
                        """
                        INSERT INTO payments (
                          user_id, pack_id, credits, stripe_session_id, stripe_payment_intent_id,
                          status, amount_total, currency
                        )
                        VALUES ($1, $2, $3, $4, $5, 'paid', $6, $7)
                        RETURNING id
                        """,
                        user_id,
                        metadata_pack_id,
                        credits,
                        stripe_session_id,
                        payment_intent,
                        amount_total,
                        currency,
                    )
                except UniqueViolationError:
                    payment = await conn.fetchrow(
                        """
                        SELECT id, user_id, credits, status
                        FROM payments
                        WHERE stripe_session_id = $1
                        FOR UPDATE
                        """,
                        stripe_session_id,
                    )
                    if not payment or payment["status"] == "fulfilled":
                        return
                    payment_id = payment["id"]
                    user_id = payment["user_id"]
                    credits = int(payment["credits"])

            await conn.execute(
                """
                UPDATE payments
                SET status = 'paid',
                    stripe_payment_intent_id = COALESCE($1, stripe_payment_intent_id),
                    amount_total = COALESCE($2, amount_total),
                    currency = COALESCE($3, currency)
                WHERE id = $4
                """,
                payment_intent,
                amount_total,
                currency,
                payment_id,
            )

            try:
                await conn.execute(
                    """
                    INSERT INTO credit_ledger (user_id, delta, reason, stripe_session_id)
                    VALUES ($1, $2, 'purchase', $3)
                    """,
                    user_id,
                    credits,
                    stripe_session_id,
                )
            except UniqueViolationError:
                return

            await conn.execute(
                """
                INSERT INTO credits (user_id, balance)
                VALUES ($1, $2)
                ON CONFLICT (user_id)
                DO UPDATE SET balance = credits.balance + EXCLUDED.balance, updated_at = NOW()
                """,
                user_id,
                credits,
            )

            await conn.execute(
                """
                UPDATE payments
                SET status = 'fulfilled', fulfilled_at = NOW()
                WHERE id = $1
                """,
                payment_id,
            )


async def _mark_payment_status(stripe_session_id: str | None, status: str) -> None:
    if not stripe_session_id:
        return
    if status not in {"canceled", "failed"}:
        return
    async with get_connection() as conn:
        await conn.execute(
            "UPDATE payments SET status = $1 WHERE stripe_session_id = $2 AND status != 'fulfilled'",
            status,
            stripe_session_id,
        )
