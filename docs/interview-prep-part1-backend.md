## Backend File-by-File Breakdown

This document provides a comprehensive, file-by-file walkthrough of the backend architecture, designed for technical interview preparation. It explains what each component does, why specific design choices were made, and how dependencies interact across the application layer.

---

### 1. Application Entrypoint

#### `backend/app/main.py`
- **Purpose**: Assembles the FastAPI application instance, configures lifespan events (database table creation and auto-seeding), attaches CORS middleware, defines custom envelope exception handlers, and mounts all API routers under the `/api` prefix.
- **Key Functions/Classes**:
  - `lifespan(app: FastAPI)`: Asynchronous context manager executed on application startup and shutdown. On startup, it calls `Base.metadata.create_all(bind=engine)` to ensure tables exist and invokes `seed_database(db)` to auto-populate default data if the database is empty. Structured as a lifespan context manager rather than deprecated `@app.on_event` handlers to align with modern FastAPI/Starlette concurrency conventions.
  - `http_exception_handler(request: Request, exc: HTTPException)`: Global exception handler catching `HTTPException` and returning a standardized JSON object matching the `{ "data": null, "error": { "message": ..., "status_code": ... } }` envelope contract so the client never receives raw unformatted HTTP errors.
  - `unhandled_exception_handler(request: Request, exc: Exception)`: Fallback exception handler catching unhandled server exceptions, logging internal errors, and returning a generic 500 JSON envelope response to prevent leaking internal stack traces.
  - `health_check()`: Light GET `/health` endpoint returning server status for infrastructure checks and deployment health probes.
- **Dependencies**:
  - **Imports from**: `app.core.config` (`settings`), `app.core.database` (`Base`, `SessionLocal`, `engine`), `app.seed.seed` (`seed_database`), `app.routers` (`listings`, `bookings`, `host`, `wishlist`, `reviews`, `users`, `meta`).
  - **Imported by**: Execution entrypoints (`uvicorn app.main:app`), `backend/tests/test_audit.py`, `backend/tests/test_api.py`.

---

### 2. Core Modules

#### `backend/app/core/config.py`
- **Purpose**: Defines application-wide configuration settings loaded from environment variables (or `.env` file) with sensible fallbacks using Pydantic `BaseSettings`.
- **Key Functions/Classes**:
  - `Settings(BaseSettings)`: Pydantic configuration class defining constants such as `DATABASE_URL` (`sqlite:///./airbnb.db`), `CORS_ORIGINS`, `SERVICE_FEE_PCT` (`0.12` / 12%), and `DEFAULT_PAGE_SIZE` (`20`).
  - `cors_origin_list` (property): Parses the comma-separated `CORS_ORIGINS` string into a list of cleaned origin strings for FastAPI's `CORSMiddleware`.
  - `settings`: Singleton instance exported for application-wide access, avoiding re-parsing configuration on every import.
- **Dependencies**:
  - **Imports from**: `pydantic_settings` (`BaseSettings`).
  - **Imported by**: `app.main`, `app.core.database`, `app.services.pricing`, `app.services.listing_service`.

#### `backend/app/core/database.py`
- **Purpose**: Configures the SQLAlchemy database engine, session factory (`SessionLocal`), and declarative base class (`Base`), including SQLite-specific PRAGMA execution.
- **Key Functions/Classes**:
  - `engine`: SQLAlchemy engine instance configured with `connect_args={"check_same_thread": False}` to allow multithreaded request handling in SQLite during development and test execution.
  - `_set_sqlite_pragmas(dbapi_connection, connection_record)`: Event listener triggered on database connection that executes `PRAGMA journal_mode=WAL` and `PRAGMA foreign_keys=ON`. *Why*: Enabling Write-Ahead Logging (WAL) significantly improves SQLite concurrency during concurrent reads and writes, while `foreign_keys=ON` ensures relational cascade deletions are strictly enforced by the database engine.
  - `SessionLocal`: `sessionmaker` instance producing isolated SQLAlchemy database sessions configured with `autocommit=False` and `autoflush=False`.
  - `Base(DeclarativeBase)`: Base class inherited by all SQLAlchemy ORM models.
