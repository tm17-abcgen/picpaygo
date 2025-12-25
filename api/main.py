"""
PicPayGo API - FastAPI application with guest history support.
"""

from __future__ import annotations

import asyncio
import base64
import hashlib
import json
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urljoin
from typing import Any, Dict, List, Optional

import httpx
from fastapi import FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from uuid import UUID

import database
import storage
from middleware import GuestSessionMiddleware, hash_token, generate_guest_token

# =============================================================================
# Configuration
# =============================================================================

OPENROUTER_API_URL = os.getenv("OPENROUTER_API_URL", "https://openrouter.ai/api/v1/chat/completions")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-3-pro-image-preview")
JOB_WORKERS = max(int(os.getenv("JOB_WORKERS", "2")), 1)
JOB_TIMEOUT_SECONDS = int(os.getenv("JOB_TIMEOUT_SECONDS", "120"))

SESSION_COOKIE = "session"
SESSION_TTL_HOURS = int(os.getenv("SESSION_TTL_HOURS", "168"))
DEFAULT_FREE_CREDITS = int(os.getenv("FREE_CREDITS", "3"))

PROMPT_BY_TYPE: Dict[str, str] = {
    "studio-portrait": (
        "Use the uploaded photo as the reference. Create a studio portrait photograph with 100% preservation of the subject's "
        "natural facial features, body type, age, and ethnicity. Do not idealize, stylize, or alter appearance—render the person "
        "exactly as they are in real life.\n\n"
        "Subject Characteristics: [SPECIFY: exact age, ethnicity, body type (slim/athletic/average/curvy/plus-size), "
        "hair texture and color, distinctive features to preserve]. The subject's natural features are the focus, "
        "not a transformation. Include age-appropriate details: fine lines, texture variations, natural asymmetries "
        "of the face.\n\n"
        "Lighting & Camera: Shot on a Canon EOS R5 with a 110mm f/2 portrait lens. Studio setup with soft, "
        "directional Rembrandt-style lighting (key light 45 degrees left, creating definition without flattery). "
        "The lighting reveals texture: skin shows natural pores and texture, hair shows its actual condition, "
        "facial features are rendered with anatomical accuracy. Aperture f/2.5 for selective focus on eyes.\n\n"
        "Expression & Pose: Natural, contemplative expression—not smiling, not performing. The person appears "
        "present and calm, looking directly at camera. Body language is relaxed and authentic. No artificial "
        "tension or posed elegance.\n\n"
        "Appearance Treatment: Natural skin texture with visible pores and subtle variations in tone. No airbrushing, "
        "no smoothing, no skin perfection. If there are wrinkles, age spots, or freckles, they are rendered with "
        "photographic accuracy as natural features. Hair shows its natural state: texture, flyaway strands, the "
        "way it actually sits.\n\n"
        "Background: Neutral gray-white, completely plain. The background provides no distraction—the focus is "
        "entirely on authentic human presence.\n\n"
        "Post-Processing: Minimal, clean digital rendering. Color graded to match natural daylight film stock "
        "(Kodak Portra 400 aesthetic). Natural shadows contain color and transparency, not pure black. "
        "No excessive contrast, no filters, no digital artifact.\n\n"
        "Quality: 8K photorealistic, archive-quality portrait photography. The image should feel like a "
        "professional photograph from a skilled portrait photographer who values human authenticity over idealization.\n\n"
        "Aspect Ratio: 1:1 (square).\n\n"
        "Exclusions: No \"beautification,\" no \"filter,\" no \"smooth skin,\" no \"perfect,\" no \"flawless,\" "
        "no \"airbrushed,\" no \"model-like,\" no artificial enhancement of any kind."
    ),
    "fashion-editorial": (
        "Use the uploaded photo as the reference. Create a fashion editorial photograph that showcases authentic human presence "
        "in stylish clothing. The subject's natural appearance—age, body type, ethnicity, gender expression—is the foundation. "
        "Do not transform, idealize, or beautify the person.\n\n"
        "Subject: [SPECIFY: age (exact number), ethnicity, body type (slim/athletic/average/curvy/plus-size), "
        "gender identity, hair type and natural color, skin tone, any distinctive features]. This person appears "
        "as they naturally are. Render their authentic features with photographic honesty.\n\n"
        "Styling: Fashion-forward outfit that suits the person's natural build and style—not aspirational or "
        "transformative. Include [SPECIFY: garment type, color, material]. The clothing fits naturally and shows "
        "the wearer's true silhouette. Styling honors the person's authentic aesthetic, not a \"makeover.\"\n\n"
        "Hair & Makeup: Natural, minimal makeup that enhances without transforming. Makeup sits on natural skin, "
        "showing texture beneath. Hair is styled with intention but rendered as it naturally grows: if curly, "
        "show curl pattern; if fine, show fineness; if thick, show texture. Makeup appears like someone who "
        "prepared for a photo, not someone transformed by professionals.\n\n"
        "Lighting & Camera: Shot on a Sony α7R IV with an 85mm f/1.4 lens at aperture f/2.0. Natural or "
        "soft-window lighting that reveals true skin tone without flattery. If outdoors, use golden hour or "
        "overcast light that shows detail in both highlights and shadows. The lighting should feel like available "
        "light enhanced subtly, not studio-controlled.\n\n"
        "Pose & Expression: Natural pose with authentic body language. The subject is engaged but not performing. "
        "Expression is genuine—not smiling unless natural to the moment, but present and real. Include subtle "
        "movement cues if posed (turned slightly, weight shifted), not rigidly symmetrical.\n\n"
        "Appearance Treatment: Unretouched photographic appearance. Skin shows natural texture, pores, variations "
        "in tone. If there are age lines, they are rendered truthfully. Body shows its natural form—no sucking in, "
        "no artificial posturing. The person's actual proportions and shape are clearly visible and authentic.\n\n"
        "Background: Appropriate environment that gives context: interior space, outdoor location, or studio "
        "background that suits the editorial aesthetic. The background should complement, not distract.\n\n"
        "Color & Tone: Rendered as if shot on Fujifilm Portra 400—warm, generous color palette. Skin tones are "
        "accurate to the person's actual complexion. Colors feel true to life, not oversaturated. Slight warmth "
        "in shadows, natural color balance throughout.\n\n"
        "Mood: The image celebrates the person as they are—confident, authentic, present. The overall feeling is "
        "\"editorial feature celebrating this individual\" not \"transformation or glamorization.\"\n\n"
        "Quality: Editorial magazine-quality photography, high resolution, suitable for professional publication. "
        "The image should feel authentic and documentary, not overly polished.\n\n"
        "Aspect Ratio: 2:3 (portrait-oriented).\n\n"
        "Exclusions: No \"makeover,\" no \"glamorous,\" no \"perfect features,\" no \"smooth skin,\" no \"flawless,\" "
        "no \"airbrushed,\" no enhancement of physical appearance beyond authentic styling."
    ),
    "editorial-moment": (
        "Use the uploaded photo as the reference. Create a photorealistic editorial photograph capturing an authentic human moment. "
        "The subject appears exactly as they are—no beautification, no idealization, no transformation. "
        "This is documentary-style portraiture that celebrates real human presence.\n\n"
        "Subject: [SPECIFY: age, ethnicity, body type (average/athletic/curvy/slim/plus-size), "
        "gender expression, hair texture and color, natural skin tone, visible characteristics]. "
        "The subject's actual appearance is central to the image. Do not alter, enhance, or perfect "
        "the person's natural features.\n\n"
        "Setting & Context: A natural environment or interior space that gives the image narrative context. "
        "This is not a blank studio—the background tells part of the story. [SPECIFY: location, time of day, "
        "activity]. The setting feels like real life, not a constructed backdrop.\n\n"
        "Clothing & Appearance: The person wears realistic, everyday clothing (or specified garments) that fits "
        "their natural body and personal style. Styling appears authentic to how they actually dress, not aspirational.\n\n"
        "Lighting: Available light or soft natural light that shows texture and authenticity. Golden hour, "
        "diffused daylight, or soft interior light. The lighting reveals true skin tone and texture, not "
        "beautified. Shadows contain color; highlights show detail. This is how light actually behaves in "
        "the world, not studio-controlled perfection.\n\n"
        "Expression & Moment: Candid expression captured in an authentic moment. The subject appears unaware "
        "of the camera or naturally engaged. Expression shows genuine emotion: thoughtful, peaceful, engaged, "
        "amused—whatever is real in the moment. No posed smile, no artificial performance.\n\n"
        "Pose & Body Language: Natural body language reflecting authentic human behavior. The person is standing, "
        "sitting, moving, or engaged in an actual activity. Posture shows how the body naturally holds itself, "
        "including any asymmetries or natural postural habits. This is how the person actually exists in their body.\n\n"
        "Appearance Treatment: Unretouched, photojournalistic rendering. Skin shows natural texture, pores, "
        "variations in tone. Age is visible as texture and character, not hidden. Hair shows its natural state: "
        "texture, volume, the way it actually sits. The body shows its true shape and form—no sucking in, no "
        "posturing, no disguising. Wrinkles, freckles, marks, asymmetries are rendered as natural human features.\n\n"
        "Camera & Technical: Shot on a professional mirrorless camera (Canon EOS R5, Nikon Z9, or Sony α9) "
        "with a 50mm f/1.4 lens at aperture f/2.0. This creates a natural field of view that feels human-scaled, "
        "with gentle background separation. The framing is intuitive rather than rigid—subject might be off-center, "
        "showing their relationship to their environment.\n\n"
        "Film Aesthetic: Rendered as if shot on Kodak Portra 400—warm, generous tonality. Colors are true to life, "
        "not manipulated. Slight warmth in shadows and coolness in highlights, suggesting real film rendering. "
        "No excessive saturation, no digital look.\n\n"
        "Mood & Narrative: The image has quiet dignity and authenticity. It celebrates the person as they actually are, "
        "in their actual life. There is no \"story of transformation\" or \"glamour\"—just the beauty of genuine human presence.\n\n"
        "Quality: High-resolution, photorealistic, suitable for editorial publication. The image should feel like "
        "it came from a documentary or lifestyle photographer known for capturing authentic human moments.\n\n"
        "Aspect Ratio: 9:16 (vertical, editorial/digital format).\n\n"
        "Exclusions: No styling transformation, no makeup enhancement, no skin smoothing, no beautification, "
        "no filters, no \"perfect,\" \"flawless,\" or \"ideal\" language. This is unretouched documentary-style portraiture."
    ),
    "portrait-honest": (
        "Use the uploaded photo as the reference. Create a portrait photograph that documents human presence with clinical honesty. "
        "The subject appears exactly as they are—age, body type, ethnicity, distinctive features "
        "all preserved with photographic accuracy. This is portraiture that values truth over flattery.\n\n"
        "Subject Demographics: [SPECIFY: age (exact number), ethnicity, body type (slim/average/athletic/curvy/plus-size), "
        "gender, hair texture/color, skin tone, notable features]. Render the person with complete authenticity. "
        "Do not beautify, smooth, or perfect any aspect of their appearance.\n\n"
        "Lighting & Mood: Clinical studio lighting—bright, even, revealing. Key light positioned to illuminate "
        "the face fully, creating definition without shadow manipulation. The goal is clear visibility and accuracy, "
        "not artistic flattery. Hard light or diffused light, but always revealing texture and truth.\n\n"
        "Camera & Technical: Shot on a Hasselblad X1D-50c (or equivalent medium-format quality) with a 110mm f/2 lens. "
        "Aperture f/2.8 to keep face sharp. ISO set for fine grain and tonal precision. The image is exceptionally "
        "detailed: skin texture, individual hairs, subtle color variations are all visible.\n\n"
        "Subject Treatment: The person appears in simple, minimal clothing (white shirt, neutral tones, or no shirt "
        "if appropriate to context). The focus is entirely on the human form and face, not styling. Hair is shown "
        "in its natural state—color, texture, volume, the way it naturally sits. No styling enhancement.\n\n"
        "Appearance & Texture: Uncompromising texture rendering. Skin shows: pores, fine lines, freckles, skin texture "
        "variations, natural color, any marks or features. This is not idealized skin—this is real human skin rendered "
        "with honesty. Hair shows its actual texture: if curly, show the curl pattern; if thin, show the fineness; "
        "if coarse, show the texture.\n\n"
        "Age Representation: If the person is older, age is visible and rendered with respect. Wrinkles are documented "
        "as character. Age spots, gray hair, lines are rendered authentically. If the person is young, youthful features "
        "are shown truthfully, including any imperfections. Age is never hidden; it is documented with photographic precision.\n\n"
        "Expression & Presence: Neutral to contemplative expression. The person faces the camera directly. Expression is "
        "calm and present, not smiling or performing. Eyes are engaged and aware. The overall impression is one of honest "
        "human presence.\n\n"
        "Body & Form: If full-body or half-body, the person's natural body is visible. Body type is shown truthfully: "
        "proportions, size, shape are documented as they are. No posturing, no hidden angles, no artificial shaping. "
        "This is the person's actual form.\n\n"
        "Background: Completely plain—white or neutral gray. The background is utterly simple, providing zero context "
        "or distraction. The image is entirely about the human being.\n\n"
        "Color & Tone: Rendered as if shot on technical film known for accuracy: Kodak Portra 400 or black-and-white "
        "Tri-X (or equivalent digital rendering). Colors (if color) are true to life—skin tone is accurate, no artificial "
        "warming or cooling. If black-and-white, tonal range is full and detailed.\n\n"
        "Post-Processing: Minimal, clinical rendering. No filters, no smoothing, no enhancement. The image is clean and "
        "clear, but utterly unretouched. What is rendered is what is actual. Shadows contain detail. Highlights show true "
        "exposure. There is no manipulation in service of \"beauty.\"\n\n"
        "Quality: Museum-quality photographic print. 8K resolution. The image should feel like a portrait that could be "
        "displayed in a photography museum or fine-art collection, valued for its honesty and clarity rather than flattery.\n\n"
        "Mood: The image is respectful and dignified. It documents a human being with clinical precision and quiet respect. "
        "There is beauty in authenticity and truth.\n\n"
        "Aspect Ratio: 1:1 (square).\n\n"
        "Exclusions: ABSOLUTELY NO: \"beautiful,\" \"perfect,\" \"flawless,\" \"smooth,\" \"idealized,\" \"glamorous,\" \"filtered,\" "
        "\"enhanced,\" \"beautification,\" or any language suggesting improvement or idealization. This is documentary "
        "truth, not flattery."
    ),
}

