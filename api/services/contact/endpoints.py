"""Contact form endpoints."""

from __future__ import annotations

import logging
from typing import Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

import config
from services.email.contact import send_contact_email
from services.email.sender import EmailError

logger = logging.getLogger("picpaygo.contact")
router = APIRouter(prefix=config.API_PREFIX)


class ContactRequest(BaseModel):
    """Contact form submission request."""

    name: str
    email: EmailStr
    subject: str = ""
    message: str


@router.post("/contact")
async def submit_contact(request: ContactRequest) -> Dict[str, bool]:
    """Handle contact form submission."""
    # Basic validation
    if not request.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")

    if len(request.message) > 5000:
        raise HTTPException(status_code=400, detail="Message too long (max 5000 characters)")

    logger.info(
        "Contact form submission from=%s email=%s subject=%s",
        request.name,
        request.email,
        request.subject or "(no subject)",
    )

    try:
        await send_contact_email(
            sender_name=request.name.strip(),
            sender_email=request.email,
            subject=request.subject.strip(),
            message=request.message.strip(),
        )
        logger.info("Contact email sent successfully")
    except EmailError as exc:
        logger.error("Failed to send contact email: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to send message. Please try again.")
    except ValueError as exc:
        logger.error("Contact email configuration error: %s", exc)
        raise HTTPException(status_code=500, detail="Contact form not configured")

    return {"ok": True}