- **Dependencies**:
  - **Imports from**: `sqlalchemy`, `app.core.config` (`settings`).
  - **Imported by**: `app.main`, `app.core.deps`, `app.models.*`, `app.seed.seed`.

#### `backend/app/core/deps.py`
- **Purpose**: Defines reusable FastAPI dependency functions injected into API routes for database session management and mock header-based authentication/authorization.
- **Key Functions/Classes**:
  - `get_db()`: Generator function yielding a SQLAlchemy session (`SessionLocal()`) per HTTP request and guaranteeing session closure (`db.close()`) inside a `finally` block to prevent connection leaks.
  - `get_current_user(x_user_id: int | None = Header(default=None), db: Session = Depends(get_db)) -> User`: Injects authentication context by inspecting the custom `X-User-Id` HTTP request header and querying the `users` table. Returns the `User` object if found; raises HTTP 401 Unauthorized if the header is missing or the user ID is invalid. *Why*: Avoids complex JWT/session overhead for a demo application while maintaining realistic dependency-injected user context throughout the router layer.
  - `require_host(current_user: User = Depends(get_current_user)) -> User`: Authorization guard wrapping `get_current_user`. Raises HTTP 403 Forbidden if `current_user.is_host` is `False`.
- **Dependencies**:
  - **Imports from**: `fastapi`, `sqlalchemy.orm`, `app.core.database` (`SessionLocal`), `app.models.user` (`User`).
  - **Imported by**: `app.routers.listings`, `app.routers.bookings`, `app.routers.host`, `app.routers.wishlist`, `app.routers.reviews`, `app.routers.users`.

---

### 3. ORM Models (`backend/app/models/`)

#### `backend/app/models/user.py`
- **Purpose**: Defines the `User` ORM model representing both guests and hosts in a single database table.
- **Key Functions/Classes**:
  - `User(Base)`: Table `users`. Stores `id`, `name`, `email` (unique), `avatar_url`, `is_host` (boolean), `is_superhost` (boolean), and `created_at`. *Why*: Hosting is modeled as a role flag (`is_host`), not a separate table or account subclass, mirroring real-world Airbnb architecture where any user account can create listings without creating a separate login.
- **Dependencies**:
  - **Imports from**: `sqlalchemy`, `sqlalchemy.orm`, `app.core.database` (`Base`).
  - **Imported by**: `app.core.deps`, `app.models.listing`, `app.models.booking`, `app.models.review`, `app.models.wishlist`, `app.services.listing_service`, `app.routers.*`.

#### `backend/app/models/listing.py`
- **Purpose**: Defines the `Listing`, `ListingImage`, and `Amenity` ORM models along with the `listing_amenities` many-to-many join table.
- **Key Functions/Classes**:
  - `listing_amenities`: Association table linking `listings.id` and `amenities.id` with ON DELETE CASCADE foreign keys.
  - `Amenity(Base)`: Table `amenities`. Represents a fixed catalogue of search-filterable features (e.g. "Wifi", "Pool", "Free parking"). *Why*: Kept as a normalized catalogue table rather than free-text strings so amenities can be queried cleanly using relational joins and set operations.
  - `Listing(Base)`: Table `listings`. Stores host reference (`host_id`), titles, descriptions, location (`city`, `country`, `lat`, `lng`), pricing (`price_per_night`, `cleaning_fee`, `currency`), property metadata (`max_guests`, `bedrooms`, `beds`, `bathrooms`), and category/property type tags.
  - `ListingImage(Base)`: Table `listing_images`. Stores photo URLs with an explicit integer `position` column. *Why*: Separate table allows ordering multiple photos per listing; `position=0` strictly designates the cover image rendered on search result cards.
