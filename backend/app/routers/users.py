"""
Users router — mock user list (for user switcher UI), current user info, and become-host.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.user import UserOut

router = APIRouter(prefix="/api/users", tags=["Users"])


# ── GET /api/users — List mock users for the profile switcher ────────
@router.get("", response_model=dict)
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id).all()
    result = [UserOut.model_validate(u).model_dump() for u in users]
    return {"data": result, "error": None}


# ── GET /api/users/me — Current mock user profile ────────────────────
@router.get("/me", response_model=dict)
def get_me(user: User = Depends(get_current_user)):
    return {"data": UserOut.model_validate(user).model_dump(), "error": None}


# ── POST /api/users/become-host — Promote current user to host role ─
@router.post("/become-host", response_model=dict)
def become_host(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not user.is_host:
        user.is_host = True
        db.commit()
        db.refresh(user)
    return {"data": UserOut.model_validate(user).model_dump(), "error": None}