# =============================================================================
# FastAPI App
# =============================================================================

app = FastAPI(title="PicPayGo API")

# CORS middleware
cors_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:8082,https://picpaygo.com,https://www.picpaygo.com").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in cors_origins if origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Guest session middleware (must be added after CORS)
app.add_middleware(GuestSessionMiddleware)

# =============================================================================
# Global State
# =============================================================================

http_client: Optional[httpx.AsyncClient] = None
job_queue: asyncio.Queue[Dict[str, Any]] = asyncio.Queue()
job_tasks: list[asyncio.Task] = []

# In-memory state (still used for sessions)
jobs: Dict[str, Dict[str, Any]] = {}
jobs_lock = asyncio.Lock()

users: Dict[str, Dict[str, Any]] = {}
sessions: Dict[str, Dict[str, Any]] = {}
user_lock = asyncio.Lock()

# =============================================================================
# Pydantic Models
# =============================================================================

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


class GenerationListItem(BaseModel):
    id: str
    category: str
    status: str
    createdAt: str
    completedAt: Optional[str] = None
    error: Optional[str] = None
    outputUrl: Optional[str] = None  # Presigned URL for completed generations


class GenerationsListResponse(BaseModel):
    generations: List[GenerationListItem]
    cursor: Optional[str] = None