- **Dependencies**:
  - **Imports from**: `sqlalchemy`, `sqlalchemy.orm`, `app.core.database` (`Base`).
  - **Imported by**: `app.models.booking`, `app.models.review`, `app.models.wishlist`, `app.services.listing_service`, `app.services.booking_service`, `app.routers.*`.

#### `backend/app/models/booking.py`
- **Purpose**: Defines the `Booking` ORM model representing reservations placed by guests for listings.
- **Key Functions/Classes**:
  - `Booking(Base)`: Table `bookings`. Stores `listing_id`, `guest_id`, `check_in` (Date), `check_out` (Date), `guests` count, snapshotted price fields (`nightly_price`, `nights`, `cleaning_fee`, `service_fee`, `total_price`, `currency`), `status` ("confirmed" or "cancelled"), and `created_at`.
  - `ix_bookings_overlap`: Composite SQL Index on `(listing_id, check_in, check_out)`. *Why*: Optimizes range overlap queries (`check_in < new_checkout AND check_out > new_checkin`) used during availability searches and double-booking conflict checks.
  - *Design Notes*:
    1. **Price Snapshotting**: Prices are computed and frozen onto the booking row at creation time. If a host later updates the listing's nightly price, past or confirmed booking receipts remain unchanged.
    2. **Exclusive Date Boundaries**: `check_out` is stored as an exclusive `Date` boundary. A guest checking out on Oct 10 frees Oct 10 for another guest checking in on Oct 10.
    3. **Soft Cancellation**: Cancellations set `status="cancelled"` rather than deleting the row, freeing the dates while preserving audit history for user trip records and host analytics.
- **Dependencies**:
  - **Imports from**: `sqlalchemy`, `sqlalchemy.orm`, `app.core.database` (`Base`).
  - **Imported by**: `app.models.review`, `app.services.booking_service`, `app.services.listing_service`, `app.routers.*`.

#### `backend/app/models/review.py`
- **Purpose**: Defines the `Review` ORM model representing guest feedback on completed stays.
- **Key Functions/Classes**:
  - `Review(Base)`: Table `reviews`. Stores `listing_id`, `author_id`, `booking_id` (unique foreign key), `rating` (1-5 integer), `comment`, and `created_at`. *Why*: `booking_id` has a UNIQUE constraint enforcing that only verified guests who completed a specific booking can leave a review, and exactly one review per booking is permitted. Ratings are aggregated on demand (`AVG` / `COUNT`) rather than stored as denormalized columns to maintain data consistency.
- **Dependencies**:
  - **Imports from**: `sqlalchemy`, `sqlalchemy.orm`, `app.core.database` (`Base`).
  - **Imported by**: `app.models.booking`, `app.services.listing_service`, `app.routers.reviews`.

#### `backend/app/models/wishlist.py`
- **Purpose**: Defines the `Wishlist` ORM model representing saved/favorited listings for users.
- **Key Functions/Classes**:
  - `Wishlist(Base)`: Table `wishlists`. Uses a composite primary key `(user_id, listing_id)`. *Why*: Eliminates the need for a surrogate auto-increment ID while making duplicate wishlist additions structurally impossible at the database schema level.
- **Dependencies**:
  - **Imports from**: `sqlalchemy`, `sqlalchemy.orm`, `app.core.database` (`Base`).
  - **Imported by**: `app.models.user`, `app.models.listing`, `app.routers.wishlist`.

---

### 4. Pydantic Schemas (`backend/app/schemas/`)

#### `backend/app/schemas/common.py`
- **Purpose**: Defines generic Pydantic wrapper schemas for consistent API response envelopes across all endpoints.
- **Key Functions/Classes**:
  - `ErrorDetail(BaseModel)`: Schema for error details containing `message: str` and optional `status_code: int`.
  - `ResponseEnvelope(BaseModel, Generic[T])`: Generic envelope wrapper containing `data: T | None` and `error: ErrorDetail | None`. Ensures uniform API responses across successful results and error scenarios.
