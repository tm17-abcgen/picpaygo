"""Job management functions"""
import asyncio
import uuid
from typing import Any, Dict
from datetime import datetime, timezone
from fastapi import HTTPException

from services.auth.functions.utils import get_now

jobs: Dict[str, Dict[str, Any]] = {}
jobs_lock = asyncio.Lock()


async def create_job(category: str) -> str:
    """Create a new generation job"""
    job_id = uuid.uuid4().hex
    async with jobs_lock:
        jobs[job_id] = {
            "id": job_id,
            "status": "queued",
            "category": category,
            "createdAt": get_now().isoformat(),
            "inputUrl": "",
            "outputUrl": "",
            "error": None,
        }
    return job_id


async def update_job(job_id: str, **fields: Any) -> None:
    """Update job fields"""
    async with jobs_lock:
        job = jobs.get(job_id)
        if job:
            job.update(fields)


async def get_job(job_id: str) -> Dict[str, Any]:
    """Get job by ID"""
    async with jobs_lock:
        job = jobs.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job.copy()