class ClearHistoryResponse(BaseModel):
    cleared: bool

# =============================================================================
# Helpers
# =============================================================================

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
    """Get authenticated user from session cookie."""
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None
    token_hash = hash_token(token)

    async with database.get_connection() as conn:
        row = await conn.fetchrow(
            """
            SELECT u.email, s.expires_at
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token_hash = $1 AND s.expires_at > NOW()
            """,
            token_hash
        )
        if not row:
            return None
        return {"email": row["email"]}


async def _get_user_id_from_email(conn, email: str) -> Optional[UUID]:
    """Get user ID from email."""
    user_id = await conn.fetchval("SELECT id FROM users WHERE email = $1", email.lower())
    return user_id


async def _get_ip_credits(ip: str) -> int:
    async with database.get_connection() as conn:
        row = await conn.fetchrow(
            "SELECT free_remaining FROM ip_credits WHERE ip_address = $1",
            ip
        )
        if row:
            # Update last_seen_at
            await conn.execute(
                "UPDATE ip_credits SET last_seen_at = NOW() WHERE ip_address = $1",
                ip
            )
            return int(row["free_remaining"])

        # Create new record with default credits
        await conn.execute(
            """
            INSERT INTO ip_credits (ip_address, free_remaining, last_seen_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (ip_address) DO UPDATE SET last_seen_at = NOW()
            """,
            ip, DEFAULT_FREE_CREDITS
        )
        return DEFAULT_FREE_CREDITS


