"""Pydantic request/response models for the API."""

from __future__ import annotations

from typing import Dict, List, Optional

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


class GenerationListItem(BaseModel):
    id: str
    category: str
    status: str
    createdAt: str
    completedAt: Optional[str] = None
    error: Optional[str] = None
    outputUrl: Optional[str] = None


class GenerationsListResponse(BaseModel):
    generations: List[GenerationListItem]
    cursor: Optional[str] = None


class ClearHistoryResponse(BaseModel):
    cleared: bool

