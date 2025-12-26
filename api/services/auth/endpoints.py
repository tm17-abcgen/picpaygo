"""Auth + guest history endpoints."""

from __future__ import annotations

import base64
import json
import logging
import secrets
from datetime import timedelta
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Request, Response

import config
from models import AuthResponse
from services.auth.functions.password import hash_password
from services.auth.functions.session import (
    claim_guest_history,
    create_session,
    delete_guest_generations,
    delete_session_by_raw_token,
    get_session_user,
    rotate_guest_token,
)
from services.auth.functions.user import (
    create_email_verification,
    create_user,
    ensure_credits_row,
    get_user_auth_row,
    verify_email_token,
)
from services.auth.functions.utils import generate_guest_token, hash_token, now_utc
from services.database.connection import get_connection

logger = logging.getLogger("picpaygo.auth")
router = APIRouter(prefix=config.API_PREFIX)


@router.post("/auth/register", response_model=AuthResponse)
async def register(request: Request, response: Response) -> AuthResponse:
    payload = await request.json()
    email = (payload.get("email") or "").lower().strip()
    password = payload.get("password") or ""

    logger.info("Registration attempt for email=%s", email)

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    guest_session_id = getattr(request.state, "guest_session_id", None)
    logger.info("Guest session present: %s", bool(guest_session_id))

    async with get_connection() as conn:
        existing_user = await conn.fetchval("SELECT id FROM users WHERE email = $1", email)
        if existing_user:
            logger.info("Email already registered: %s", email)
            raise HTTPException(status_code=409, detail="Email already registered")

        user_id, _, _ = await create_user(conn, email, password)
        logger.info("User created user_id=%s email=%s", user_id, email)

        # Verification step (diagnostic)
        verify_user = await conn.fetchval("SELECT 1 FROM users WHERE id = $1", user_id)
        if not verify_user:
            logger.error("User creation verification failed for user_id=%s", user_id)
            raise HTTPException(status_code=500, detail="User creation failed")

        await ensure_credits_row(conn, user_id)
        logger.info("Credits row created for user_id=%s", user_id)

        verification_token = await create_email_verification(conn, user_id)
        logger.info("Verification token created for user_id=%s", user_id)
        print(f"Verification token for {email}: {verification_token}")

        if guest_session_id:
            await claim_guest_history(conn, user_id, guest_session_id)
            logger.info("Guest history claimed for user_id=%s", user_id)

    token = secrets.token_hex(32)
    expires_at = now_utc() + timedelta(hours=config.SESSION_TTL_HOURS)

    async with get_connection() as conn:
        await create_session(conn, user_id, token, expires_at)
        logger.info("Session created for user_id=%s", user_id)

    response.set_cookie(
        config.SESSION_COOKIE,
        token,
        httponly=True,
        samesite=config.COOKIE_SAMESITE,
        secure=config.COOKIE_SECURE,
        expires=expires_at,
    )
    logger.info("Registration successful for email=%s", email)
    return AuthResponse(user={"email": email, "verificationRequired": "true"})


@router.post("/auth/login", response_model=AuthResponse)
async def login(request: Request, response: Response) -> AuthResponse:
    payload = await request.json()
    email = (payload.get("email") or "").lower().strip()
    password = payload.get("password") or ""
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    async with get_connection() as conn:
        user_row = await get_user_auth_row(conn, email)
        if not user_row:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        salt = base64.b64decode(user_row["salt"])
        if hash_password(password, salt) != user_row["password_hash"]:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user_id = user_row["id"]
        await conn.execute("UPDATE users SET last_login_at = NOW() WHERE id = $1", user_id)

        guest_session_id = getattr(request.state, "guest_session_id", None)
        if guest_session_id:
            await claim_guest_history(conn, user_id, guest_session_id)

    token = secrets.token_hex(32)
    expires_at = now_utc() + timedelta(hours=config.SESSION_TTL_HOURS)

    async with get_connection() as conn:
        await create_session(conn, user_id, token, expires_at)

    response.set_cookie(
        config.SESSION_COOKIE,
        token,
        httponly=True,
        samesite=config.COOKIE_SAMESITE,
        secure=config.COOKIE_SECURE,
        expires=expires_at,
    )
    return AuthResponse(user={"email": email})


@router.post("/auth/logout")
async def logout(request: Request, response: Response) -> Dict[str, bool]:
    token = request.cookies.get(config.SESSION_COOKIE)
    if token:
        async with get_connection() as conn:
            await delete_session_by_raw_token(conn, token)
    response.delete_cookie(config.SESSION_COOKIE)
    return {"ok": True}


@router.get("/auth/me", response_model=AuthResponse)
async def me(request: Request) -> AuthResponse:
    user = await get_session_user(request)
    return AuthResponse(user=user)


@router.get("/auth/verify")
async def verify_email(request: Request) -> Dict[str, Any]:
    token = request.query_params.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token required")

    async with get_connection() as conn:
        try:
            ok = await verify_email_token(conn, token)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    if not ok:
        raise HTTPException(status_code=404, detail="Invalid verification token")

    return {"ok": True, "verified": True}


@router.post("/history/clear")
async def clear_guest_history(request: Request) -> Response:
    guest_session_id = getattr(request.state, "guest_session_id", None)
    if not guest_session_id:
        raise HTTPException(status_code=401, detail="Guest session required")

    guest_token = request.cookies.get(config.GUEST_COOKIE_NAME)
    if not guest_token:
        raise HTTPException(status_code=401, detail="Guest token required")

    async with get_connection() as conn:
        await delete_guest_generations(conn, guest_session_id)

        new_token = generate_guest_token()
        new_token_hash = hash_token(new_token)
        await rotate_guest_token(conn, hash_token(guest_token), new_token_hash)

    response = Response(content=json.dumps({"cleared": True}), media_type="application/json")
    response.set_cookie(
        config.GUEST_COOKIE_NAME,
        new_token,
        max_age=config.GUEST_COOKIE_MAX_AGE,
        httponly=True,
        samesite=config.COOKIE_SAMESITE,
        secure=config.COOKIE_SECURE,
    )
    return response

