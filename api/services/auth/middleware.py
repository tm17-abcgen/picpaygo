"""Middleware for guest session handling."""

from __future__ import annotations

from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

import config
from services.auth.functions.session import get_or_create_guest_session
from services.auth.functions.utils import generate_guest_token, hash_token
from services.database.connection import get_connection


class GuestSessionMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle guest sessions for all API requests.

    - Ensures a guest cookie exists for every visitor
    - Resolves the guest_session_id from the cookie
    - Updates guest_sessions.last_seen_at
    - Attaches guest_session_id to request.state
    - Clears guest cookie on logout
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not request.url.path.startswith(f"{config.API_PREFIX}/"):
            return await call_next(request)

        is_logout = request.url.path == f"{config.API_PREFIX}/auth/logout"

        guest_token = request.cookies.get(config.GUEST_COOKIE_NAME)

        if is_logout:
            response = await call_next(request)
            response.delete_cookie(config.GUEST_COOKIE_NAME)
            return response

        token_hash = hash_token(guest_token) if guest_token else None
        new_guest_token = None

        async with get_connection() as conn:
            if guest_token and token_hash:
                try:
                    guest_session_id = await get_or_create_guest_session(conn, token_hash)
                except Exception:
                    guest_token = None
                    guest_session_id = None
            else:
                guest_session_id = None

            if not guest_token:
                new_guest_token = generate_guest_token()
                new_token_hash = hash_token(new_guest_token)
                guest_session_id = await get_or_create_guest_session(conn, new_token_hash)

            request.state.guest_session_id = guest_session_id
            if new_guest_token:
                request.state.new_guest_token = new_guest_token

        response = await call_next(request)

        if getattr(request.state, "new_guest_token", None):
            response.set_cookie(
                config.GUEST_COOKIE_NAME,
                request.state.new_guest_token,
                max_age=config.GUEST_COOKIE_MAX_AGE,
                httponly=True,
                samesite=config.COOKIE_SAMESITE,
                secure=config.COOKIE_SECURE,
            )

        return response

