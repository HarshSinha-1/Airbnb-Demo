# Airbnb Clone — Backend

FastAPI backend for the Airbnb Clone project. Handles listings, bookings, reviews, wishlist, and host management via a RESTful JSON API.

## Stack
- **FastAPI** + **Pydantic v2** for schema validation and API routing
- **SQLAlchemy ORM** with **SQLite** (easily portable to PostgreSQL)
- **Uvicorn** ASGI server

## Local Setup
```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The database is **auto-created and seeded** on first boot — no migration step needed.

### Reset the database
```bash
del airbnb.db        # Windows
# rm airbnb.db       # macOS/Linux
```
Then restart the server; the seed will regenerate.

## API Docs
Interactive Swagger UI available at: `http://localhost:8000/docs`

## Response Envelope
All endpoints return a consistent `{ data, error }` envelope:
```json
{ "data": { ... }, "error": null }
```
Errors return `{ "data": null, "error": { "message": "..." } }`.

## Key Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/listings` | ❌ | Search & filter listings (pagination) |
| GET | `/api/listings/{id}` | ❌ | Full listing detail |
| GET | `/api/listings/{id}/availability` | ❌ | Blocked date ranges |
| GET | `/api/listings/{id}/price-quote` | ❌ | Nightly breakdown |
| POST | `/api/bookings` | ✅ Guest | Create booking (overlap-safe) |
| DELETE | `/api/bookings/{id}` | ✅ Guest | Cancel booking |
| POST | `/api/reviews` | ✅ Guest | Leave a review (post-stay only) |
| GET/POST/DELETE | `/api/wishlist/{id}` | ✅ Guest | Wishlist management |
| POST | `/api/listings` | ✅ Host | Create listing |
| PUT/DELETE | `/api/listings/{id}` | ✅ Host | Update/delete own listing |
| GET | `/api/host/listings` | ✅ Host | Host's own listings |
| GET | `/api/host/bookings` | ✅ Host | Bookings for host's listings |

Auth is header-based: `X-User-Id: <int>` (mock, no password).

## Schema: `currency` Field (added)

All listing and booking schemas now include a `currency` field (ISO 4217 code):

- **`ListingCard`** → includes `currency: str` (e.g. `"USD"`, `"INR"`)
- **`ListingDetail`** → includes `currency: str`
- **`PriceQuote`** → includes `currency: str`
- **`Booking`** (response) → includes `currency: str`

No conversion logic is applied — each listing is priced and returned in its own fixed native currency. The frontend formats the symbol accordingly using `Intl.NumberFormat`.

## Seed Data

The database seeds **deterministically** (using `random.seed(42)`) and is **idempotent** (re-running never duplicates rows).

### USD Listings (~25)
Across Malibu, Aspen, Miami, New York, Santorini, Paris, Tokyo, Bali, Cape Town, Sydney.

### INR Listings (~15) — added
Three Indian regions, ~5 listings each:

| City | Sample nightly price |
|------|---------------------|
| Lucknow | ₹6,000 – ₹15,000 |
| Gurgaon | ₹7,500 – ₹18,000 |
| Goa | ₹8,000 – ₹20,000 |

## Running the Audit Test Suite
```bash
venv\Scripts\python tests\test_audit.py
```
Covers 9 checks: schemas, auto-seed, idempotency, availability, price-quote, ownership (403), cancellation-frees-dates, review constraints, and wishlist constraints. All 9 must pass before any production deployment.
