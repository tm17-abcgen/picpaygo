"""
PicPayGo API - FastAPI application with guest history support.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
