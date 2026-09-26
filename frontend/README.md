# Airbnb Clone - Frontend

This is a Next.js (App Router) based frontend for the Airbnb clone project.

## Current Progress

All core pages and features have been implemented based on the requirements:

- **Scaffolding & Setup**: Next.js App Router, Tailwind CSS, project structure (`app`, `components`, `context`, `lib`) - **DONE**
- **API Client**: Implemented `lib/api.ts` with `X-User-Id` injection, error handling, envelope unwrapping - **DONE**
- **Type Definitions**: Synced `lib/types.ts` with backend Pydantic schemas - **DONE**
- **Home & Search**: 
  - Listing Explorer with Categories (`app/page.tsx`) - **DONE**
  - Search Filters & Query State (`app/search/page.tsx`) - **DONE**
- **Listing Details**: 
  - Dynamic `[id]` route with photo gallery, amenities, and host info - **DONE**
  - Price Quoting & Availability Calendar - **DONE**
  - Review Summary and List - **DONE**
- **Booking Flow**:
  - Reservation Card & Checkout (`app/checkout/page.tsx`) - **DONE**
  - Explicit handling of `409 Conflict` (double-booking) - **DONE**
- **Guest Dashboard**:
  - Trips (`app/trips/page.tsx`) - **DONE**
  - Wishlist (`app/wishlist/page.tsx`) - **DONE**
- **Host Dashboard**:
  - Host summary and listing management (`app/host/page.tsx`) - **DONE**
  - Listing create/edit forms (`app/host/listings/new`, `app/host/listings/[id]/edit`) - **DONE**

## Next Steps / Left to Build

Currently, the primary development phase (Steps 1 to 8) is fully completed. The application needs to undergo **Step 9**:
- **QA / Pass**: Start the local server, run manual end-to-end testing by clicking through every page as at least two different mock users (a guest and a host).
- Ensure nothing shows stale, hardcoded, or empty-by-mistake data.
- Confirm all states (loading, error, empty) render correctly.
- Add the production frontend URL to the backend's `CORS_ORIGINS` when deploying.
- (Optional) Expand backend seed data if needed for richer demos.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
