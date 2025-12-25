"""
Middleware for guest session handling.
"""

import hashlib
import os
import secrets
from typing import Callable, Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

import database

# Guest cookie configuration
GUEST_COOKIE_NAME = "guest"
GUEST_COOKIE_MAX_AGE = 365 * 24 * 60 * 60  # 1 year in seconds


def hash_token(token: str) -> str:
    """Hash a guest token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def generate_guest_token() -> str:
    """Generate a new guest token."""
    return secrets.token_urlsafe(32)


class GuestSessionMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle guest sessions for all requests.

    - Ensures a guest cookie exists for every visitor
    - Resolves the guest_session_id from the cookie
    - Updates guest_sessions.last_seen_at
    - Attaches guest_session_id to request.state
    - Handles cookie rotation for new tokens
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip middleware for non-API routes if needed
        if not request.url.path.startswith("/api/"):
            return await call_next(request)

        # For /api/auth/logout, we want to clear the guest cookie too
        is_logout = request.url.path == "/api/auth/logout"

        guest_token = request.cookies.get(GUEST_COOKIE_NAME)

        if is_logout:
            # Clear guest cookie on logout, but don't create a new one
            response = await call_next(request)
            response.delete_cookie(GUEST_COOKIE_NAME)
            return response

        token_hash = hash_token(guest_token) if guest_token else None
        new_guest_token = None

        async with database.get_connection() as conn:
            if guest_token and token_hash:
                try:
                    guest_session_id = await database.get_or_create_guest_session(conn, token_hash)
                except Exception:
                    # If there's any error with the existing token, create a new one
                    guest_token = None
                    guest_session_id = None

            if not guest_token:
                # Create new guest session
                new_guest_token = generate_guest_token()
                new_token_hash = hash_token(new_guest_token)
                guest_session_id = await database.get_or_create_guest_session(conn, new_token_hash)

            # Attach guest_session_id to request.state for use in routes
            request.state.guest_session_id = guest_session_id
            if new_guest_token:
                request.state.new_guest_token = new_guest_token

        # Process the request
        response = await call_next(request)

        # Set new guest cookie if we created one
        if hasattr(request.state, "new_guest_token") and request.state.new_guest_token:
            response.set_cookie(
                GUEST_COOKIE_NAME,
                request.state.new_guest_token,
                max_age=GUEST_COOKIE_MAX_AGE,
                httponly=True,
                samesite="lax",
                secure=False,  # Set to True in production with HTTPS
            )

        return response
