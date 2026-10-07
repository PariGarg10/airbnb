export type PropertyType =
  | "house"
  | "apartment"
  | "villa"
  | "cabin"
  | "guesthouse"
  | "hotel"
  | "cottage"
  | "tiny_home"
  | "treehouse"
  | "castle";

export type RoomType = "entire_place" | "private_room" | "shared_room";

export type OccupantType = "me" | "family" | "other_guests" | "flatmates";

export type BookingMode = "instant" | "approve_first_5";

export type BookingStatus = "confirmed" | "cancelled";

export type HostBookingStatus = "upcoming" | "current" | "completed" | "cancelled";

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  is_host: boolean;
  is_superhost: boolean;
}

export interface ListingCard {
  id: number;
  title: string;
  city: string;
  country: string;
  property_type: PropertyType;
  room_type: RoomType;
  price_per_night: number;
  avg_rating: number;
  review_count: number;
  bedrooms: number;
  beds: number;
  nights?: number | null;
  stay_total?: number | null;
  stay_original_total?: number | null;
  images: string[];
  lat: number;
  lng: number;
  host_is_superhost: boolean;
  is_wishlisted: boolean;
}

export interface WishlistSummary {
  id: number;
  name: string;
  count: number;
  cover_images: string[];
  listing_ids: number[];
}

export interface SavedListingIds {
  listing_ids: number[];
}

export interface ListingImage {
  id: number;
  url: string;
  caption?: string | null;
  position: number;
}

export interface Amenity {
  id: number;
  name: string;
  icon: string;
  group_name: string;
}

export interface Host {
  id: number;
  name: string;
  avatar_url: string | null;
  is_superhost: boolean;
  bio: string | null;
  joined_year: number;
  listing_count: number;
}

export interface ListingDetail {
  id: number;
  title: string;
  description: string;
  property_type: PropertyType;
  room_type: RoomType;
  category: string;
  address: string | null;
  city: string;
  state: string | null;
  country: string;
  lat: number;
  lng: number;
  location_is_approximate: boolean;
  price_per_night: number;
  cleaning_fee: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  private_bathrooms: number;
  dedicated_bathrooms: number;
  shared_bathrooms: number;
  avg_rating: number;
  review_count: number;
  booking_mode: BookingMode;
  instant_book: boolean;
  show_precise_location: boolean;
  bedrooms_have_locks: boolean | null;
  weekend_adjustment_pct: number;
  discount_new_listing_pct: number;
  discount_last_minute_pct: number;
  discount_weekly_pct: number;
  discount_monthly_pct: number;
  has_exterior_camera: boolean;
  has_noise_monitor: boolean;
  has_weapons: boolean;
  allows_pets: boolean;
  occupants: OccupantType[];
  images: ListingImage[];
  amenities: Amenity[];
  host: Host;
  is_wishlisted: boolean;
}

export interface ListingImageInput {
  url: string;
  caption?: string | null;
}

export interface ListingInput {
  title: string;
  description: string;
  property_type: PropertyType;
  room_type: RoomType;
  category: string;
  address: string;
  city: string;
  state?: string | null;
  country: string;
  lat: number;
  lng: number;
  price_per_night: number;
  cleaning_fee: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  private_bathrooms: number;
  dedicated_bathrooms: number;
  shared_bathrooms: number;
  images: ListingImageInput[];
  amenity_ids: number[];
  booking_mode?: BookingMode;
  show_precise_location?: boolean;
  bedrooms_have_locks?: boolean | null;
  weekend_adjustment_pct?: number;
  discount_new_listing_pct?: number;
  discount_last_minute_pct?: number;
  discount_weekly_pct?: number;
  discount_monthly_pct?: number;
  has_exterior_camera?: boolean;
  has_noise_monitor?: boolean;
  has_weapons?: boolean;
  allows_pets?: boolean;
  occupants?: OccupantType[];
}

export interface ListingSearchParams {
  location?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  min_price?: number;
  max_price?: number;
  property_types?: PropertyType[];
  room_type?: RoomType;
  amenities?: number[];
  category?: string;
  min_bedrooms?: number;
  min_beds?: number;
  min_bathrooms?: number;
  min_rating?: number;
  instant_book?: boolean;
  allows_pets?: boolean;
  page?: number;
  page_size?: number;
}

export interface BookedRange {
  check_in: string;
  check_out: string;
}

export interface NightlyBreakdown {
  weekday_nights: number;
  weekend_nights: number;
  weekday_rate: number;
  weekend_rate: number;
  weekday_subtotal: number;
  weekend_subtotal: number;
}

export interface QuoteDiscount {
  type: string;
  pct: number;
  amount: number;
}

export interface Quote {
  nights: number;
  nightly_rate: number;
  nightly_breakdown: NightlyBreakdown;
  nights_total: number;
  discount: QuoteDiscount | null;
  cleaning_fee: number;
  service_fee: number;
  total: number;
  original_total: number;
}

export interface QuoteParams {
  check_in: string;
  check_out: string;
  guests: number;
}

export interface CategoryCount {
  category: string;
  listing_count: number;
}

export interface BookingListing {
  id: number;
  title: string;
  city: string;
  country: string;
  cover_image: string | null;
  host_name: string;
}

export interface Booking {
  id: number;
  listing_id: number;
  check_in: string;
  check_out: string;
  num_guests: number;
  nights: number;
  nightly_rate: number;
  cleaning_fee: number;
  service_fee: number;
  discount_type: string | null;
  discount_amount: number;
  original_total: number;
  total_price: number;
  status: BookingStatus;
  listing: BookingListing;
}

export interface BookingDetail extends Booking {
  guest_id: number;
  can_review: boolean;
}

export interface BookingCreate {
  listing_id: number;
  check_in: string;
  check_out: string;
  num_guests: number;
}

export interface MyBookings {
  upcoming: Booking[];
  past: Booking[];
  cancelled: Booking[];
}

export interface ReviewAuthor {
  name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  author: ReviewAuthor;
}

export interface ReviewPage extends Paginated<Review> {
  rating_distribution: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
}

export interface ReviewCreate {
  rating: number;
  comment: string;
}

export interface HostListing {
  id: number;
  title: string;
  city: string;
  country: string;
  cover_image: string | null;
  price: number;
  avg_rating: number;
  is_active: boolean;
  total_bookings: number;
  upcoming_bookings: number;
}

export interface ListingStatusUpdate {
  is_active: boolean;
}

export interface ListingDeleteResult {
  deleted: "soft" | "hard";
}

export interface HostBookingGuest {
  name: string;
  avatar_url: string | null;
}

export interface HostBookingListing {
  id: number;
  title: string;
  cover_image: string | null;
}

export interface HostBooking {
  id: number;
  guest: HostBookingGuest;
  listing: HostBookingListing;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: BookingStatus;
}

export interface HostStats {
  total_listings: number;
  active_listings: number;
  upcoming_bookings: number;
  earnings_this_month: number;
}

export interface UploadResult {
  url: string;
}

export interface HostProfile {
  country: string;
  flat: string | null;
  street: string;
  landmark: string | null;
  district: string | null;
  city: string;
  state: string | null;
  pin_code: string;
  is_business: boolean;
  updated_at: string;
}

export interface HostProfileInput {
  country: string;
  flat?: string | null;
  street: string;
  landmark?: string | null;
  district?: string | null;
  city: string;
  state?: string | null;
  pin_code: string;
  is_business: boolean;
}