- **Dependencies**:
  - **Imports from**: `pydantic`.
  - **Imported by**: Routers and frontend contracts.

#### `backend/app/schemas/user.py`
- **Purpose**: Pydantic schemas for serialization and request validation of User data.
- **Key Functions/Classes**:
  - `UserOut(BaseModel)`: Full public user representation (`id`, `name`, `email`, `avatar_url`, `is_host`, `is_superhost`, `created_at`) with `model_config = {"from_attributes": True}` for ORM mapping.
  - `UserBrief(BaseModel)`: Compact user profile (`id`, `name`, `avatar_url`, `is_superhost`) embedded in listing details and review outputs.
  - `BecomeHostRequest(BaseModel)`: Empty request payload body for host promotion endpoint.
- **Dependencies**:
  - **Imports from**: `pydantic`.
  - **Imported by**: `app.schemas.listing`, `app.schemas.review`, `app.routers.users`.

#### `backend/app/schemas/listing.py`
- **Purpose**: Pydantic schemas for listing searches, detailed views, creation, updating, and pagination responses.
- **Key Functions/Classes**:
  - `AmenityOut(BaseModel)` / `ListingImageOut(BaseModel)`: Serializers for nested amenities and ordered photos.
  - `ReviewSummary(BaseModel)`: Embedded rating summary (`average_rating`, `review_count`).
  - `ListingCard(BaseModel)`: Lightweight schema used for search grid results and carousel cards (includes cover image URL and aggregated rating).
  - `ListingDetail(BaseModel)`: Complete listing view including full host `UserBrief`, image list, amenity list, pricing, and review summary.
  - `ListingCreate(BaseModel)` / `ListingUpdate(BaseModel)`: Request validation models with field constraints (e.g. `min_length`, `gt=0` for price, `max_guests >= 1`).
  - `ListingSearchResponse(BaseModel)`: Paginated metadata wrapper (`items`, `total`, `page`, `page_size`, `total_pages`).
- **Dependencies**:
  - **Imports from**: `pydantic`, `app.schemas.user` (`UserBrief`).
  - **Imported by**: `app.schemas.wishlist`, `app.routers.listings`, `app.services.listing_service`.

#### `backend/app/schemas/booking.py`
- **Purpose**: Pydantic schemas for booking creation, price quotes, price breakdowns, and trip lists.
- **Key Functions/Classes**:
  - `BookingCreate(BaseModel)`: Input validation for new bookings (`listing_id`, `check_in`, `check_out`, `guests`). Contains `@model_validator(mode="after")` `check_dates` ensuring `check_out > check_in`.
  - `PriceBreakdown(BaseModel)`: Detailed calculated pricing components (`nightly_price`, `nights`, `subtotal`, `cleaning_fee`, `service_fee`, `total`, `currency`).
  - `BookingOut(BaseModel)`: Response representation of a booking with embedded listing and guest metadata for display on "My Trips" and host dashboards.
  - `PriceQuoteRequest(BaseModel)`: Input schema for price quote queries.
- **Dependencies**:
  - **Imports from**: `pydantic`.
  - **Imported by**: `app.routers.bookings`, `app.routers.listings`, `app.routers.host`.

#### `backend/app/schemas/review.py`
- **Purpose**: Pydantic schemas for review creation and serialization.
- **Key Functions/Classes**:
  - `ReviewCreate(BaseModel)`: Validation model for posting a review (`booking_id`, `rating` constrained between 1 and 5, `comment`).
  - `ReviewOut(BaseModel)`: Response serializer including embedded `author` (`UserBrief`).
- **Dependencies**:
  - **Imports from**: `pydantic`, `app.schemas.user` (`UserBrief`).
  - **Imported by**: `app.routers.reviews`.

