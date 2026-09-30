# Frontend File-by-File Breakdown

This document provides a comprehensive walkthrough of the Next.js App Router frontend codebase (`frontend/`), explaining the purpose, key functions, design rationale, and exact dependencies for every file.

---

## 1. App Layout & Root Structure

### `frontend/app/layout.tsx`
- **Purpose**: Root layout component wrapping every page in the Next.js App Router application.
- **Key Functions/Classes**:
  - `RootLayout({ children })`: Configures the Inter font variable, base HTML document structure, inline anti-FOUC theme initialization script, and global Context Providers (`UserProvider`, `WishlistProvider`, `ToastProvider`). Renders the persistent site-wide `NavBar` header and `Footer`.
  - **Design Rationale**: Context providers and theme persistence scripts live at the absolute root of the component tree so user authentication context (Guest vs Host active persona), saved wishlist state, active toast alerts, and dark mode preferences persist smoothly across client-side page transitions without page reloads.
- **Dependencies**:
  - **Imports from**: `app/globals.css`, `@/components/nav/NavBar`, `@/components/nav/Footer`, `@/context/UserContext`, `@/context/WishlistContext`, `@/context/ToastContext`.
  - **Imported by**: Next.js App Router root layout engine.

### `frontend/app/globals.css`
- **Purpose**: Global CSS stylesheet defining CSS custom properties (tokens), Tailwind CSS v4 `@theme inline` configuration, and root theme selectors.
- **Key Tokens & Design Rationale**:
  - Defines semantic CSS variables (`--bg`, `--surface-soft`, `--surface-raised`, `--border-default`, `--text-primary`, `--text-secondary`, `--rausch`) under `:root` for light mode and overrides them under `[data-theme="dark"]` for dark mode.
  - `@theme inline` block maps Tailwind color utility classes (`bg-bg`, `text-text-primary`, `border-border-default`, `bg-rausch`) directly to these variable tokens.
  - **Design Rationale**: Token-based CSS custom properties allow instant, flicker-free dark mode toggling site-wide by toggling a single data attribute on `<html>`, avoiding duplicate component edits or utility class clutter.
- **Dependencies**:
  - **Imported by**: `app/layout.tsx`.

### `frontend/app/page.tsx`
- **Purpose**: Root application page (`/`).
- **Key Functions/Classes**:
  - `HomePage()`: Executes an immediate client-side redirect (`redirect('/search')`) to the search discovery page.
  - **Design Rationale**: Centralizes property discovery and feed management on `/search` to avoid code duplication between root and search paths.
- **Dependencies**:
  - **Imports from**: `next/navigation` (`redirect`).

---

## 2. Page Routes (`frontend/app/`)

### `frontend/app/search/page.tsx`
- **Purpose**: Main property discovery feed page with category filtering, search parameters, price sliders, and property cards.
- **Key Functions/Classes**:
  - `SearchPage()`: Reads search parameters from the URL (`location`, `category`, `guests`, `min_price`, `max_price`), fetches listings using `api.getListings()`, controls `FilterModal` visibility, and renders the responsive `ListingGrid`.
  - **Design Rationale**: Search state is synchronized directly with URL query parameters so filtered search results are fully shareable, bookmarkable, and refresh-safe.
- **Dependencies**:
  - **Imports from**: `@/lib/api`, `@/lib/types`, `@/components/nav/CategoryBar`, `@/components/listing/ListingGrid`, `@/components/listing/FilterModal`.

### `frontend/app/listing/[id]/page.tsx`
- **Purpose**: Detailed listing page displaying property photos, specs, amenities, host bio, review breakdowns, and interactive booking widget.
- **Key Functions/Classes**:
  - `ListingDetailPage()`: Reads dynamic route param `id`, fetches property details via `api.getListing()`, blocked dates via `api.getListingAvailability()`, and reviews via `api.getListingReviews()`. Passes state down to `PhotoGallery`, `ListingHeader`, `BookingWidget`, and `ListingReviews`.
  - **Design Rationale**: Performs date arithmetic and real-time backend price quotes on the client inside `BookingWidget`, providing immediate feedback on fees and totals before the user proceeds to checkout.
- **Dependencies**:
  - **Imports from**: `@/lib/api`, `@/components/listing/ListingHeader`, `@/components/listing/PhotoGallery`, `@/components/booking/BookingWidget`, `@/components/listing/ListingReviews`.

### `frontend/app/checkout/page.tsx`
- **Purpose**: Reservation checkout and payment review page.
- **Key Functions/Classes**:
  - `CheckoutPage()`: Parses query params (`listing_id`, `check_in`, `check_out`, `guests`), requests a price quote from `api.getPriceQuote()`, collects guest payment info, and calls `api.createBooking()`. Handles `409 Conflict` errors by displaying toast notifications if the dates were booked concurrently.
  - **Design Rationale**: Re-fetches the price breakdown from the backend on mount to guarantee that client-side date tampering or clock drift can never submit an invalid reservation total.
