"""Contact form email functions."""

from __future__ import annotations

import html
from datetime import datetime

import config
from services.email.sender import _load_template, send_email


async def send_contact_email(
    sender_name: str,
    sender_email: str,
    subject: str,
    message: str,
) -> None:
    """Send contact form submission to support email."""
    if not config.SUPPORT_EMAIL:
        raise ValueError("SUPPORT_EMAIL not configured")

    # Load and populate HTML template (escape user input to prevent XSS)
    html_template = _load_template("contact.html")
    html_body = html_template.replace("{{SENDER_NAME}}", html.escape(sender_name))
    html_body = html_body.replace("{{SENDER_EMAIL}}", html.escape(sender_email))
    html_body = html_body.replace("{{SUBJECT}}", html.escape(subject or "No subject"))
    html_body = html_body.replace("{{MESSAGE}}", html.escape(message).replace("\n", "<br>"))
    html_body = html_body.replace("{{TIMESTAMP}}", datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"))
    html_body = html_body.replace("{{APP_NAME}}", config.APP_TITLE)

    # Plain text version
    text_body = f"""
New contact form submission from {config.APP_TITLE}

From: {sender_name} <{sender_email}>
Subject: {subject or "No subject"}
Time: {datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")}

Message:
{message}
"""

    email_subject = f"Contact Form: {subject}" if subject else f"Contact from {sender_name}"

    await send_email(
        to_email=config.SUPPORT_EMAIL,
        subject=email_subject,
        html_body=html_body,
        text_body=text_body.strip(),
        reply_to=sender_email,
    )
