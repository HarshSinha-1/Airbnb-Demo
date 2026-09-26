export type Envelope<T> = {
  data: T | null;
  error: string | null;
};

export type User = {
  id: number;
  name: string;
  email: string;
  avatar_url: string;
  is_host: boolean;
  is_superhost: boolean;
  created_at: string;
};

export type HostSummary = {
  id: number;
  name: string;
  avatar_url: string;
  is_superhost: boolean;
};

export type ListingCard = {
  id: number;
  title: string;
  property_type: string;
  category: string;
  city: string;
  country: string;
  price_per_night: number;
  cover_image: string | null;
  average_rating: number | null;
  review_count: number;
};

export type HostListingCard = ListingCard & {
  booking_count: number;
};

export type ListingImage = {
  id: number;
  url: string;
  position: number;
};

export type Amenity = {
  id: number;
  name: string;
  icon: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
};

export type ReviewSummary = {
  average_rating: number;
  review_count: number;
};

export type ListingDetail = {
  id: number;
  host: HostSummary;
  title: string;
  description: string;
  property_type: string;
  category: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  price_per_night: number;
  cleaning_fee: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  images: ListingImage[];
  amenities: Amenity[];
  review_summary: ReviewSummary;
};

export type PaginatedListings = {
  items: ListingCard[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type ListingFilters = {
  location?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  min_price?: number;
  max_price?: number;
  property_type?: string;
  category?: string;
  amenities?: number[];
  page?: number;
  page_size?: number;
};

export type AvailabilityRange = {
  check_in: string;
  check_out: string;
};

export type PriceQuote = {
  nightly_price: number;
  nights: number;
  subtotal: number;
  cleaning_fee: number;
  service_fee: number;
  total: number;
};

export type BookingCreate = {
  listing_id: number;
  check_in: string;
  check_out: string;
  guests: number;
};

export type Booking = {
  id: number;
  listing_id: number;
  guest_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  nightly_price: number;
  nights: number;
  cleaning_fee: number;
  service_fee: number;
  total_price: number;
  status: string;
  created_at: string;
  listing_title?: string;
  listing_city?: string;
  listing_country?: string;
  listing_cover_image?: string | null;
  guest_name?: string;
};

export type Review = {
  id: number;
  listing_id: number;
  author: HostSummary;
  booking_id: number;
  rating: number;
  comment: string;
  created_at: string;
};

export type ReviewCreate = {
  booking_id: number;
  rating: number;
  comment: string;
};

export type WishlistItem = {
  listing_id: number;
  created_at: string;
  listing: ListingCard;
};

export type ListingCreate = {
  title: string;
  description: string;
  property_type: string;
  category?: string;
  city: string;
  country: string;
  lat?: number;
  lng?: number;
  price_per_night: number;
  cleaning_fee?: number;
  max_guests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  image_urls?: string[];
  amenity_ids?: number[];
};

export type ListingUpdate = {
  title?: string | null;
  description?: string | null;
  property_type?: string | null;
  category?: string | null;
  city?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
  price_per_night?: number | null;
  cleaning_fee?: number | null;
  max_guests?: number | null;
  bedrooms?: number | null;
  beds?: number | null;
  bathrooms?: number | null;
  image_urls?: string[] | null;
  amenity_ids?: number[] | null;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}
