"""SMTP email sender with async wrapper."""

from __future__ import annotations

import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from functools import partial
from pathlib import Path
from typing import Optional

import config

logger = logging.getLogger("picpaygo.email")

_TEMPLATE_DIR = Path(__file__).parent / "templates"


class EmailError(Exception):
    """Raised when email sending fails."""

    pass


def _sanitize_header(value: str, max_length: int = 200) -> str:
    """Sanitize header value to prevent header injection attacks."""
    # Remove CRLF characters that could inject additional headers
    sanitized = value.replace("\r", "").replace("\n", "")
    # Enforce max length
    return sanitized[:max_length]


def _load_template(name: str) -> str:
    """Load an HTML template file."""
    template_path = _TEMPLATE_DIR / name
    if not template_path.exists():
        raise EmailError(f"Template not found: {name}")
    return template_path.read_text()


def _send_email_sync(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: Optional[str] = None,
    reply_to: Optional[str] = None,
) -> None:
    """Send email synchronously (runs in thread pool)."""
    if not config.SMTP_HOST or not config.EMAIL_ACCOUNT:
        raise EmailError("SMTP not configured")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = _sanitize_header(subject)
    msg["From"] = f"{config.EMAIL_FROM_NAME} <{config.EMAIL_ACCOUNT}>"
    msg["To"] = to_email

    if reply_to:
        msg["Reply-To"] = _sanitize_header(reply_to)

    # Plain text fallback
    if text_body:
        msg.attach(MIMEText(text_body, "plain"))

    # HTML content
    msg.attach(MIMEText(html_body, "html"))

    try:
        if config.SMTP_USE_SSL:
            # Port 465: Implicit SSL
            with smtplib.SMTP_SSL(
                config.SMTP_HOST, config.SMTP_PORT, timeout=30
            ) as server:
                server.login(config.EMAIL_ACCOUNT, config.EMAIL_PW)
                server.sendmail(config.EMAIL_ACCOUNT, to_email, msg.as_string())
        else:
            # Port 587: STARTTLS
            with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=30) as server:
                server.starttls()
                server.login(config.EMAIL_ACCOUNT, config.EMAIL_PW)
                server.sendmail(config.EMAIL_ACCOUNT, to_email, msg.as_string())

        logger.info("Email sent to=%s subject=%s", to_email, subject)
    except smtplib.SMTPException as exc:
        logger.error("SMTP error sending to=%s: %s", to_email, exc)
        raise EmailError(f"Failed to send email: {exc}") from exc
    except Exception as exc:
        logger.error("Unexpected error sending email to=%s: %s", to_email, exc)
        raise EmailError(f"Failed to send email: {exc}") from exc


async def send_email(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: Optional[str] = None,
    reply_to: Optional[str] = None,
) -> None:
    """Send email asynchronously (runs in thread executor)."""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        partial(_send_email_sync, to_email, subject, html_body, text_body, reply_to),
    )