async def _set_ip_credits(ip: str, remaining: int) -> None:
    async with database.get_connection() as conn:
        await conn.execute(
            """
            INSERT INTO ip_credits (ip_address, free_remaining, last_seen_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (ip_address) DO UPDATE
            SET free_remaining = $2, last_seen_at = NOW()
            """,
            ip, max(remaining, 0)
        )


async def _get_user_credits(email: str) -> int:
    async with database.get_connection() as conn:
        user_id = await conn.fetchval(
            "SELECT id FROM users WHERE email = $1",
            email.lower()
        )
        if not user_id:
            return 0
        balance = await conn.fetchval(
            "SELECT balance FROM credits WHERE user_id = $1",
            user_id
        )
        return int(balance) if balance else 0


async def _set_user_credits(email: str, credits: int) -> None:
    async with database.get_connection() as conn:
        user_id = await conn.fetchval(
            "SELECT id FROM users WHERE email = $1",
            email.lower()
        )
        if user_id:
            await conn.execute(
                "UPDATE credits SET balance = $1, updated_at = NOW() WHERE user_id = $2",
                max(credits, 0), user_id
            )
    # Also update in-memory for compatibility
    async with user_lock:
        user = users.get(email)
        if user:
            user["credits"] = max(credits, 0)


def _build_prompt(category: str) -> str:
    prompt = PROMPT_BY_TYPE.get(category)
    if not prompt:
        raise HTTPException(status_code=400, detail="Unsupported type")
    return prompt


