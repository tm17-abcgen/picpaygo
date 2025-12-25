from __future__ import annotations

import asyncio
import base64
import hashlib
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import httpx
from fastapi import FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

OPENROUTER_API_URL = os.getenv("OPENROUTER_API_URL", "https://openrouter.ai/api/v1/chat/completions")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-3-pro-image-preview")
JOB_WORKERS = max(int(os.getenv("JOB_WORKERS", "2")), 1)
JOB_TIMEOUT_SECONDS = int(os.getenv("JOB_TIMEOUT_SECONDS", "120"))

SESSION_COOKIE = "session"
SESSION_TTL_HOURS = int(os.getenv("SESSION_TTL_HOURS", "168"))
DEFAULT_FREE_CREDITS = int(os.getenv("FREE_CREDITS", "3"))

PROMPT_BY_TYPE: Dict[str, str] = {
    "portraits": (
        "Use the uploaded photo as the reference. Generate a clean, professional portrait with soft "
        "studio lighting, natural skin texture, and a neutral background. Keep the subject's identity "
        "and facial features consistent."
    ),
    "editorial": (
        "Use the uploaded photo as the reference. Generate a high-end editorial portrait with fashion "
        "lighting, subtle styling, and a magazine-ready finish. Keep the subject's identity consistent."
    ),
    "documentary": (
        "Use the uploaded photo as the reference. Generate a candid, documentary-style portrait with "
        "natural light, authentic texture, and minimal retouching. Keep the subject's identity consistent."
    ),
}

app = FastAPI()

cors_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:8082").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in cors_origins if origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

http_client: Optional[httpx.AsyncClient] = None
job_queue: asyncio.Queue[Dict[str, Any]] = asyncio.Queue()
job_tasks: list[asyncio.Task] = []

jobs: Dict[str, Dict[str, Any]] = {}
jobs_lock = asyncio.Lock()

users: Dict[str, Dict[str, Any]] = {}
sessions: Dict[str, Dict[str, Any]] = {}
ip_credits: Dict[str, Dict[str, Any]] = {}
user_lock = asyncio.Lock()


class JobCreateResponse(BaseModel):
    jobId: str


class JobStatusResponse(BaseModel):
    id: str
    status: str
    category: str
    createdAt: str
    inputUrl: str
    outputUrl: str
    error: Optional[str] = None


class CreditsResponse(BaseModel):
    balance: int
    freeCredits: int
    userCredits: int
    isLoggedIn: bool


class AuthResponse(BaseModel):
    user: Optional[Dict[str, str]]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _hash_password(password: str, salt: bytes) -> str:
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return hashed.hex()


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


async def _get_session_user(request: Request) -> Optional[Dict[str, str]]:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None
    async with user_lock:
        session = sessions.get(token)
        if not session:
            return None
        if session["expires_at"] < _now():
            sessions.pop(token, None)
            return None
        return {"email": session["email"]}


async def _get_ip_credits(ip: str) -> int:
    async with user_lock:
        record = ip_credits.get(ip)
        if record is None:
            ip_credits[ip] = {
                "free_remaining": DEFAULT_FREE_CREDITS,
                "last_seen_at": _now(),
            }
            return DEFAULT_FREE_CREDITS
        record["last_seen_at"] = _now()
        return int(record.get("free_remaining", DEFAULT_FREE_CREDITS))


async def _set_ip_credits(ip: str, remaining: int) -> None:
    async with user_lock:
        record = ip_credits.setdefault(
            ip,
            {"free_remaining": DEFAULT_FREE_CREDITS, "last_seen_at": _now()},
        )
        record["free_remaining"] = max(remaining, 0)
        record["last_seen_at"] = _now()


async def _get_user_credits(email: str) -> int:
    async with user_lock:
        user = users.get(email)
        return int(user.get("credits", 0)) if user else 0


async def _set_user_credits(email: str, credits: int) -> None:
    async with user_lock:
        user = users.get(email)
        if user:
            user["credits"] = max(credits, 0)


async def _create_job(category: str) -> str:
    job_id = uuid.uuid4().hex
    async with jobs_lock:
        jobs[job_id] = {
            "id": job_id,
            "status": "queued",
            "category": category,
            "createdAt": _now().isoformat(),
            "inputUrl": "",
            "outputUrl": "",
            "error": None,
        }
    return job_id


