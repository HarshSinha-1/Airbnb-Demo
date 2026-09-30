# Architecture & Project Flow Narrative

This document serves as the core narrative reference for technical interviews. It translates the codebase into a clear, confident, and structured story explaining **how** the system was built, **why** specific architectural choices were made, and **how to defend** key technical trade-offs.

---

## Part 1 — System Architecture Overview

### High-Level System Architecture
The application is a full-stack, production-grade Airbnb clone built as a decoupled, two-tier architecture:
- **Frontend**: Next.js (App Router, TypeScript, Tailwind CSS v4) deployed serverless on **Vercel**.
- **Backend**: Python FastAPI application deployed on an **Azure Linux Virtual Machine**, running behind an **Nginx** reverse proxy and managed by **Systemd**.
- **Communication Layer**: The frontend and backend communicate exclusively over **HTTPS REST APIs**. User identity and request scoping are passed via a custom `X-User-Id` HTTP request header, which the backend inspects on protected routes to simulate authenticated tenant contexts without requiring full auth handshake overhead.

```
┌────────────────────────────────────────┐       HTTPS REST       ┌────────────────────────────────────────┐
│           Next.js Frontend             │ ────────────────────►  │           Nginx Reverse Proxy          │
│          (Deployed on Vercel)          │   X-User-Id: <id>      │         (Azure Linux VM + SSL)         │
└────────────────────────────────────────┘                        └───────────────────┬────────────────────┘
                                                                                      │ unix socket / proxy
                                                                                      ▼
                                                                  ┌────────────────────────────────────────┐
                                                                  │             FastAPI Backend            │
                                                                  │         (Uvicorn + Systemd)            │
                                                                  └───────────────────┬────────────────────┘
                                                                                      │ SQLAlchemy ORM
                                                                                      ▼
                                                                  ┌────────────────────────────────────────┐
                                                                  │            SQLite Database             │
                                                                  │          (app.db / Auto-seeded)        │
                                                                  └────────────────────────────────────────┘
```

### Architectural Rationale: Why These Choices?

1. **SQLite over Managed Cloud DB**:
   - **Reasoning**: SQLite provides a zero-configuration, single-file relational database embedded directly alongside the FastAPI service. For an interview demo project, it completely eliminates cloud database infrastructure overhead, connection pooling configuration, and monthly hosting costs.
   - **Stateless Demo Feel**: Coupled with an automatic startup seeding script (`seed.py`), if the database file is ever missing or empty, FastAPI auto-populates realistic listings, users, and reviews on boot.

2. **FastAPI for the Backend**:
   - **Reasoning**: FastAPI offers native async I/O performance, automatic Pydantic request/response schema validation, and instant OpenAPI/Swagger interactive documentation generation (`/docs`). This allowed rapid, self-documenting API development.

3. **Routers → Services → Models Layering**:
   - **Reasoning**: Enforces strict separation of concerns:
     - **Routers (`app/routers/`)**: Handle HTTP request parsing, header extraction (`X-User-Id`), status code responses, and schema serialization.
     - **Services (`app/services/`)**: Contain pure business logic (date math, pricing calculations, overlap validation, host authorization checks).
     - **Models (`app/models/`)**: Define SQLAlchemy ORM database table schemas and relationships.
   - **Benefit**: Pricing math and date overlap rules can be unit-tested in isolation without mocking HTTP requests or database sessions.

4. **Mock Header Authentication (`X-User-Id`)**:
   - **Reasoning**: Traditional auth (OAuth2/JWT/Cognito) introduces sign-up forms and login friction for interviewers reviewing the project. Mocking auth via an explicit `X-User-Id` request header provides immediate persona switching (e.g. instantly acting as a Guest or Host via a dropdown UI) while preserving full server-side authorization enforcement (`403 Forbidden` on unauthorized resource access).

---

## Part 2 — Build Order Narrative

When walking an interviewer through the construction of this project, present the build process as a disciplined, risk-first sequence:

### 1. Backend Scaffolding & Core Schema Design
The project began by modeling the core domain entities (`User`, `Listing`, `Booking`, `Review`) in SQLAlchemy.
- **Key Schema Decision**: Financial price snapshotting on bookings. Instead of dynamically computing reservation totals based on current listing prices, the `Booking` model explicitly snapshots `nightly_price`, `cleaning_fee`, `service_fee`, and `total_price` at the exact moment of reservation.
- **Why**: Historical receipts must remain immutable. If a host updates their nightly rate from $100 to $200 next month, past bookings must retain their original quoted price.