#### `backend/app/schemas/wishlist.py`
- **Purpose**: Pydantic schema for wishlist items.
- **Key Functions/Classes**:
  - `WishlistItemOut(BaseModel)`: Serializes a saved wishlist record containing `listing_id`, saved timestamp, and full `ListingCard`.
- **Dependencies**:
  - **Imports from**: `pydantic`, `app.schemas.listing` (`ListingCard`).
  - **Imported by**: `app.routers.wishlist`.

---

### 5. Services Layer (`backend/app/services/`)

#### `backend/app/services/pricing.py`
- **Purpose**: Centralized, single-source-of-truth pricing computation logic.
- **Key Functions/Classes**:
  - `compute_price(price_per_night: float, cleaning_fee: float, check_in: date, check_out: date) -> dict`: Calculates total nights `(check_out - check_in).days`, subtotal `nights * price_per_night`, service fee `subtotal * SERVICE_FEE_PCT` (12%), and total cost. *Why*: Implemented as a pure, standalone function used by **both** `GET /api/listings/{id}/price-quote` and `create_booking()`. This structure guarantees that the quoted price displayed during checkout and the actual charged price written to the database can never drift apart due to duplicated arithmetic logic.
- **Dependencies**:
  - **Imports from**: `app.core.config` (`settings`).
  - **Imported by**: `app.services.booking_service`, `app.routers.listings`, `app.seed.seed`.

#### `backend/app/services/booking_service.py`
- **Purpose**: Encapsulates all reservation business logic including range overlap checks, booking creation within database transactions, cancellations, and trip queries.
- **Key Functions/Classes**:
  - `get_blocked_dates(db: Session, listing_id: int) -> list[dict]`: Queries all confirmed bookings for a listing to return date ranges used by the frontend availability calendar.
  - `check_overlap(db: Session, listing_id: int, check_in: date, check_out: date) -> bool`: Executes the core range collision query:
    ```sql
    WHERE listing_id = :id AND status = 'confirmed'
      AND check_in < :new_check_out AND check_out > :new_check_in
    ```
    *Why*: Mathematically verifies if two semi-open intervals `[check_in, check_out)` intersect. Returns `True` if any overlap exists.
  - `create_booking(db: Session, guest_id: int, listing_id: int, check_in: date, check_out: date, guests: int) -> Booking`: Validates inputs, executes `check_overlap` **within the same database transaction**, calls `compute_price`, creates the `Booking` record, commits the transaction, and returns the entity. If an overlap is detected, raises `HTTPException(409 Conflict)`.
  - `cancel_booking(db: Session, booking_id: int, user_id: int) -> Booking`: Validates that the requesting user owns the booking (`guest_id == user_id`), verifies the booking is not already cancelled, updates `status = "cancelled"`, and commits.
  - `get_my_bookings(db: Session, guest_id: int) -> list[dict]`: Retrieves all bookings made by a guest, ordered by check-in date descending, with joined listing details and cover images for display on "My Trips".
- **Dependencies**:
  - **Imports from**: `fastapi`, `sqlalchemy.orm`, `app.models.booking` (`Booking`), `app.models.listing` (`Listing`, `ListingImage`), `app.services.pricing` (`compute_price`).
  - **Imported by**: `app.routers.bookings`, `app.routers.listings`.