- **Dependencies**:
  - **Imports from**: `@/lib/api`, `@/context/UserContext`, `@/context/ToastContext`, `next/navigation`.

### `frontend/app/booked/page.tsx`
- **Purpose**: Post-checkout reservation receipt confirmation view.
- **Key Functions/Classes**:
  - `BookedPage()`: Displays reservation details, confirmation ID, check-in instructions, and host contact information immediately following a successful booking creation.
- **Dependencies**:
  - **Imports from**: `@/lib/api`, `next/navigation`.

### `frontend/app/trips/page.tsx`
- **Purpose**: Guest reservations dashboard showing upcoming and past trips.
- **Key Functions/Classes**:
  - `TripsPage()`: Queries guest reservations via `api.getUserBookings()`, handles trip cancellation (`api.cancelBooking()`), and launches `ReviewModal` for completed stays.
  - **Design Rationale**: Automatically re-fetches user trips whenever `currentUser` switches in `UserContext`.
- **Dependencies**:
  - **Imports from**: `@/lib/api`, `@/context/UserContext`, `@/components/booking/BookingCard`, `@/components/review/ReviewModal`.

### `frontend/app/wishlist/page.tsx`
- **Purpose**: Saved properties grid page.
- **Key Functions/Classes**:
  - `WishlistPage()`: Consumes `WishlistContext` to retrieve saved listing IDs and fetches full property details via `api.getWishlist()`, rendering items in a `ListingGrid`.
- **Dependencies**:
  - **Imports from**: `@/context/WishlistContext`, `@/lib/api`, `@/components/listing/ListingGrid`.

### `frontend/app/host/page.tsx`
- **Purpose**: Main Host Dashboard managing properties and viewing reservation activity.
- **Key Functions/Classes**:
  - `HostDashboardPage()`: Fetches host listings via `api.getHostListings()` and host reservations via `api.getHostBookings()`. Displays occupancy metrics, earnings totals, and triggers `ListingFormModal` for creating/editing properties.
- **Dependencies**:
  - **Imports from**: `@/lib/api`, `@/context/UserContext`, `@/components/host/HostListingsTable`, `@/components/host/ListingFormModal`.

### `frontend/app/host/listings/new/page.tsx` & `[id]/edit/page.tsx`
- **Purpose**: Dedicated standalone page forms for creating new properties or editing existing listings.
- **Dependencies**: `@/lib/api`, `@/context/UserContext`, `@/components/host/ListingFormModal`.

### `frontend/app/coming-soon/page.tsx`, `experiences/page.tsx`, `services/page.tsx`
- **Purpose**: Secondary placeholder landing pages for expanded Airbnb features.

---

## 3. UI & Feature Components (`frontend/components/`)

### Navigation (`components/nav/`)
- **`NavBar.tsx`**: Top navigation header bar featuring Airbnb brand logo, interactive `SearchBar` toggle, Host Mode switch, `ThemeToggle` button, and `UserSwitcher` persona menu.
- **`SearchBar.tsx`**: Compact search widget opening inline popovers to set destination location, trip dates, and guest counts.
- **`CategoryBar.tsx`**: Horizontally scrollable icon pill bar for filtering property categories (Cabins, Mansions, Beachfront, Islands, etc.).
- **`UserSwitcher.tsx`**: Dropdown component enabling 1-click persona switching between demo users (Guest vs Host) without login forms.
- **`Footer.tsx`**: Site-wide footer rendering currency select, localization settings, support links, and copyright notices.

### Listing (`components/listing/`)
- **`ListingCard.tsx`**: Property item card featuring image carousel, city/country location, average rating, nightly rate, and heart icon for toggling wishlist state.
- **`ListingGrid.tsx`**: Responsive grid container laying out listing cards across viewport widths.
- **`CategoryFilter.tsx`**: Helper pill filter for listing categories.
- **`FilterModal.tsx`**: Slide-over modal providing multi-faceted search controls (price range sliders, room/bed counters, property type selections, and amenity checkboxes).
- **`ListingHeader.tsx`**: Title header on detail pages with rating summaries, share actions, and wishlist buttons.
- **`PhotoGallery.tsx`**: 5-image collage photo gallery with a "Show all photos" lightbox trigger.
- **`ListingPhotosModal.tsx`**: Fullscreen scrollable lightbox modal rendering all listing images.
- **`ListingReviews.tsx`**: Review section displaying overall star ratings, rating breakdowns (Cleanliness, Accuracy, Communication, Location, Value), and guest comments.

### Booking (`components/booking/`)
- **`BookingWidget.tsx`**: Sticky pricing widget on detail pages. Dynamically queries `api.getPriceQuote()` when dates change and navigates to checkout.
- **`BookingCard.tsx`**: Reservation card used on `/trips` displaying status badges (Confirmed, Cancelled, Completed), date ranges, host info, and cancellation triggers.
- **`PriceBreakdownModal.tsx`**: Modal popup rendering itemized fee breakdowns (Nightly rate × nights, cleaning fee, service fee, host discounts, taxes).

