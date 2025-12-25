"""Pydantic models for API responses"""
from typing import Any, Dict, Optional
from pydantic import BaseModel


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


