"""
Meta router — categories and amenities metadata for search filter bars and forms.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.listing import Amenity, Listing
from app.schemas.listing import AmenityOut

router = APIRouter(prefix="/api/meta", tags=["Metadata"])

CATEGORIES = [
    {"id": "beachfront", "name": "Beachfront", "icon": "waves"},
    {"id": "cabins", "name": "Cabins", "icon": "cabin"},
    {"id": "mansions", "name": "Mansions", "icon": "villa"},
    {"id": "trending", "name": "Trending", "icon": "whatshot"},
    {"id": "amazing_views", "name": "Amazing views", "icon": "landscape"},
    {"id": "tiny_homes", "name": "Tiny homes", "icon": "home"},
    {"id": "lakefront", "name": "Lakefront", "icon": "water"},
    {"id": "countryside", "name": "Countryside", "icon": "park"},
    {"id": "design", "name": "Design", "icon": "architecture"},
    {"id": "tropical", "name": "Tropical", "icon": "palmtree"},
    {"id": "icons", "name": "Icons", "icon": "star"},
    {"id": "rooms", "name": "Rooms", "icon": "bed"},
]


# ── GET /api/meta/categories ─────────────────────────────────────────
@router.get("/categories", response_model=dict)
def get_categories():
    return {"data": CATEGORIES, "error": None}


# ── GET /api/meta/amenities ──────────────────────────────────────────
@router.get("/amenities", response_model=dict)
def get_amenities(db: Session = Depends(get_db)):
    amenities = db.query(Amenity).order_by(Amenity.id).all()
    result = [AmenityOut.model_validate(a).model_dump() for a in amenities]
    return {"data": result, "error": None}