### Review & Host (`components/review/` & `components/host/`)
- **`ReviewModal.tsx`**: Dialog modal enabling guests to submit star ratings (1-5) and written feedback (`api.createReview()`) for completed trips.
- **`ReviewStars.tsx`**: Reusable SVG star rating component rendering filled, half-filled, and empty stars.
- **`HostListingsTable.tsx`**: Management table for hosts to review property status, edit rates, or delete listings.
- **`ListingFormModal.tsx`**: Form modal for creating or updating listings directly on the host dashboard.

### Core UI Controls (`components/ui/`)
- **`Button.tsx`**: Standardized button component with primary brand gradients (`bg-rausch`), secondary outlines, and dark-mode tokens.
- **`Modal.tsx`**: Accessible dialog component with backdrop click dismissal, ESC key listener, and body scroll lock.
- **`Pill.tsx`**: Filter selection pill component.
- **`Icons.tsx`**: SVG icon library (Logo, Search, Globe, Star, Heart, Sun, Moon, Shield, Amenity icons).
- **`ThemeToggle.tsx`**: Button toggling light/dark mode by modifying `document.documentElement.dataset.theme` and storing preference in `localStorage`.

---

## 4. Utilities, Types, and API (`frontend/lib/`)

### `frontend/lib/api.ts`
- **Purpose**: Centralized HTTP fetch wrapper for all backend API communications.
- **Key Functions/Classes**:
  - `fetchAPI<T>(endpoint, options)`: Reads active user ID from `UserContext`/`localStorage`, injects `X-User-Id` request header, handles base API URL resolution, and parses error envelopes (`{ detail: string }`).
  - Methods: `getListings()`, `getListing()`, `getPriceQuote()`, `createBooking()`, `getUserBookings()`, `cancelBooking()`, `createReview()`, `createListing()`, `updateListing()`, `deleteListing()`.
  - **Design Rationale**: Keeps fetch logic, authorization header injection, and error handling in one single file so components use clean, strongly-typed API methods.

### `frontend/lib/types.ts`
- **Purpose**: Central TypeScript interface definitions (`Listing`, `Booking`, `Review`, `User`, `PriceQuote`, `SearchFilters`).

### `frontend/lib/formatPrice.ts` & `format.ts`
- **Purpose**: Currency formatting (`Intl.NumberFormat`) supporting multi-currency conversion (USD, EUR, GBP, INR) and date range formatting.

### `frontend/lib/constants.ts`
- **Purpose**: Application constants including category lists, amenity catalogues, and default search presets.

---

## 5. React Context State (`frontend/context/`)

### `frontend/context/UserContext.tsx`
- **Purpose**: Manages active user identity state globally.
- **Key Functions/Classes**:
  - `UserProvider`: Stores `currentUser` ID and profile object in React state and `localStorage`. Exposes `switchUser(userId)` allowing 1-click persona switching across the app.

### `frontend/context/WishlistContext.tsx`
- **Purpose**: Manages saved property IDs globally.
- **Key Functions/Classes**:
  - `WishlistProvider`: Exposes `wishlistIds`, `toggleWishlist(listingId)`, and `isWishlisted(listingId)`, persisting choices across reloads via `localStorage`.

### `frontend/context/ToastContext.tsx`
- **Purpose**: Manages global toast notification banners.
- **Key Functions/Classes**:
  - `ToastProvider`: Renders floating toast notifications at the bottom of the screen upon calling `showToast(message, type)`. Fully styled using CSS variables (`bg-surface-raised`, `text-bg`) for automatic light/dark mode adaptation.

---

## 6. End-to-End Request Trace: Booking Creation Flow

Below is the step-by-step trace of a representative user action: **Reserving a Property**.

1. **User Action**: The user selects check-in/checkout dates on `frontend/app/listing/[id]/page.tsx` inside `BookingWidget` and clicks **Reserve**.
2. **Client Navigation**: `BookingWidget` routes the browser to `/checkout?listing_id=12&check_in=2026-10-01&check_out=2026-10-05&guests=2`.
3. **Price Quote Request**: Upon mounting, `frontend/app/checkout/page.tsx` calls `api.getPriceQuote({ listing_id: 12, check_in: "...", check_out: "...", guests: 2 })`.
4. **API Header Injection**: `lib/api.ts` adds header `X-User-Id: <active_user_id>` from `UserContext` and issues a `POST /api/bookings/quote` request to FastAPI.
5. **Form Submission**: The user completes payment details and clicks **Confirm and Pay**. `checkout/page.tsx` calls `api.createBooking(...)`.
6. **State & Notification**: `api.createBooking` posts to `/api/bookings`. On HTTP 201 response, `ToastContext` triggers `showToast("Booking confirmed!", "success")`, and the router redirects the user to `/booked?booking_id=99` or `/trips`.