async def _update_job(job_id: str, **fields: Any) -> None:
    async with jobs_lock:
        job = jobs.get(job_id)
        if job:
            job.update(fields)


async def _get_job(job_id: str) -> Dict[str, Any]:
    async with jobs_lock:
        job = jobs.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job.copy()


def _build_prompt(category: str) -> str:
    prompt = PROMPT_BY_TYPE.get(category)
    if not prompt:
        raise HTTPException(status_code=400, detail="Unsupported type")
    return prompt


async def _send_openrouter_request(prompt: str, image_bytes: bytes, content_type: str) -> str:
    if not OPENROUTER_API_KEY:
        encoded = base64.b64encode(image_bytes).decode("ascii")
        # Fallback for local dev without an API key.
        return f"data:{content_type};base64,{encoded}"

    encoded = base64.b64encode(image_bytes).decode("ascii")
    data_url = f"data:{content_type};base64,{encoded}"

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
        "modalities": ["image", "text"],
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    assert http_client is not None
    response = await http_client.post(
        OPENROUTER_API_URL,
        headers=headers,
        json=payload,
        timeout=JOB_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    result = response.json()

    def _coerce_image_url(value: Any) -> Optional[str]:
        if isinstance(value, str) and value:
            return value
        if isinstance(value, dict):
            for key in ("url", "data", "image_url"):
                candidate = value.get(key)
                if isinstance(candidate, str) and candidate:
                    return candidate
        return None

    image_url: Optional[str] = None
    message = None
    try:
        message = result["choices"][0]["message"]
    except (KeyError, IndexError, TypeError):
        message = None

    if isinstance(message, dict):
        images = message.get("images")
        if isinstance(images, list) and images:
            image_url = _coerce_image_url(images[0].get("image_url") if isinstance(images[0], dict) else images[0])

        if not image_url:
            content = message.get("content")
            if isinstance(content, list):
                for item in content:
                    if not isinstance(item, dict):
                        continue
                    image_url = _coerce_image_url(item.get("image_url") or item.get("image"))
                    if image_url:
                        break

    if not image_url:
        data = result.get("data")
        if isinstance(data, list) and data:
            if isinstance(data[0], dict):
                image_url = _coerce_image_url(data[0].get("url"))
                if not image_url:
                    b64 = data[0].get("b64_json")
                    if isinstance(b64, str) and b64:
                        image_url = f"data:image/png;base64,{b64}"

    if not image_url:
        raise RuntimeError("No image returned from OpenRouter")

    return image_url


async def _worker_loop() -> None:
    while True:
        payload = await job_queue.get()
        job_id = payload["job_id"]
        try:
            await _update_job(job_id, status="processing")
            output_url = await _send_openrouter_request(
                payload["prompt"],
                payload["image_bytes"],
                payload["content_type"],
            )
            await _update_job(job_id, status="completed", outputUrl=output_url)
        except Exception as exc:
            await _update_job(job_id, status="failed", error=str(exc))
        finally:
            job_queue.task_done()


@app.on_event("startup")
async def _startup() -> None:
    global http_client
    http_client = httpx.AsyncClient()
    for _ in range(JOB_WORKERS):
        job_tasks.append(asyncio.create_task(_worker_loop()))


@app.on_event("shutdown")
async def _shutdown() -> None:
    for task in job_tasks:
        task.cancel()
    if http_client:
        await http_client.aclose()


@app.get("/api/health")
async def health() -> Dict[str, bool]:
    return {"ok": True}


@app.post("/api/generate", response_model=JobCreateResponse)
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

    prompt = _build_prompt(category)
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image upload")

    job_id = await _create_job(category)
    await job_queue.put(
        {
            "job_id": job_id,
            "prompt": prompt,
            "image_bytes": image_bytes,
            "content_type": image.content_type,
            "client_ip": _get_client_ip(request),
        }
    )

    return JobCreateResponse(jobId=job_id)


@app.get("/api/generate/{job_id}", response_model=JobStatusResponse)
async def get_generation_status(job_id: str) -> JobStatusResponse:
    job = await _get_job(job_id)
    return JobStatusResponse(**job)


@app.post("/api/auth/register", response_model=AuthResponse)
async def register(request: Request, response: Response) -> AuthResponse:
    payload = await request.json()
    email = (payload.get("email") or "").lower().strip()
    password = payload.get("password") or ""
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    async with user_lock:
        if email in users:
            raise HTTPException(status_code=409, detail="Email already registered")
        salt = secrets.token_bytes(16)
        users[email] = {
            "salt": base64.b64encode(salt).decode("ascii"),
            "password_hash": _hash_password(password, salt),
            "credits": 0,
            "created_at": _now().isoformat(),
        }

    token = secrets.token_hex(32)
    expires_at = _now() + timedelta(hours=SESSION_TTL_HOURS)
    async with user_lock:
        sessions[token] = {"email": email, "expires_at": expires_at}

    response.set_cookie(
        SESSION_COOKIE,
        token,
        httponly=True,
        samesite="lax",
        secure=False,
        expires=expires_at,
    )
    return AuthResponse(user={"email": email})


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(request: Request, response: Response) -> AuthResponse:
    payload = await request.json()
    email = (payload.get("email") or "").lower().strip()
    password = payload.get("password") or ""
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    async with user_lock:
        user = users.get(email)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        salt = base64.b64decode(user["salt"])
        if _hash_password(password, salt) != user["password_hash"]:
            raise HTTPException(status_code=401, detail="Invalid credentials")

    token = secrets.token_hex(32)
    expires_at = _now() + timedelta(hours=SESSION_TTL_HOURS)
    async with user_lock:
        sessions[token] = {"email": email, "expires_at": expires_at}

    response.set_cookie(
        SESSION_COOKIE,
        token,
        httponly=True,
        samesite="lax",
        secure=False,
        expires=expires_at,
    )
    return AuthResponse(user={"email": email})


@app.post("/api/auth/logout")
async def logout(request: Request, response: Response) -> Dict[str, bool]:
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        async with user_lock:
            sessions.pop(token, None)
    response.delete_cookie(SESSION_COOKIE)
    return {"ok": True}


@app.get("/api/auth/me", response_model=AuthResponse)
async def me(request: Request) -> AuthResponse:
    user = await _get_session_user(request)
    return AuthResponse(user=user)


@app.get("/api/credits", response_model=CreditsResponse)
async def credits(request: Request) -> CreditsResponse:
    user = await _get_session_user(request)
    ip = _get_client_ip(request)
    free_credits = await _get_ip_credits(ip)
    user_credits = await _get_user_credits(user["email"]) if user else 0
    return CreditsResponse(
        balance=free_credits + user_credits,
        freeCredits=free_credits,
        userCredits=user_credits,
        isLoggedIn=bool(user),
    )


@app.post("/api/credits/consume", response_model=CreditsResponse)
async def consume_credits(request: Request) -> CreditsResponse:
    payload = await request.json()
    amount = max(int(payload.get("amount", 1)), 1)
    user = await _get_session_user(request)
    ip = _get_client_ip(request)
    free_credits = await _get_ip_credits(ip)
    user_credits = await _get_user_credits(user["email"]) if user else 0

    total = free_credits + user_credits
    if total < amount:
        raise HTTPException(status_code=400, detail="Insufficient credits")

    remaining = amount
    if free_credits > 0:
        consume = min(free_credits, remaining)
        free_credits -= consume
        remaining -= consume
        await _set_ip_credits(ip, free_credits)

    if remaining > 0:
        if not user:
            raise HTTPException(status_code=400, detail="Login required for paid credits")
        user_credits = max(user_credits - remaining, 0)
        await _set_user_credits(user["email"], user_credits)

    return CreditsResponse(
        balance=free_credits + user_credits,
        freeCredits=free_credits,
        userCredits=user_credits,
        isLoggedIn=bool(user),
    )


@app.post("/api/credits/checkout")
async def checkout(request: Request) -> Dict[str, Any]:
    payload = await request.json()
    pack_size = int(payload.get("packSize", 0))
    if pack_size not in {5, 10, 20}:
        raise HTTPException(status_code=400, detail="Invalid pack size")
    user = await _get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")

    current = await _get_user_credits(user["email"])
    await _set_user_credits(user["email"], current + pack_size)
    return {"ok": True, "added": pack_size}
