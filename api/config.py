"""Configuration and constants for the API"""
import os

# OpenRouter API Configuration
OPENROUTER_API_URL = os.getenv(
    "OPENROUTER_API_URL",
    "https://openrouter.ai/api/v1/chat/completions"
)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv(
    "OPENROUTER_MODEL",
    "google/gemini-3-pro-image-preview"
)

# Job Processing Configuration
JOB_WORKERS = max(int(os.getenv("JOB_WORKERS", "2")), 1)
JOB_TIMEOUT_SECONDS = int(os.getenv("JOB_TIMEOUT_SECONDS", "120"))

# Session Configuration
SESSION_COOKIE = "session"
SESSION_TTL_HOURS = int(os.getenv("SESSION_TTL_HOURS", "168"))
DEFAULT_FREE_CREDITS = int(os.getenv("FREE_CREDITS", "3"))

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# Database Configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://picpaygo:picpaygo_dev@postgres:5432/picpaygo"
)

# CORS Configuration
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:8082,https://picpaygo.com,https://www.picpaygo.com"
    ).split(",")
    if origin.strip()
]


