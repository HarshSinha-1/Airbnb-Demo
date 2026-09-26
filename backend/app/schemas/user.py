"""Pydantic schemas for User endpoints."""

from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    avatar_url: str | None = None
    is_host: bool
    is_superhost: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserBrief(BaseModel):
    """Compact user info embedded in listing detail, reviews, etc."""
    id: int
    name: str
    avatar_url: str | None = None
    is_superhost: bool = False

    model_config = {"from_attributes": True}


class BecomeHostRequest(BaseModel):
    """Promote the current user to host."""
    pass  # No body needed — just the action
