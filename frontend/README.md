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

## Recent Additions

- **Multi-currency price display**: All price-rendering spots (listing cards, detail page, price breakdown, checkout) use `lib/formatPrice.ts` with `Intl.NumberFormat` to show `₹` for INR listings and `$` for USD listings — no hardcoded symbols.
- **City-grouped carousels on the home page**: The top of the home page shows horizontal-scrolling carousel rows grouped by city (e.g. "Popular homes in Lucknow"), with left/right chevron nav and a "Guest favourite" badge on highly-rated listings. Fully additive — the existing search/filter grid is unchanged below.
- **Leave a review after a completed stay**: On My Trips, any booking whose check-out date has passed shows a "Leave a review" button. Clicking it opens a star-rating + comment modal that posts to `POST /api/reviews`. Duplicate-review attempts show a friendly message ("You've already reviewed this stay") instead of a raw error.

## Next Steps / Left to Build

All primary development phases are complete. Outstanding QA checklist:
- Start the local server, run manual end-to-end testing by clicking through every page as at least two different mock users (a guest and a host).
- Ensure nothing shows stale, hardcoded, or empty-by-mistake data.
- Confirm all states (loading, error, empty) render correctly.
- Add the production frontend URL to the backend's `CORS_ORIGINS` when deploying.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
