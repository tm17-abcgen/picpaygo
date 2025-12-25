"""Main FastAPI application"""
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS
from services.database.connection import init_database, close_database
from services.auth.endpoints import router as auth_router
from services.credits.endpoints import router as credits_router
from services.generate.endpoints import router as generate_router, init_workers, shutdown_workers

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(credits_router)
app.include_router(generate_router)

# Global HTTP client for workers
http_client: httpx.AsyncClient = None


@app.get("/api/health")
async def health():
    """Health check endpoint"""
    return {"ok": True}


@app.on_event("startup")
async def startup():
    """Initialize services on startup"""
    global http_client
    http_client = httpx.AsyncClient()
    await init_database()
    init_workers(http_client)


@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown"""
    global http_client
    shutdown_workers()
    if http_client:
        await http_client.aclose()
    await close_database()