def _build_proxy_url(request: Request, bucket: str, key: str) -> str:
    """Build an absolute URL to the image proxy endpoint."""
    return urljoin(str(request.base_url), storage.get_proxy_url(bucket, key))


# =============================================================================
# OpenRouter / Image Generation
# =============================================================================

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


async def _download_image_from_url(image_url: str) -> bytes:
    """Download image bytes from a URL (for OpenRouter responses)."""
    assert http_client is not None
    response = await http_client.get(image_url, timeout=30)
    response.raise_for_status()
    return response.content


async def _worker_loop() -> None:
    """Worker that processes image generation jobs."""
    while True:
        payload = await job_queue.get()
        job_id = payload["job_id"]

        async with database.get_connection() as conn:
            try:
                # Update status to processing
                await database.update_generation_status(conn, uuid.UUID(job_id), "processing")

                # Get input from MinIO (direct internal access, not presigned URL)
                input_info = await database.get_asset_url_info(conn, uuid.UUID(job_id), "input")
                if not input_info:
                    raise RuntimeError("Input asset not found")

                input_bytes = storage.get_object_bytes(input_info["bucket"], input_info["objectKey"])

                # Call OpenRouter
                output_url = await _send_openrouter_request(
                    payload["prompt"],
                    input_bytes,
                    input_info["contentType"] or "image/jpeg",
                )

                # Handle output - if it's a data URL, extract the bytes
                if output_url.startswith("data:"):
                    # Parse data URL
                    header, data = output_url.split(",", 1)
                    output_bytes = base64.b64decode(data)
                    # Upload to MinIO
                    output_key = storage.upload_output(job_id, output_bytes, "image/png")
                    await database.create_generation_asset(
                        conn,
                        uuid.UUID(job_id),
                        "output",
                        storage.BUCKET_GENERATED,
                        output_key,
                        "image/png",
                        len(output_bytes),
                    )
                else:
                    # It's an external URL - download and upload to MinIO
                    output_bytes = await _download_image_from_url(output_url)
                    output_key = storage.upload_output(job_id, output_bytes, "image/png")
                    await database.create_generation_asset(
                        conn,
                        uuid.UUID(job_id),
                        "output",
                        storage.BUCKET_GENERATED,
                        output_key,
                        "image/png",
                        len(output_bytes),
                    )

                # Update status to completed
                await database.update_generation_status(conn, uuid.UUID(job_id), "completed")

            except Exception as exc:
                print(f"Worker error for job {job_id}: {exc}")
                import traceback
                traceback.print_exc()
                await database.update_generation_status(
                    conn, uuid.UUID(job_id), "failed", error_message=str(exc)
                )
            finally:
                job_queue.task_done()


# =============================================================================
# Lifecycle Events
# =============================================================================


def _split_sql_statements(sql: str) -> List[str]:
    """Split SQL into statements, handling PL/pgSQL blocks."""
    statements = []
    current = []
    in_plpgsql = False
    plpgsql_depth = 0

    for line in sql.split('\n'):
        stripped = line.strip()
        if stripped.startswith('DO $$'):
            in_plpgsql = True
            plpgsql_depth = 1
            current.append(line)
        elif in_plpgsql:
            current.append(line)
            if '$$' in line:
                plpgsql_depth += line.count('$$')
                if plpgsql_depth % 2 == 0:
                    in_plpgsql = False
                    statements.append('\n'.join(current))
                    current = []
        elif stripped.endswith(';'):
            current.append(line)
            statements.append('\n'.join(current))
            current = []
        elif stripped and not stripped.startswith('--'):
            current.append(line)

    if current:
        statements.append('\n'.join(current))

    return [s for s in statements if s.strip()]


async def _init_schema() -> None:
    """Initialize database schema from SQL file."""
    schema_path = Path(__file__).parent / "schema.sql"
    if not schema_path.exists():
        print(f"Warning: Schema file not found at {schema_path}")
        return

    async with database.get_connection() as conn:
        schema_sql = schema_path.read_text()
        statements = _split_sql_statements(schema_sql)
        for statement in statements:
            statement = statement.strip()
            if statement:
                try:
                    await conn.execute(statement)
                except Exception as e:
                    # Ignore "already exists" errors for idempotency
                    if "already exists" not in str(e):
                        print(f"Schema init error: {e}")
    print("Database schema initialized")


