"""Common response envelope schema."""

from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class ErrorDetail(BaseModel):
    message: str
    status_code: int | None = None


class ResponseEnvelope(BaseModel, Generic[T]):
    data: T | None = None
    error: ErrorDetail | None = None
