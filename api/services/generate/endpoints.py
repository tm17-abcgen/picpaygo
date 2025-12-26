"""Generation endpoints (create job, status, listing, image proxy)."""

from __future__ import annotations

import uuid
from typing import Any, Dict, Optional
from urllib.parse import unquote, urljoin

from fastapi import APIRouter, File, Form, HTTPException, Request, Response, UploadFile

import config
from services import storage
from models import GenerationsListResponse, GenerationListItem, JobCreateResponse, JobStatusResponse
from services.auth.functions.session import get_session_user
from services.auth.functions.user import get_user_id_from_email
from services.auth.functions.utils import get_client_ip
from services.credits.functions.credits import get_user_credits, set_user_credits
from services.credits.functions.ip_credits import get_ip_credits, set_ip_credits
from services.database.connection import get_connection
from services.generate.functions.jobs import (
    create_generation,
    create_generation_asset,
    enqueue_job,
    get_generation,
    get_generation_assets,
    list_generations,
)
from services.generate.functions.prompts import PROMPT_BY_TYPE, build_prompt

router = APIRouter(prefix=config.API_PREFIX)


@router.get("/health")
async def health() -> Dict[str, bool]:
    return {"ok": True}


def _build_proxy_url(request: Request, bucket: str, key: str) -> str:
    return urljoin(str(request.base_url), storage.get_proxy_url(bucket, key))


@router.get("/images/{bucket}/{key:path}")
async def get_image(bucket: str, key: str, request: Request) -> Response:
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
        image_bytes, content_type = storage.get_object_with_content_type(bucket, key)
        return Response(content=image_bytes, media_type=content_type or "image/jpeg")
    except Exception:
        raise HTTPException(status_code=404, detail="Image not found")


@router.post("/generate", response_model=JobCreateResponse)
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

    user = await get_session_user(request)
    guest_session_id = getattr(request.state, "guest_session_id", None)

    user_id = None
    if user:
        async with get_connection() as conn:
            user_id = await get_user_id_from_email(conn, user["email"])

    guest_session_id = guest_session_id if not user_id else None

    ip = get_client_ip(request)
    free_credits = await get_ip_credits(ip)
    user_credits = await get_user_credits(user["email"]) if user else 0

    total = free_credits + user_credits
    if total < 1:
        raise HTTPException(status_code=400, detail="Insufficient credits")

    if free_credits > 0:
        free_credits -= 1
        await set_ip_credits(ip, free_credits)
    elif user:
        user_credits -= 1
        await set_user_credits(user["email"], user_credits)
    else:
        raise HTTPException(status_code=400, detail="Login required for paid credits")

    async with get_connection() as conn:
        generation_id = await create_generation(conn, user_id, guest_session_id, category)

        input_key = storage.upload_input(str(generation_id), image_bytes, image.content_type)
        await create_generation_asset(
            conn,
            generation_id,
            "input",
            storage.BUCKET_RAW,
            input_key,
            image.content_type,
            len(image_bytes),
        )

    await enqueue_job(
        {
            "job_id": str(generation_id),
            "prompt": prompt,
            "content_type": image.content_type,
            "client_ip": ip,
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
                input_url = _build_proxy_url(request, asset["bucket"], asset["objectKey"])
            elif asset["kind"] == "output":
                output_url = _build_proxy_url(request, asset["bucket"], asset["objectKey"])

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

        for gen in generations:
            if gen["status"] == "completed":
                assets = await get_generation_assets(conn, uuid.UUID(gen["id"]))
                for asset in assets:
                    if asset["kind"] == "output":
                        gen["outputUrl"] = _build_proxy_url(request, asset["bucket"], asset["objectKey"])

    return GenerationsListResponse(
        generations=[GenerationListItem(**g) for g in generations],
        cursor=generations[-1]["createdAt"] if generations else None,
    )