#### `backend/app/services/listing_service.py`
- **Purpose**: Encapsulates search filtering, pagination, rating aggregation, and CRUD operations for listings.
- **Key Functions/Classes**:
  - `search_listings(db: Session, location, check_in, check_out, guests, min_price, max_price, property_type, category, amenities, page, page_size) -> dict`: Constructs a dynamic SQLAlchemy query combining:
    1. Case-insensitive substring matching on `city` or `country`.
    2. Guest capacity, price range, property type, and category filters.
    3. Mandatory amenity filtering (ensuring the listing has *all* requested amenity IDs via subqueries).
    4. **Availability exclusion**: Subquery excluding any listing with a confirmed booking overlapping `[check_in, check_out)`.
    5. On-the-fly rating aggregation (`AVG(rating)` and `COUNT(id)`) and cover image resolution (`position=0`).
    6. Offset-limit pagination returning paginated metadata (`total`, `total_pages`, `items`).
  - `get_listing_detail(db: Session, listing_id: int) -> dict | None`: Loads a single listing using `joinedload` for eager fetching of `host`, `images`, and `amenities` relationships in minimal database round-trips, paired with aggregated review summary metrics.
  - `create_listing(db: Session, host_id: int, data: dict) -> Listing`: Inserts a new listing record, bulk-creates ordered `ListingImage` rows, attaches requested `Amenity` objects, and commits inside a transaction.
  - `update_listing(db: Session, listing: Listing, data: dict) -> Listing`: Updates listing scalar fields and replaces images/amenities if provided.
  - `delete_listing(db: Session, listing: Listing) -> None`: Deletes a listing, triggering database foreign key cascades for dependent records.
  - `get_host_listings(db: Session, host_id: int)` / `get_host_bookings(db: Session, host_id: int)`: Queries tailored specifically for host management dashboards.
- **Dependencies**:
  - **Imports from**: `sqlalchemy`, `sqlalchemy.orm`, `app.core.config`, `app.models.listing`, `app.models.booking`, `app.models.review`.
  - **Imported by**: `app.routers.listings`, `app.routers.host`.

---

### 6. Routers (`backend/app/routers/`)

#### `backend/app/routers/listings.py`
- **Purpose**: Exposes API endpoints for searching listings, viewing details, checking availability/price quotes, and managing host listing CRUD.
- **Key Functions/Endpoints**:
  - `GET /api/listings`: Public listing search with filter query params. Delegates query building to `listing_service.search_listings()`.
  - `GET /api/listings/{listing_id}`: Returns full listing detail view.
  - `GET /api/listings/{listing_id}/availability`: Returns blocked date ranges via `booking_service.get_blocked_dates()`.
  - `GET /api/listings/{listing_id}/price-quote`: Computes price breakdown via `pricing.compute_price()`.
  - `POST /api/listings`: Creates a new listing. Guarded by `require_host` dependency.
  - `PUT /api/listings/{listing_id}` / `DELETE /api/listings/{listing_id}`: Updates or deletes a listing. Enforces ownership check (`listing.host_id == host.id` or raises 403 Forbidden).
- **Dependencies**:
  - **Imports from**: `fastapi`, `sqlalchemy.orm`, `app.core.deps`, `app.models.listing`, `app.schemas.listing`, `app.services.listing_service`, `app.services.booking_service`, `app.services.pricing`.
  - **Imported by**: `app.main`.

#### `backend/app/routers/bookings.py`
- **Purpose**: Exposes endpoints for creating bookings, listing guest trips, and cancelling reservations.
- **Key Functions/Endpoints**:
  - `POST /api/bookings`: Accepts `BookingCreate` schema, resolves authenticated user via `get_current_user`, and calls `booking_service.create_booking()`. Returns 201 Created on success or 409 Conflict if dates overlap.
  - `GET /api/bookings/mine`: Returns all reservations for the current user ("My Trips").
  - `DELETE /api/bookings/{booking_id}`: Cancels a reservation via `booking_service.cancel_booking()`.
- **Dependencies**:
  - **Imports from**: `fastapi`, `sqlalchemy.orm`, `app.core.deps`, `app.schemas.booking`, `app.services.booking_service`.
  - **Imported by**: `app.main`.

