export type ExperienceCategory =
  | "shopping_fashion"
  | "food"
  | "art"
  | "nature"
  | "history"
  | "wellness";

export type ExperienceBookingStatus = "confirmed" | "cancelled";

export interface ExperienceCard {
  id: number;
  title: string;
  city: string;
  avg_rating: number;
  review_count: number;
  price_per_guest: number;
  cover_image: string | null;
  category: ExperienceCategory;
}

export interface ExperienceHost {
  name: string;
  avatar_url: string | null;
  bio: string | null;
  joined_year: number;
}

export interface ExperienceImage {
  url: string;
  position: number;
}

export interface ExperienceItineraryItem {
  position: number;
  title: string;
  description: string;
  image_url: string | null;
}

export interface ExperienceReviewAuthor {
  name: string;
  avatar_url: string | null;
}

export interface ExperienceReview {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  author: ExperienceReviewAuthor;
}

export interface ExperienceDetail {
  id: number;
  title: string;
  city: string;
  region: string;
  category: ExperienceCategory;
  description: string;
  duration_minutes: number;
  language: string;
  max_guests_per_slot: number;
  price_per_guest: number;
  private_price: number | null;
  whats_included: string | null;
  guest_requirements: number;
  activity_level: string | null;
  accessibility_note: string | null;
  meeting_point_name: string;
  meeting_point_address: string;
  lat: number;
  lng: number;
  cancellation_hours: number;
  avg_rating: number;
  review_count: number;
  images: ExperienceImage[];
  host: ExperienceHost;
  itinerary: ExperienceItineraryItem[];
  reviews: ExperienceReview[];
  review_total: number;
}

export interface ExperienceSlot {
  id: number;
  start_at: string;
  end_at: string;
  spots_left: number;
  price_per_guest: number;
  private_available: boolean;
}

export interface ExperienceSlotsByDate {
  date: string;
  slots: ExperienceSlot[];
}

export interface ExperienceQuoteLine {
  label: string;
  amount: number;
}

export interface ExperienceQuote {
  lines: ExperienceQuoteLine[];
  total: number;
  cancellation_text: string;
}

export interface ExperienceQuoteRequest {
  slot_id: number;
  adults: number;
}

export interface ExperienceBookingCreate {
  slot_id: number;
  adults: number;
  payment_method_type?: "card" | "upi" | "netbanking";
  card_brand?: string;
  card_last4?: string;
}

export interface ExperienceBookingExperience {
  id: number;
  title: string;
  city: string;
  cover_image: string | null;
  host_name: string;
  host_avatar: string | null;
  meeting_point_name: string;
  meeting_point_address: string;
}

export interface ExperienceBookingSummary {
  id: number;
  adults: number;
  status: ExperienceBookingStatus;
  price_per_guest_snapshot: number;
  total_snapshot: number;
  confirmation_code: string;
  start_at: string;
  end_at: string;
  experience: ExperienceBookingExperience;
  created_at: string;
  refund_amount: number | null;
  can_cancel: boolean;
}

export interface ExperienceBookingDetail extends ExperienceBookingSummary {
  payment_method_type: "card" | "upi" | "netbanking" | null;
  card_brand: string | null;
  card_last4: string | null;
  cancelled_at: string | null;
  cancellation_text: string;
}

export interface ExperienceMyBookings {
  upcoming: ExperienceBookingSummary[];
  past: ExperienceBookingSummary[];
  cancelled: ExperienceBookingSummary[];
}
