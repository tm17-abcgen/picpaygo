"""Generation endpoints (create job, status, listing, image proxy)."""

import re
import uuid
from pathlib import Path
from typing import Any, Dict, Optional
from urllib.parse import unquote

from fastapi import APIRouter, File, Form, HTTPException, Request, Response, UploadFile

import config
from services import storage
from models import GenerationsListResponse, GenerationListItem, JobCreateResponse, JobStatusResponse
from services.auth.functions.session import get_session_user
from services.auth.functions.user import get_user_id_from_email
from services.auth.functions.utils import get_client_ip
from services.credits.functions.credits import get_user_credits, set_user_credits
from services.ratelimit import limiter
from services.credits.functions.ip_credits import get_ip_credits, set_ip_credits
from services.database.connection import get_connection
from services.generate.functions.jobs import (
    create_generation,
    create_generation_asset,
    delete_generation_by_id,
    enqueue_job,
    get_generation,
    get_generation_assets,
    list_generations,
)
from services.generate.functions.prompts import PROMPT_BY_TYPE, build_prompt
from services.generate.functions.image_utils import is_heic, convert_heic_to_jpeg

router = APIRouter(prefix=config.API_PREFIX)


@router.get("/health")
async def health() -> Dict[str, bool]:
    return {"ok": True}


def _build_proxy_url(bucket: str, key: str) -> str:
    return storage.get_proxy_url(bucket, key)