#### `backend/app/routers/reviews.py`
- **Purpose**: Exposes endpoints for fetching reviews for a listing and submitting new reviews for completed stays.
- **Key Functions/Endpoints**:
  - `GET /api/listings/{listing_id}/reviews`: Returns all reviews for a listing ordered by creation date descending.
  - `POST /api/reviews`: Accepts `ReviewCreate`. Validates that:
    1. The target booking exists and belongs to `get_current_user` (403 if not).
    2. The booking is not cancelled (400 if cancelled).
    3. No review has already been posted for this `booking_id` (400 if duplicate).
    Saves the review and returns 201 Created.
- **Dependencies**:
  - **Imports from**: `fastapi`, `sqlalchemy.orm`, `app.core.deps`, `app.models.booking`, `app.models.review`, `app.schemas.review`.
  - **Imported by**: `app.main`.

#### `backend/app/routers/wishlist.py`
- **Purpose**: Exposes endpoints for getting, adding, and removing saved listings on user wishlists.
- **Key Functions/Endpoints**:
  - `GET /api/wishlist`: Returns saved listings for `get_current_user` with populated `ListingCard` details.
  - `POST /api/wishlist/{listing_id}`: Adds a listing to user's wishlist. Gracefully handles existing items (returns 200 with "Already in wishlist" message).
  - `DELETE /api/wishlist/{listing_id}`: Removes a listing from the user's wishlist.
- **Dependencies**:
  - **Imports from**: `fastapi`, `sqlalchemy.orm`, `app.core.deps`, `app.models.listing`, `app.models.wishlist`, `app.models.review`.
  - **Imported by**: `app.main`.

#### `backend/app/routers/host.py`
- **Purpose**: Exposes host dashboard management endpoints.
- **Key Functions/Endpoints**:
  - `GET /api/host/listings`: Returns all listings owned by the authenticated host along with active booking counts.
  - `GET /api/host/bookings`: Returns all bookings placed across all listings owned by the host.
- **Dependencies**:
  - **Imports from**: `fastapi`, `sqlalchemy.orm`, `app.core.deps` (`require_host`), `app.services.listing_service`.
  - **Imported by**: `app.main`.

#### `backend/app/routers/users.py`
- **Purpose**: Exposes endpoints for listing mock profiles, getting current profile info, and host role self-promotion.
- **Key Functions/Endpoints**:
  - `GET /api/users`: Returns all seed users (used by frontend profile switcher UI).
  - `GET /api/users/me`: Returns `UserOut` details for `get_current_user`.
  - `POST /api/users/become-host`: Sets `is_host = True` for `get_current_user` and commits.
- **Dependencies**:
  - **Imports from**: `fastapi`, `sqlalchemy.orm`, `app.core.deps`, `app.models.user`, `app.schemas.user`.
  - **Imported by**: `app.main`.

#### `backend/app/routers/meta.py`
- **Purpose**: Exposes static category definitions and dynamic amenity catalogue metadata.
- **Key Functions/Endpoints**:
  - `GET /api/meta/categories`: Returns hardcoded category definitions (`id`, `name`, `icon`).
  - `GET /api/meta/amenities`: Queries database `amenities` table and returns available filter options.
- **Dependencies**:
  - **Imports from**: `fastapi`, `sqlalchemy.orm`, `app.core.deps`, `app.models.listing` (`Amenity`).
  - **Imported by**: `app.main`.

---

### 7. Seed & Testing Infrastructure

#### `backend/app/seed/seed.py`
- **Purpose**: Provides a deterministic, idempotent data seeding script that populates the database with realistic initial data for development and testing.
- **Key Functions/Classes**:
  - `seed_database(db: Session)`:
    1. Sets `random.seed(42)` for deterministic generation.
    2. Checks if users already exist (`if db.query(User).first() is not None: return`) to guarantee idempotency.
    3. Seeds 9 users (5 hosts, 4 guests), 12 amenities, and 25 listings across 6 international cities (Malibu, Paris, Kyoto, Aspen, Santorini, Cape Town) and 3 Indian regions (Lucknow, Gurgaon, Goa) with multi-currency support (USD and INR).
    4. Seeds past bookings paired with realistic reviews, future blocked bookings, pre-added wishlist items, and a demo booking scenario.
