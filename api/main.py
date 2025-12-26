"""
PicPayGo API - FastAPI application with guest history support.
"""

from __future__ import annotations

import logging
import sys
import uuid

from fastapi import FastAPI
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import config
from services import storage
from services.auth.endpoints import router as auth_router
from services.auth.middleware import GuestSessionMiddleware
from services.credits.endpoints import router as credits_router
from services.database.connection import close_pool, init_pool, init_schema
from services.generate.endpoints import router as generate_router
from services.generate.functions.jobs import start_workers, stop_workers
from services.webhooks.endpoints import router as webhooks_router

app = FastAPI(title=config.APP_TITLE)
logger = logging.getLogger("picpaygo")

# Configure logging to output to stdout
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s.%(msecs)03d %(name)s %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Guest session middleware (must be added after CORS)
app.add_middleware(GuestSessionMiddleware)

# Routers
app.include_router(auth_router)
app.include_router(credits_router)
app.include_router(generate_router)
app.include_router(webhooks_router)


@app.exception_handler(Exception)
async def _unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    error_id = uuid.uuid4().hex
    logger.exception(
        "Unhandled exception errorId=%s method=%s path=%s",
        error_id,
        request.method,
        request.url.path,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "errorId": error_id},
    )


@app.on_event("startup")
async def _startup() -> None:
    await init_pool()
    await init_schema()
    await storage.init_buckets()
    await start_workers(config.JOB_WORKERS)


@app.on_event("shutdown")
async def _shutdown() -> None:
    await stop_workers()
    await close_pool()
