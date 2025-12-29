"""Password reset email functions."""

from __future__ import annotations

import config
from services.email.sender import _load_template, send_email


async def send_password_reset_email(email: str, token: str) -> None:
    """Send password reset link to user."""
    reset_url = f"{config.FRONTEND_URL}/reset-password?token={token}"

    # Load and populate HTML template
    html_template = _load_template("password_reset.html")
    html_body = html_template.replace("{{RESET_URL}}", reset_url)
    html_body = html_body.replace("{{APP_NAME}}", config.APP_TITLE)

    # Plain text fallback
    text_body = f"""
Reset Your Password

We received a request to reset your password for your {config.APP_TITLE} account.

Click the link below to create a new password:

{reset_url}

This link expires in 1 hour.

If you didn't request a password reset, you can safely ignore this email.
"""

    await send_email(
        to_email=email,
        subject=f"Reset your {config.APP_TITLE} password",
        html_body=html_body,
        text_body=text_body.strip(),
    )