@app.on_event("startup")
async def _startup() -> None:
    global http_client
    http_client = httpx.AsyncClient()

    # Initialize database pool
    await database.init_pool()

    # Initialize database schema
    await _init_schema()

    # Initialize MinIO buckets
    await storage.init_buckets()

    # Start worker tasks
    for _ in range(JOB_WORKERS):
        job_tasks.append(asyncio.create_task(_worker_loop()))


@app.on_event("shutdown")
async def _shutdown() -> None:
    for task in job_tasks:
        task.cancel()
    if http_client:
        await http_client.aclose()
    await database.close_pool()


# =============================================================================
# Health Check
# =============================================================================

@app.get("/api/health")
async def health() -> Dict[str, bool]:
    return {"ok": True}


@app.get("/api/images/{bucket}/{key:path}")
async def get_image(
    bucket: str,
    key: str,
    request: Request,
) -> Response:
    """
    Proxy an image from MinIO to the browser.
    Verifies ownership before serving the image.
    """
    # Decode the URL-encoded key
    from urllib.parse import unquote
    key = unquote(key)

    # Validate bucket name
    if bucket not in [storage.BUCKET_RAW, storage.BUCKET_GENERATED]:
        raise HTTPException(status_code=400, detail="Invalid bucket")

    # Extract generation_id from key to verify ownership
    # Key format: raw/{generation_id}/... or generated/{generation_id}/...
    parts = key.split("/", 2)
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Invalid key format")

    generation_id = parts[1]

    # Verify ownership
    user = await _get_session_user(request)
    guest_session_id = getattr(request.state, "guest_session_id", None)

    user_id = None
    if user:
        async with database.get_connection() as conn:
            user_id = await _get_user_id_from_email(conn, user["email"])

    try:
        generation_uuid = uuid.UUID(generation_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Not found")

    async with database.get_connection() as conn:
        gen = await database.get_generation(
            conn,
            generation_uuid,
            user_id,
            guest_session_id,
        )

        if not gen:
            raise HTTPException(status_code=404, detail="Not found")

    # Fetch from MinIO and stream to client
    try:
        image_bytes, content_type = storage.get_object_with_content_type(bucket, key)
        return Response(content=image_bytes, media_type=content_type or "image/jpeg")
    except Exception:
        raise HTTPException(status_code=404, detail="Image not found")


# =============================================================================
# Generation Endpoints
# =============================================================================

@app.post("/api/generate", response_model=JobCreateResponse)
async def generate_image(
    request: Request,
    image: UploadFile = File(...),
    type_: str = Form(..., alias="type"),
) -> JobCreateResponse:
    """Create a new generation job."""
    category = type_.strip().lower()
    if category not in PROMPT_BY_TYPE:
        raise HTTPException(status_code=400, detail="Unsupported type")
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    prompt = _build_prompt(category)
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image upload")

    # Get user/guest info
    user = await _get_session_user(request)
    guest_session_id = getattr(request.state, "guest_session_id", None)

    # Get user_id from database if logged in
    user_id = None
    if user:
        async with database.get_connection() as conn:
            user_id = await _get_user_id_from_email(conn, user["email"])

    # Only use guest_session_id if NOT logged in (prevents ownership leak)
    guest_session_id = guest_session_id if not user_id else None

    # Consume credit
    ip = _get_client_ip(request)
    free_credits = await _get_ip_credits(ip)
    user_credits = await _get_user_credits(user["email"]) if user else 0

    total = free_credits + user_credits
    if total < 1:
        raise HTTPException(status_code=400, detail="Insufficient credits")

    # Consume one credit
    remaining = 1
    if free_credits > 0:
        free_credits -= 1
        await _set_ip_credits(ip, free_credits)
    elif user:
        user_credits -= 1
        await _set_user_credits(user["email"], user_credits)
    else:
        raise HTTPException(status_code=400, detail="Login required for paid credits")

    # Create generation record in database
    async with database.get_connection() as conn:
        generation_id = await database.create_generation(
            conn,
            user_id,
            guest_session_id,
            category,
        )

        # Upload input to MinIO
        input_key = storage.upload_input(str(generation_id), image_bytes, image.content_type)

        # Create asset record
        await database.create_generation_asset(
            conn,
            generation_id,
            "input",
            storage.BUCKET_RAW,
            input_key,
            image.content_type,
            len(image_bytes),
        )

    # Enqueue job
    await job_queue.put({
        "job_id": str(generation_id),
        "prompt": prompt,
        "image_bytes": image_bytes,  # Keep for now to avoid re-downloading
        "content_type": image.content_type,
        "client_ip": ip,
    })

    return JobCreateResponse(jobId=str(generation_id))


@app.get("/api/generate/{job_id}", response_model=JobStatusResponse)
async def get_generation_status(job_id: str, request: Request) -> JobStatusResponse:
    """Get the status of a generation job."""
    try:
        generation_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Invalid job ID")

    # Get user/guest info
    user = await _get_session_user(request)
    guest_session_id = getattr(request.state, "guest_session_id", None)

    # Get user_id from database if logged in
    user_id = None
    if user:
        async with database.get_connection() as conn:
            user_id = await _get_user_id_from_email(conn, user["email"])

    async with database.get_connection() as conn:
        gen = await database.get_generation(
            conn,
            generation_uuid,
            user_id,
            guest_session_id,
        )

        if not gen:
            raise HTTPException(status_code=404, detail="Job not found")

        # Get assets for image URLs
        assets = await database.get_generation_assets(conn, generation_uuid)

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


@app.get("/api/generations", response_model=GenerationsListResponse)
async def list_generations(
    request: Request,
    scope: str = "auto",
    limit: int = 20,
    cursor: Optional[str] = None,
) -> GenerationsListResponse:
    """List generations for the current user/guest."""
    if limit > 100:
        limit = 100

    # Get user/guest info
    user = await _get_session_user(request)
    guest_session_id = getattr(request.state, "guest_session_id", None)

    # Get user_id from database if logged in
    user_id = None
    if user:
        async with database.get_connection() as conn:
            user_id = await _get_user_id_from_email(conn, user["email"])

    async with database.get_connection() as conn:
        generations = await database.list_generations(
            conn,
            user_id,
            guest_session_id,
            scope,
            limit,
            cursor,
        )

        # For each completed generation, fetch image URLs
        for gen in generations:
            if gen["status"] == "completed":
                assets = await database.get_generation_assets(conn, uuid.UUID(gen["id"]))
                for asset in assets:
                    if asset["kind"] == "output":
                        gen["outputUrl"] = _build_proxy_url(request, asset["bucket"], asset["objectKey"])

    return GenerationsListResponse(
        generations=[GenerationListItem(**g) for g in generations],
        cursor=generations[-1]["createdAt"] if generations else None,
    )


@app.post("/api/history/clear", response_model=ClearHistoryResponse)
async def clear_guest_history(request: Request) -> ClearHistoryResponse:
    """Clear all history for the current guest session."""
    guest_session_id = getattr(request.state, "guest_session_id", None)
    if not guest_session_id:
        raise HTTPException(status_code=401, detail="Guest session required")

    # Get guest token from cookie
    guest_token = request.cookies.get("guest")
    if not guest_token:
        raise HTTPException(status_code=401, detail="Guest token required")

    async with database.get_connection() as conn:
        # Delete generations
        await database.delete_guest_generations(conn, guest_session_id)

        # Rotate guest token
        new_token = generate_guest_token()
        new_token_hash = hash_token(new_token)
        await database.rotate_guest_token(conn, hash_token(guest_token), new_token_hash)

    # Create response with new cookie
    response = Response(content=json.dumps({"cleared": True}), media_type="application/json")
    response.set_cookie(
        "guest",
        new_token,
        max_age=365 * 24 * 60 * 60,  # 1 year
        httponly=True,
        samesite="lax",
        secure=False,
    )
    return response


# =============================================================================
# Auth Endpoints
# =============================================================================

@app.post("/api/auth/register", response_model=AuthResponse)
async def register(request: Request, response: Response) -> AuthResponse:
    """Register a new user account."""
    payload = await request.json()
    email = (payload.get("email") or "").lower().strip()
    password = payload.get("password") or ""
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    async with database.get_connection() as conn:
        # Check if user exists in database
        existing_user = await conn.fetchval("SELECT id FROM users WHERE email = $1", email)
        if existing_user:
            raise HTTPException(status_code=409, detail="Email already registered")

        # Create user in database
        salt = secrets.token_bytes(16)
        salt_b64 = base64.b64encode(salt).decode("ascii")
        password_hash = _hash_password(password, salt)
        user_id = await conn.fetchval(
            """
            INSERT INTO users (email, password_hash, salt)
            VALUES ($1, $2, $3)
            RETURNING id
            """,
            email, password_hash, salt_b64
        )

        # Create credits entry
        await conn.execute(
            "INSERT INTO credits (user_id, balance) VALUES ($1, 0)",
            user_id
        )

        # Create verification token (24 hour expiry)
        verification_token = secrets.token_urlsafe(32)
        token_hash = hash_token(verification_token)
        expires_at = _now() + timedelta(hours=24)

        await conn.execute(
            """
            INSERT INTO email_verifications (user_id, token_hash, expires_at)
            VALUES ($1, $2, $3)
            """,
            user_id, token_hash, expires_at
        )

        # TODO: Send verification email with verification_token
        print(f"Verification token for {email}: {verification_token}")

        # Claim guest history if present
        guest_session_id = getattr(request.state, "guest_session_id", None)
        if guest_session_id:
            claimed = await database.claim_guest_history(conn, user_id, guest_session_id)

    # Also update in-memory state for compatibility
    async with user_lock:
        users[email] = {
            "salt": base64.b64encode(salt).decode("ascii"),
            "password_hash": password_hash,
            "credits": 0,
            "created_at": _now().isoformat(),
        }

    # Create session
    token = secrets.token_hex(32)
    expires_at = _now() + timedelta(hours=SESSION_TTL_HOURS)

    async with database.get_connection() as conn:
        session_token_hash = hash_token(token)
        await conn.execute(
            """
            INSERT INTO sessions (user_id, session_token_hash, expires_at)
            VALUES ($1, $2, $3)
            """,
            user_id, session_token_hash, expires_at
        )

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
    return AuthResponse(user={"email": email, "verificationRequired": "true"})


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(request: Request, response: Response) -> AuthResponse:
    """Login with email and password."""
    payload = await request.json()
    email = (payload.get("email") or "").lower().strip()
    password = payload.get("password") or ""
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    # Verify password against database
    async with database.get_connection() as conn:
        user_row = await conn.fetchrow(
            "SELECT id, password_hash, salt FROM users WHERE email = $1",
            email
        )
        if not user_row:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        salt = base64.b64decode(user_row["salt"])
        if _hash_password(password, salt) != user_row["password_hash"]:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        user_id = user_row["id"]

        # Update last_login_at
        await conn.execute("UPDATE users SET last_login_at = NOW() WHERE id = $1", user_id)

        # Claim guest history if present
        guest_session_id = getattr(request.state, "guest_session_id", None)
        if guest_session_id:
            claimed = await database.claim_guest_history(conn, user_id, guest_session_id)

    # Create session
    token = secrets.token_hex(32)
    expires_at = _now() + timedelta(hours=SESSION_TTL_HOURS)

    async with database.get_connection() as conn:
        session_token_hash = hash_token(token)
        await conn.execute(
            """
            INSERT INTO sessions (user_id, session_token_hash, expires_at)
            VALUES ($1, $2, $3)
            """,
            user_id, session_token_hash, expires_at
        )

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
    """Logout the current user."""
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        token_hash = hash_token(token)
        async with database.get_connection() as conn:
            await conn.execute(
                "DELETE FROM sessions WHERE session_token_hash = $1",
                token_hash
            )
        # Also clean up in-memory for any code that still uses it
        async with user_lock:
            sessions.pop(token, None)
    response.delete_cookie(SESSION_COOKIE)
    return {"ok": True}


@app.get("/api/auth/me", response_model=AuthResponse)
async def me(request: Request) -> AuthResponse:
    """Get the current authenticated user."""
    user = await _get_session_user(request)
    return AuthResponse(user=user)


@app.get("/api/auth/verify")
async def verify_email(request: Request) -> Dict[str, Any]:
    """Verify email using token from query parameter."""
    token = request.query_params.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token required")

    token_hash = hash_token(token)

    async with database.get_connection() as conn:
        # Find valid verification token
        row = await conn.fetchrow(
            """
            SELECT ev.user_id, ev.expires_at
            FROM email_verifications ev
            WHERE ev.token_hash = $1
            """,
            token_hash
        )

        if not row:
            raise HTTPException(status_code=404, detail="Invalid verification token")

        if row["expires_at"] < _now():
            raise HTTPException(status_code=400, detail="Verification token expired")

        user_id = row["user_id"]

        # Mark user as verified
        await conn.execute(
            "UPDATE users SET is_verified = true WHERE id = $1",
            user_id
        )

        # Delete used token
        await conn.execute(
            "DELETE FROM email_verifications WHERE token_hash = $1",
            token_hash
        )

    return {"ok": True, "verified": True}


# =============================================================================
# Credits Endpoints
# =============================================================================

@app.get("/api/credits", response_model=CreditsResponse)
async def credits(request: Request) -> CreditsResponse:
    """Get credit balance for the current user/IP."""
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
    """Consume credits for the current user/IP."""
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
    """Process checkout and add credits to user account."""
    payload = await request.json()
    pack_size = int(payload.get("packSize", 0))
    if pack_size not in {5, 10, 20}:
        raise HTTPException(status_code=400, detail="Invalid pack size")
    user = await _get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")

    async with database.get_connection() as conn:
        user_id = await conn.fetchval("SELECT id FROM users WHERE email = $1", user["email"])
        if user_id:
            await conn.execute(
                "UPDATE credits SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2",
                pack_size, user_id
            )

    return {"ok": True, "added": pack_size}
