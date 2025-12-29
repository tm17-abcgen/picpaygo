"""Email verification functions."""

from __future__ import annotations

import config
from services.email.sender import _load_template, send_email


async def send_verification_email(email: str, token: str) -> None:
    """Send email verification link to user."""
    verification_url = f"{config.FRONTEND_URL}/verify?token={token}"

    # Load and populate HTML template
    html_template = _load_template("verification.html")
    html_body = html_template.replace("{{VERIFICATION_URL}}", verification_url)
    html_body = html_body.replace("{{APP_NAME}}", config.APP_TITLE)

    # Plain text fallback
    text_body = f"""
Welcome to {config.APP_TITLE}!

Please verify your email by clicking the link below:

{verification_url}

This link expires in 24 hours.

If you did not create an account, please ignore this email.
"""

    await send_email(
        to_email=email,
        subject=f"Verify your {config.APP_TITLE} email",
        html_body=html_body,
        text_body=text_body.strip(),
    )