- **Dependencies**:
  - **Imports from**: `sqlalchemy.orm`, `app.core.database`, `app.models.*`, `app.services.pricing`.
  - **Imported by**: `app.main`, `backend/tests/test_audit.py`.

#### `backend/tests/test_audit.py`
- **Purpose**: Comprehensive 9-point audit test suite verifying all core application invariants against either a local in-memory FastAPI `TestClient` or a remote deployed target URL.
- **Key Functions/Classes**:
  - `audit_item_1_schemas()`: Validates explicit JSON contract keys on listing detail responses.
  - `audit_item_2_and_3_autoseed_and_idempotency()`: Verifies auto-seeding on empty database and idempotency on repeated execution.
  - `audit_item_4_availability_and_price_quote()`: Tests availability and price quote endpoints.
  - `audit_item_5_ownership_checks()`: Verifies HTTP 403 Forbidden when a host attempts to edit/delete another host's listing.
  - `audit_item_6_cancellation_frees_dates()`: End-to-end verification: booking succeeds -> overlapping booking rejected with 409 -> booking cancelled -> re-booking same dates succeeds.
  - `audit_item_7_pagination_and_filters()`: Verifies multi-parameter search filtering and offset pagination.
  - `audit_item_8_review_constraints()`: Verifies guest ownership and duplicate review rejection (HTTP 400).
  - `audit_item_9_wishlist_constraints()`: Verifies duplicate wishlist addition handling.
- **Dependencies**:
  - **Imports from**: `httpx`, `fastapi.testclient`, `app.main` (`app`), `app.core.database`, `app.models.*`, `app.seed.seed`.

---

### End-to-End Request Flow: `POST /api/bookings`

If asked to trace a single request end-to-end in an interview, here is the exact execution path for placing a reservation (`POST /api/bookings`):

```
Client Request (HTTP POST /api/bookings Header: X-User-Id: 6 Body: { listing_id: 1, check_in: "2026-10-01", check_out: "2026-10-05", guests: 2 })
   │
   ▼
1. Entrypoint & Routing (app/main.py & app/routers/bookings.py)
   FastAPI matches route `create_booking()` in `app/routers/bookings.py`.
   Pydantic validates the request body using `BookingCreate` schema (verifying check_out > check_in).
   │
   ▼
2. Dependency Injection (app/core/deps.py)
   - `get_db()` creates a database session (`SessionLocal`).
   - `get_current_user()` reads `X-User-Id: 6`, queries `User` table, and injects user entity (Guest Alice).
   │
   ▼
3. Service Layer Logic & Transaction (app/services/booking_service.py)
   `router.create_booking()` calls `booking_service.create_booking()` inside a single DB transaction:
   a. Loads `Listing` entity (id=1). Verifies `guests <= listing.max_guests`.
   b. Calls `booking_service.check_overlap()` executing SQL conflict check:
      `WHERE listing_id=1 AND status='confirmed' AND check_in < '2026-10-05' AND check_out > '2026-10-01'`
      If an existing booking is found, raises `HTTPException(409 Conflict)`.
   c. Calls `pricing.compute_price()` in `app/services/pricing.py` to calculate exact subtotal, cleaning fee, and 12% service fee.
   d. Instantiates `Booking` ORM model (app/models/booking.py) with status="confirmed" and price snapshot.
   e. Executes `db.add(booking)`, `db.commit()`, and `db.refresh(booking)`.
   │
   ▼
4. Response Serialization & Envelope Formatting (app/schemas/booking.py & app/main.py)
   `booking_service` returns the created ORM entity.
   Router validates and dumps output using `BookingOut` schema.
   Response is wrapped in standard envelope: `{ "data": BookingOut, "error": null }` with HTTP 201 Created status.
   Session is closed by `get_db()` `finally` block.
```