@router.get("/images/{bucket}/{key:path}")
async def get_image(bucket: str, key: str, request: Request, download: bool = False) -> Response:
    key = unquote(key)

    if bucket not in [storage.BUCKET_RAW, storage.BUCKET_GENERATED]:
        raise HTTPException(status_code=400, detail="Invalid bucket")

    parts = key.split("/", 2)
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Invalid key format")

    generation_id = parts[1]

    user = await get_session_user(request)
    guest_session_id = getattr(request.state, "guest_session_id", None)

    user_id = None
    if user:
        async with get_connection() as conn:
            user_id = await get_user_id_from_email(conn, user["email"])

    try:
        generation_uuid = uuid.UUID(generation_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Not found")

    async with get_connection() as conn:
        gen = await get_generation(conn, generation_uuid, user_id, guest_session_id)
        if not gen:
            raise HTTPException(status_code=404, detail="Not found")

    try:
        image_bytes, content_type = await storage.get_object_with_content_type_async(bucket, key)
        headers = {"Cache-Control": "public, max-age=31536000, immutable"}
        if download:
            raw_name = Path(key).name
            safe_name = re.sub(r'["\r\n]', '', raw_name)
            filename = f"picpaygo-{safe_name}"
            headers["Content-Disposition"] = f'attachment; filename="{filename}"'
        return Response(
            content=image_bytes,
            media_type=content_type or "image/jpeg",
            headers=headers,
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Image not found")


@router.post("/generate", response_model=JobCreateResponse)
@limiter.limit("10/minute")
async def generate_image(
    request: Request,
    image: UploadFile = File(...),
    type_: str = Form(..., alias="type"),
) -> JobCreateResponse:
    category = type_.strip().lower()
    if category not in PROMPT_BY_TYPE:
        raise HTTPException(status_code=400, detail="Unsupported type")
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    prompt = build_prompt(category)
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image upload")

    # Convert HEIC to JPEG for compatibility (iPhone photos)
    content_type = image.content_type
    if is_heic(image.content_type, image.filename):
        image_bytes, content_type = convert_heic_to_jpeg(image_bytes)

    user = await get_session_user(request)
    guest_session_id = getattr(request.state, "guest_session_id", None)
    ip = get_client_ip(request)

    # Use single connection with transaction for atomic credit deduction
    async with get_connection() as conn:
        async with conn.transaction():
            user_id = None
            if user:
                user_id = await get_user_id_from_email(conn, user["email"])

            guest_session_id = guest_session_id if not user_id else None

            # Atomically try to claim a free IP credit (decrement-or-insert)
            # This prevents race conditions for new IPs where FOR UPDATE would lock nothing
            ip_result = await conn.fetchrow(
                """
                INSERT INTO ip_credits (ip_address, free_remaining, last_seen_at)
                VALUES ($1, $2 - 1, NOW())
                ON CONFLICT (ip_address) DO UPDATE
                SET free_remaining = ip_credits.free_remaining - 1, last_seen_at = NOW()
                RETURNING free_remaining
                """,
                ip, config.DEFAULT_FREE_CREDITS
            )
            ip_credit_used = ip_result["free_remaining"] >= 0

            # If IP credit claim failed (negative balance), restore and try user credits
            user_credit_used = False
            if not ip_credit_used:
                # Restore the failed decrement
                await conn.execute(
                    "UPDATE ip_credits SET free_remaining = free_remaining + 1 WHERE ip_address = $1",
                    ip
                )

                if user_id:
                    # Lock and check user credits
                    credit_row = await conn.fetchrow(
                        "SELECT balance FROM credits WHERE user_id = $1 FOR UPDATE",
                        user_id
                    )
                    user_credits = credit_row["balance"] if credit_row else 0
                    if user_credits >= 1:
                        await conn.execute(
                            "UPDATE credits SET balance = balance - 1, updated_at = NOW() WHERE user_id = $1",
                            user_id
                        )
                        user_credit_used = True

            if not ip_credit_used and not user_credit_used:
                raise HTTPException(status_code=400, detail="Insufficient credits")

            # Create generation record within transaction
            generation_id = await create_generation(conn, user_id, guest_session_id, category)

    # Storage operations outside transaction (can retry independently)
    input_key = await storage.upload_input_async(
        str(generation_id), image_bytes, content_type
    )

    async with get_connection() as conn:
        await create_generation_asset(
            conn,
            generation_id,
            "input",
            storage.BUCKET_RAW,
            input_key,
            content_type,
            len(image_bytes),
        )

    await enqueue_job(
        {
            "job_id": str(generation_id),
            "prompt": prompt,
            "content_type": content_type,
            "client_ip": ip,
            "credit_source": "user" if user_credit_used else "ip",
            "user_id": str(user_id) if user_credit_used else None,
        }
    )

    return JobCreateResponse(jobId=str(generation_id))


@router.get("/generate/{job_id}", response_model=JobStatusResponse)
async def get_generation_status(job_id: str, request: Request) -> JobStatusResponse:
    try:
        generation_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Invalid job ID")

    user = await get_session_user(request)
    guest_session_id = getattr(request.state, "guest_session_id", None)

    user_id = None
    if user:
        async with get_connection() as conn:
            user_id = await get_user_id_from_email(conn, user["email"])

    async with get_connection() as conn:
        gen = await get_generation(conn, generation_uuid, user_id, guest_session_id)
        if not gen:
            raise HTTPException(status_code=404, detail="Job not found")

        assets = await get_generation_assets(conn, generation_uuid)

        input_url = ""
        output_url = ""

        for asset in assets:
            if asset["kind"] == "input":
                input_url = _build_proxy_url(asset["bucket"], asset["objectKey"])
            elif asset["kind"] == "output":
                output_url = _build_proxy_url(asset["bucket"], asset["objectKey"])

    return JobStatusResponse(
        id=job_id,
        status=gen["status"],
        category=gen["category"],
        createdAt=gen["createdAt"],
        inputUrl=input_url,
        outputUrl=output_url,
        error=gen["error"],
    )


@router.get("/generations", response_model=GenerationsListResponse)
async def list_generations_endpoint(
    request: Request,
    scope: str = "auto",
    limit: int = 20,
    cursor: Optional[str] = None,
) -> GenerationsListResponse:
    if limit > 100:
        limit = 100

    user = await get_session_user(request)
    guest_session_id = getattr(request.state, "guest_session_id", None)

    user_id = None
    if user:
        async with get_connection() as conn:
            user_id = await get_user_id_from_email(conn, user["email"])

    async with get_connection() as conn:
        generations = await list_generations(conn, user_id, guest_session_id, scope, limit, cursor)

        # Build output URLs from JOIN data (no N+1 queries)
        for gen in generations:
            if gen["outputBucket"] and gen["outputKey"]:
                gen["outputUrl"] = _build_proxy_url(gen["outputBucket"], gen["outputKey"])
            # Remove internal fields before returning
            gen.pop("outputBucket", None)
            gen.pop("outputKey", None)

    return GenerationsListResponse(
        generations=[GenerationListItem(**g) for g in generations],
        cursor=generations[-1]["createdAt"] if generations else None,
    )


@router.delete("/generations/{generation_id}")
async def delete_generation(generation_id: str, request: Request) -> Response:
    """Delete a single generation. Must be owned by the current user/guest."""
    try:
        generation_uuid = uuid.UUID(generation_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Invalid generation ID")

    user = await get_session_user(request)
    guest_session_id = getattr(request.state, "guest_session_id", None)

    user_id = None
    if user:
        async with get_connection() as conn:
            user_id = await get_user_id_from_email(conn, user["email"])

    async with get_connection() as conn:
        deleted = await delete_generation_by_id(conn, generation_uuid, user_id, guest_session_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Generation not found")

    return Response(status_code=204)