### 2. Read Endpoints Before Write Logic
Development prioritized read-only endpoints (`GET /api/listings`, `GET /api/listings/{id}`, `GET /api/reviews`) before touchy state mutations.
- **Why**: Building feed retrieval and detail pages first allowed establishing the exact data structures required by the UI, verifying pagination and search filtering, and seeding realistic data before adding transactional risk.

### 3. Server-Side Booking Overlap Enforcement
With read models established, reservation creation logic was implemented. The core challenge was preventing double-bookings.
- **Overlap Logic**: A new reservation `(new_start, new_end)` overlaps with an existing confirmed booking `(exist_start, exist_end)` if and only if:
  $$\text{new\_check\_in} < \text{existing\_check\_out} \quad \text{AND} \quad \text{new\_check\_out} > \text{existing\_check\_in}$$
- **SQL Implementation**:
  ```sql
  SELECT * FROM bookings
  WHERE listing_id = :listing_id
    AND status = 'confirmed'
    AND :check_in < check_out
    AND :check_out > check_in
  ```
- **Why Server-Side**: Client-side date validation can easily be bypassed or suffer from stale state when two users view the same listing simultaneously. Enforcing this check inside an atomic database query guarantees that concurrent attempts result in a deterministic `HTTP 409 Conflict`.

### 4. Host Management & Authorization Rules
Host CRUD endpoints (`POST/PUT/DELETE /api/listings`) were added next.
- **Ownership Verification**: Every update or delete request checks `X-User-Id`. If `user.id != listing.host_id`, the API immediately aborts with `HTTP 403 Forbidden`.

### 5. Idempotent & Deterministic Database Seeding
To ensure consistent demo behavior, `app/seed/seed.py` was built with `random.seed(42)` and deterministic fixture datasets.
- **Why**: VM restarts, environment redeployments, or disk resets shouldn't result in a blank application. On startup, FastAPI checks table counts; if empty, it populates properties across global and Indian destinations, active host accounts, and review histories automatically.

### 6. Independent Backend Deployment & Verification
Before writing frontend code, the backend was deployed to an Azure Linux VM with Nginx and Uvicorn.
- **Verification**: All API endpoints were thoroughly tested via FastAPI's interactive `/docs` Swagger UI and automated Pytest scripts. This ensured the API contract was solid before frontend integration began.

### 7. Frontend Integration Sequence
The Next.js App Router frontend was built systematically:
1. **Scaffold & Design System**: Configured Tailwind CSS v4 and defined global CSS variables (`globals.css`).
2. **API Client Layer**: Built `lib/api.ts` as a unified fetch wrapper to automatically inject `X-User-Id` headers and unwrap backend error responses.
3. **App Shell**: Created `RootLayout` with persistent header navigation (`NavBar`), footer (`Footer`), and global React contexts (`UserContext`, `WishlistContext`, `ToastContext`).
4. **Search & Discovery**: Implemented `/search` with URL parameter binding for location, guest counts, price sliders, and category filters.
5. **Listing Detail Page**: Built `/listing/[id]` with photo galleries, amenity grids, host details, and the interactive `BookingWidget`.
6. **Checkout & Reservation Flow**: Implemented `/checkout` to request real-time price quotes (`POST /api/bookings/quote`) and post booking creations (`POST /api/bookings`), handling `409 Conflict` errors by displaying toast notifications.
7. **Trips & Wishlists**: Added `/trips` for guests to review/cancel upcoming stays and `/wishlist` to view saved properties.
8. **Host Dashboard**: Built `/host` allowing host users to manage listings, view earnings, and trigger modal editors.

### 8. Later Incremental Enhancements
- **HTTPS & SSL Setup**: When the frontend was deployed to Vercel (HTTPS), browsers blocked requests to the backend HTTP IP address due to mixed-content security policies. Fixed by configuring Let's Encrypt SSL via Certbot and `sslip.io` wildcard DNS on the Azure VM.
- **Multi-Currency Support**: Added real-time currency conversion (USD, EUR, GBP, INR) across property listings.
- **Indian-Region Listings**: Expanded seed data with curated properties in Goa, Jaipur, Bengaluru, and Mumbai.
- **Token-Based Dark Mode**: Implemented complete theme toggling using CSS custom properties with zero FOUC (flash of unstyled content) via an inline head script.
- **Post-Stay Review System**: Built star-rating modals on completed trips, syncing back to the backend.

