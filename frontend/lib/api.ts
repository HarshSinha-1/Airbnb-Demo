import { USER_ID_STORAGE_KEY } from "./constants";
import { ApiError, type Amenity, type AvailabilityRange, type Booking, type BookingCreate, type Category, type Envelope, type HostListingCard, type ListingCreate, type ListingDetail, type ListingFilters, type ListingUpdate, type PaginatedListings, type PriceQuote, type Review, type ReviewCreate, type User, type WishlistItem } from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://20-2-88-158.sslip.io";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200",
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
  "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200",
  "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200",
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
  "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200",
  "https://images.unsplash.com/photo-1527030280862-64139fba04bc?w=1200",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200",
  "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1200",
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200",
  "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200",
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200",
];

export function getStoredUserId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_ID_STORAGE_KEY);
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export function setStoredUserId(id: number | null) {
  if (typeof window === "undefined") return;
  if (id == null) window.localStorage.removeItem(USER_ID_STORAGE_KEY);
  else window.localStorage.setItem(USER_ID_STORAGE_KEY, String(id));
}

function unwrap<T>(envelope: Envelope<T>, status: number): T {
  if (envelope.error) {
    throw new ApiError(envelope.error, status, envelope);
  }
  if (envelope.data == null) {
    throw new ApiError("Empty response from server", status, envelope);
  }
  return envelope.data;
}

function errorMessageFromBody(body: unknown, fallback: string) {
  if (body && typeof body === "object") {
    const rec = body as Record<string, unknown>;
    if (typeof rec.error === "string" && rec.error) return rec.error;
    if (typeof rec.detail === "string" && rec.detail) return rec.detail;
    if (Array.isArray(rec.detail) && rec.detail[0] && typeof rec.detail[0] === "object") {
      const first = rec.detail[0] as { msg?: string };
      if (first.msg) return first.msg;
    }
  }
  return fallback;
}

async function request<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (init.auth !== false) {
    const userId = getStoredUserId();
    if (userId != null) headers.set("X-User-Id", String(userId));
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Unable to reach the Airbnb API. Check your connection.", 0);
  }

  let body: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    const message =
      response.status === 409
        ? errorMessageFromBody(body, "Those dates are no longer available. Choose different dates.")
        : response.status === 403
          ? errorMessageFromBody(body, "You don't have permission to do that.")
          : errorMessageFromBody(body, `Request failed (${response.status})`);
    throw new ApiError(message, response.status, body);
  }

  if (body && typeof body === "object" && ("data" in body || "error" in body)) {
    return unwrap(body as Envelope<T>, response.status);
  }

  return body as T;
}

function listingsQuery(filters: ListingFilters = {}) {
  const params = new URLSearchParams();
  if (filters.location) params.set("location", filters.location);
  if (filters.check_in) params.set("check_in", filters.check_in);
  if (filters.check_out) params.set("check_out", filters.check_out);
  if (filters.guests) params.set("guests", String(filters.guests));
  if (filters.min_price != null) params.set("min_price", String(filters.min_price));
  if (filters.max_price != null) params.set("max_price", String(filters.max_price));
  if (filters.property_type) params.set("property_type", filters.property_type);
  if (filters.category) params.set("category", filters.category);
  for (const id of filters.amenities ?? []) params.append("amenities", String(id));
  params.set("page", String(filters.page ?? 1));
  if (filters.page_size) params.set("page_size", String(filters.page_size));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  getUsers: () => request<User[]>("/api/users", { auth: false }),
  getMe: () => request<User>("/api/users/me"),
  becomeHost: () => request<User>("/api/users/become-host", { method: "POST" }),

  getListings: (filters: ListingFilters = {}) =>
    request<PaginatedListings>(`/api/listings${listingsQuery(filters)}`, { auth: false }).then((res) => ({
      ...res,
      items: res.items.map((item) => ({
        ...item,
        cover_image: FALLBACK_IMAGES[item.id % FALLBACK_IMAGES.length],
      })),
    })),
  getListing: (id: number) =>
    request<ListingDetail>(`/api/listings/${id}`, { auth: false }).then((res) => ({
      ...res,
      images: res.images.map((img, i) => ({
        ...img,
        url: FALLBACK_IMAGES[(res.id + i) % FALLBACK_IMAGES.length],
      })),
    })),
  getAvailability: (id: number) =>
    request<AvailabilityRange[]>(`/api/listings/${id}/availability`, { auth: false }),
  getPriceQuote: (id: number, checkIn: string, checkOut: string, guests = 1) =>
    request<PriceQuote>(
      `/api/listings/${id}/price-quote?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`,
      { auth: false },
    ),
  getReviews: (id: number) =>
    request<Review[]>(`/api/listings/${id}/reviews`, { auth: false }),
  createReview: (payload: ReviewCreate) =>
    request<Review>("/api/reviews", { method: "POST", body: JSON.stringify(payload) }),

  createListing: (payload: ListingCreate) =>
    request<ListingDetail>("/api/listings", { method: "POST", body: JSON.stringify(payload) }),
  updateListing: (id: number, payload: ListingUpdate) =>
    request<ListingDetail>(`/api/listings/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteListing: (id: number) =>
    request<unknown>(`/api/listings/${id}`, { method: "DELETE" }),

  createBooking: (payload: BookingCreate) =>
    request<Booking>("/api/bookings", { method: "POST", body: JSON.stringify(payload) }),
  getMyBookings: () => request<Booking[]>("/api/bookings/mine"),
  cancelBooking: (id: number) =>
    request<unknown>(`/api/bookings/${id}`, { method: "DELETE" }),

  getHostListings: () => request<HostListingCard[]>("/api/host/listings").then((res) => res.map((item) => ({
    ...item,
    cover_image: FALLBACK_IMAGES[item.id % FALLBACK_IMAGES.length],
  }))),
  getHostBookings: () => request<Booking[]>("/api/host/bookings"),

  getWishlist: () => request<WishlistItem[]>("/api/wishlist").then((res) => res.map((item) => ({
    ...item,
    listing: {
      ...item.listing,
      cover_image: FALLBACK_IMAGES[item.listing.id % FALLBACK_IMAGES.length],
    },
  }))),
  addToWishlist: (listingId: number) =>
    request<WishlistItem>(`/api/wishlist/${listingId}`, { method: "POST" }),
  removeFromWishlist: (listingId: number) =>
    request<unknown>(`/api/wishlist/${listingId}`, { method: "DELETE" }),

  getCategories: () => request<Category[]>("/api/meta/categories", { auth: false }),
  getAmenities: () => request<Amenity[]>("/api/meta/amenities", { auth: false }),
};

export { BASE_URL };
