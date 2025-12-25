"""Generation endpoints"""
import asyncio
from typing import Any, Dict
from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
import httpx

from models import JobCreateResponse, JobStatusResponse
from config import JOB_WORKERS
from .functions.prompts import PROMPT_BY_TYPE, build_prompt
from services.auth.functions.utils import get_client_ip
from .functions.jobs import create_job, update_job, get_job
from .functions.openrouter import send_openrouter_request

router = APIRouter(prefix="/api/generate", tags=["generate"])

# Global state for worker
http_client: httpx.AsyncClient = None
job_queue: asyncio.Queue[Dict[str, Any]] = asyncio.Queue()
job_tasks: list[asyncio.Task] = []


async def worker_loop(http_client: httpx.AsyncClient) -> None:
    """Background worker for processing jobs"""
    while True:
        payload = await job_queue.get()
        job_id = payload["job_id"]
        try:
            await update_job(job_id, status="processing")
            output_url = await send_openrouter_request(
                http_client,
                payload["prompt"],
                payload["image_bytes"],
                payload["content_type"],
            )
            await update_job(job_id, status="completed", outputUrl=output_url)
        except Exception as exc:
            await update_job(job_id, status="failed", error=str(exc))
        finally:
            job_queue.task_done()


def init_workers(client: httpx.AsyncClient) -> None:
    """Initialize background workers"""
    global job_tasks
    for _ in range(JOB_WORKERS):
        job_tasks.append(asyncio.create_task(worker_loop(client)))


def shutdown_workers() -> None:
    """Shutdown background workers"""
    global job_tasks
    for task in job_tasks:
        task.cancel()


@router.post("", response_model=JobCreateResponse)
async def generate_image(
    request: Request,
    image: UploadFile = File(...),
    type_: str = Form(..., alias="type"),
) -> JobCreateResponse:
    """Create a new image generation job"""
    category = type_.strip().lower()
    if category not in PROMPT_BY_TYPE:
        raise HTTPException(status_code=400, detail="Unsupported type")
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    prompt = build_prompt(category)
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image upload")

    job_id = await create_job(category)
    await job_queue.put(
        {
            "job_id": job_id,
            "prompt": prompt,
            "image_bytes": image_bytes,
            "content_type": image.content_type,
            "client_ip": get_client_ip(request),
        }
    )

    return JobCreateResponse(jobId=job_id)


@router.get("/{job_id}", response_model=JobStatusResponse)
async def get_generation_status(job_id: str) -> JobStatusResponse:
    """Get generation job status"""
    job = await get_job(job_id)
    return JobStatusResponse(**job)

