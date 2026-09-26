export const USER_ID_STORAGE_KEY = "airbnb-x-user-id";

export const PAGE_SIZE = 12;

/** Display-only destination chips — values match seeded listing cities. */
export const DESTINATION_SUGGESTIONS = [
  { label: "Malibu, United States", query: "Malibu" },
  { label: "Paris, France", query: "Paris" },
  { label: "Kyoto, Japan", query: "Kyoto" },
  { label: "Aspen, United States", query: "Aspen" },
  { label: "Santorini, Greece", query: "Santorini" },
  { label: "Cape Town, South Africa", query: "Cape Town" },
];

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: "House",
  apartment: "Flat",
  room: "Room",
  villa: "Villa",
  cabin: "Cabin",
  tiny_home: "Tiny home",
  guesthouse: "Guest house",
  hotel: "Hotel",
};

export const SERVICE_FEE_COPY =
  "This helps us run our platform and offer services like 24/7 support on your trip.";

export const AMENITY_ICON_MAP: Record<string, string> = {
  wifi: "wifi",
  soup_kitchen: "kitchen",
  kitchen: "kitchen",
  pool: "pool",
  ac_unit: "ac",
  local_parking: "parking",
  hot_tub: "hottub",
  laptop: "workspace",
  ev_station: "ev",
  balcony: "balcony",
  water: "water",
  fitness_center: "gym",
  outdoor_grill: "bbq",
  waves: "beach",
  cabin: "cabin",
  villa: "mansion",
  whatshot: "trending",
  landscape: "views",
  home: "tiny",
  park: "country",
  architecture: "design",
  palmtree: "tropical",
  star: "icons",
  bed: "rooms",
};

export const FOOTER_COLUMNS = [
  {
    title: "Support",
    links: [
      "Help Centre",
      "AirCover",
      "Anti-discrimination",
      "Disability support",
      "Cancellation options",
      "Report neighbourhood concern",
    ],
  },
  {
    title: "Hosting",
    links: [
      "Airbnb your home",
      "Airbnb your experience",
      "Airbnb your service",
      "AirCover for Hosts",
      "Hosting resources",
      "Community forum",
      "Hosting responsibly",
      "Find a co-host",
    ],
  },
  {
    title: "Airbnb",
    links: [
      "Newsroom",
      "New features",
      "Careers",
      "Investors",
      "Airbnb.org emergency stays",
    ],
  },
];
