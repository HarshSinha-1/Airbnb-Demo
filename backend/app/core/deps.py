"""
FastAPI dependencies injected into route handlers.

- get_db()            → yields a SQLAlchemy session, auto-closes
- get_current_user()  → reads X-User-Id header, loads user or 401
- require_host()      → additionally checks user.is_host or 403
"""

from typing import Generator

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.user import User


def get_db() -> Generator[Session, None, None]:
    """Yield a database session and ensure it is closed after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    x_user_id: int | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    """
    Mock auth: read X-User-Id header, load the user row.
    No real login — the frontend (or Swagger) just sets the header.
    """
    if x_user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-User-Id header",
        )
    user = db.query(User).filter(User.id == x_user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"User with id {x_user_id} not found",
        )
    return user


def require_host(
    current_user: User = Depends(get_current_user),
) -> User:
    """Guard: the current user must have is_host=True."""
    if not current_user.is_host:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Host access required",
        )
    return current_user