---

## Part 3 — Key Design Decisions to Be Ready to Defend

In technical interviews, interviewers evaluate senior engineering judgment by probing design choices. Use this **Decision → Why → Trade-off** matrix to defend architectural decisions confidently.

### 1. SQLite instead of Postgres / Managed Database
- **Decision**: Used SQLite for data persistence rather than a managed cloud PostgreSQL instance.
- **Why**: Eliminates external database infrastructure dependencies, reduces setup friction, cuts monthly cloud costs to $0, and allows instant automated database re-seeding on application boot.
- **Trade-off Acknowledged**: SQLite uses database-level locking for write operations, which restricts high-concurrency throughput under heavy write loads. For a production scale-out app with millions of concurrent users, PostgreSQL would be required.

### 2. Mock `X-User-Id` Header Auth instead of Real Authentication
- **Decision**: Implemented identity passing via a custom HTTP request header rather than full JWT / OAuth2 authentication.
- **Why**: Optimized specifically for evaluator experience. Allows reviewers to instantly switch between "Guest" and "Host" personas in 1 click without filling out login forms or registering test accounts.
- **Trade-off Acknowledged**: Insecure for public production without an API gateway or token verification middleware, as headers can easily be forged by clients.

### 3. Price Snapshotting on Booking Rows
- **Decision**: Copied the current nightly rate and fee calculations directly onto the `Booking` database record at creation time.
- **Why**: Guarantees immutable historical financial records. Host price updates or site-wide fee changes will never retroactively alter past receipts or confirmed reservations.
- **Trade-off Acknowledged**: Introduces minor data redundancy across database tables.

### 4. Server-Side-Only Date Overlap Enforcement (HTTP 409)
- **Decision**: Enforced booking date conflict validation strictly on the server inside an atomic SQL query rather than relying on client-side state.
- **Why**: Client-side calendar disabling is vulnerable to stale UI states and race conditions when multiple users attempt to book the exact same dates simultaneously.
- **Trade-off Acknowledged**: Requires the frontend client to handle `HTTP 409 Conflict` gracefully (e.g. displaying toast warnings) if an optimistic reservation attempt fails.

### 5. Systemd + Nginx on Azure VM instead of Docker Containers
- **Decision**: Deployed the FastAPI application directly on an Azure Linux VM managed by Systemd and proxied by Nginx, rather than containerizing with Docker/Kubernetes.
- **Why**: Minimized resource consumption on a modest Azure VM slice while taking advantage of OS-level process management (Systemd auto-restart) and native Nginx reverse proxy performance.
- **Trade-off Acknowledged**: Slightly less environment portability between local development (Windows/macOS) and the production server environment compared to a Docker container container image.

### 6. SQLite File Persistence Risk & Auto-Seed Mitigation
- **Decision**: Configured `seed.py` to run automatically on application startup whenever table row counts equal zero.
- **Why**: Virtual machine ephemeral disk wipes or deployment pipeline redeployments could cause data loss. Auto-seeding ensures the demo application is self-healing and always functional.
- **Trade-off Acknowledged**: User-created listings or test bookings made during a demo session will be reset if the database file is deleted.

### 7. Client-Side City Grouping for Carousel UI
- **Decision**: Filtered and grouped property listings by city on the frontend client rather than creating a specialized `/api/listings/by-city` backend endpoint.
- **Why**: The total listing seed dataset (<100 listings) is compact enough to transfer in a single light JSON payload. Processing groupings on the client eliminates redundant API calls and makes UI tab switching instantaneous.
- **Trade-off Acknowledged**: If the property database expands to tens of thousands of listings, client-side grouping becomes inefficient and must be replaced with server-side pagination and SQL `GROUP BY` aggregations.

### 8. Centralized CSS Custom Properties (Tokens) for Dark Mode
- **Decision**: Implemented dark mode styling via global CSS custom properties mapped through Tailwind `@theme inline` rather than applying hardcoded `dark:` class variants on every component.
- **Why**: Updating 15 key color tokens under `:root` and `[data-theme="dark"]` dynamically re-themes all 35+ React components without modifying individual files or duplicating CSS bundle size.
- **Trade-off Acknowledged**: Requires strict developer discipline to use custom theme classes (e.g. `bg-bg`, `text-text-primary`) instead of standard Tailwind color utilities (`bg-white`, `text-gray-900`).
