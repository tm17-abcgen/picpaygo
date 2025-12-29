"""Stripe-hosted Checkout helpers for credit packs."""

from __future__ import annotations

from typing import Dict, TypedDict

import stripe

import config


class CreditPack(TypedDict):
    credits: int
    price_id: str


def _init_stripe() -> None:
    if config.STRIPE_SECRET_KEY:
        stripe.api_key = config.STRIPE_SECRET_KEY


_init_stripe()


CREDIT_PACKS: Dict[str, CreditPack] = {
    "pack_2_99_15": {"credits": 15, "price_id": config.STRIPE_PRICE_ID_2_99_15},
    "pack_4_99_30": {"credits": 30, "price_id": config.STRIPE_PRICE_ID_4_99_30},
}


def get_pack(pack_id: str) -> CreditPack | None:
    pack = CREDIT_PACKS.get(pack_id)
    if not pack:
        return None
    return pack


def success_url() -> str:
    return f"{config.FRONTEND_URL}/account?checkout=success&session_id={{CHECKOUT_SESSION_ID}}"


def cancel_url() -> str:
    return f"{config.FRONTEND_URL}/account?checkout=cancel"
