"""
FastAPI application entrypoint.

- Registers CORS middleware
- Auto-creates database tables on startup
- Auto-seeds database on startup if empty
- Registers all API routers under /api
- Configures global exception handlers for consistent { data, error } envelope
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.routers import (
    bookings,
    host,
    listings,
    meta,
    reviews,
    users,
    wishlist,
)
from app.seed.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and auto-seed if empty
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield
    # Shutdown logic (if any)


app = FastAPI(
    title="Airbnb Clone API",
    description="Production-quality REST API backend for Airbnb Clone",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS Setup ───────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Exception Handlers for Envelope ─────────────────────────────────
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "data": None,
            "error": {
                "message": exc.detail,
                "status_code": exc.status_code,
            },
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "data": None,
            "error": {
                "message": "Internal server error",
                "status_code": 500,
            },
        },
    )


# ── Health check ─────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health_check():
    return {"data": {"status": "healthy", "service": "airbnb-backend"}, "error": None}


# ── Register Routers ─────────────────────────────────────────────────
app.include_router(listings.router)
app.include_router(bookings.router)
app.include_router(host.router)
app.include_router(wishlist.router)
app.include_router(reviews.router)
app.include_router(users.router)
app.include_router(meta.router)
