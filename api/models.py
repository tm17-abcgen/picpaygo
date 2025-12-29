"""Pydantic request/response models for the API."""

from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field


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


class UserResponse(BaseModel):
    email: str
    verificationRequired: Optional[bool] = None
    isVerified: Optional[bool] = None


class AuthResponse(BaseModel):
    user: Optional[UserResponse] = None


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


# Auth request models for type-safe parsing
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class ChangePasswordRequest(BaseModel):
    currentPassword: str = Field(..., min_length=1)
    newPassword: str = Field(..., min_length=1)


class DeleteAccountRequest(BaseModel):
    password: str = Field(..., min_length=1)

