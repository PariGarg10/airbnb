import type {
  Amenity,
  BookedRange,
  BookingCreate,
  BookingCompanion,
  BookingDetail,
  CancellationPreview,
  CancelReason,
  CategoryCount,
  HostBooking,
  HostBookingStatus,
  HostListing,
  HostProfile,
  HostProfileInput,
  HostStats,
  ListingDeleteResult,
  ListingDetail,
  ListingInput,
  ListingSearchParams,
  ListingStatusUpdate,
  MyBookings,
  Paginated,
  Quote,
  QuoteParams,
  CouponValidation,
  Review,
  ReviewCreate,
  ReviewPage,
  UploadResult,
  User,
  ListingCard,
  SavedListingIds,
  WishlistSummary,
} from "@/types";
import type {
  ExperienceBookingCreate,
  ExperienceBookingDetail,
  ExperienceCard,
  ExperienceDetail,
  ExperienceMyBookings,
  ExperienceQuote,
  ExperienceQuoteRequest,
  ExperienceSlotsByDate,
} from "@/types/experience";

export const USER_ID_STORAGE_KEY = "airbnb_user_id";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return base.replace(/\/$/, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readDetail(payload: unknown): string {
  if (!isRecord(payload) || !("detail" in payload)) return "Request failed";
  const detail = payload.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (isRecord(item) && typeof item.msg === "string" ? item.msg : null))
      .filter((item): item is string => item !== null);
    if (messages.length > 0) return messages.join(", ");
  }
  return "Request failed";
}

function authHeaders(): Headers {
  const headers = new Headers();
  if (typeof window === "undefined") return headers;
  const userId = window.localStorage.getItem(USER_ID_STORAGE_KEY);
  if (userId) headers.set("X-User-Id", userId);
  return headers;
}

function toQuery(params: object): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === "" || value == null || value === false) return;
    if (typeof value === "boolean") {
      if (value) search.set(key, "true");
      return;
    }
    if (typeof value !== "string" && typeof value !== "number") return;
    search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

type CacheMode = "public" | "private";

type ApiRequestInit = RequestInit & { cacheMode?: CacheMode };

async function request<T>(path: string, init?: ApiRequestInit): Promise<T> {
  const { cacheMode = "private", ...rest } = init ?? {};
  const headers = authHeaders();
  if (rest.headers) {
    new Headers(rest.headers).forEach((value, key) => headers.set(key, value));
  }
  const isForm = typeof FormData !== "undefined" && rest.body instanceof FormData;
  if (rest.body && !isForm && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const fetchInit: RequestInit = { ...rest, headers };
  const personalized = headers.has("X-User-Id");
  if (cacheMode === "public" && !personalized) {
    if (typeof window === "undefined") {
      fetchInit.next = { revalidate: 60 };
    }
  } else {
    fetchInit.cache = rest.cache ?? "no-store";
  }

  let response: Response;
  try {
    response = await fetch(`${apiBase()}${path}`, fetchInit);
  } catch {
    throw new ApiError(0, "Network error");
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, readDetail(payload));
  }
  return payload as T;
}

export const usersApi = {
  list: () => request<User[]>("/api/users", { cacheMode: "public" }),
  me: () => request<User>("/api/users/me"),
};

export const listingsApi = {
  search: (params: ListingSearchParams = {}) => {
    const { property_types, amenities, ...rest } = params;
    return request<Paginated<ListingCard>>(
      `/api/listings${toQuery({
        ...rest,
        property_types: property_types?.join(","),
        amenities: amenities?.join(","),
      })}`,
      { cacheMode: "public" },
    );
  },
  get: (listingId: number) => request<ListingDetail>(`/api/listings/${listingId}`, { cacheMode: "public" }),
  bookedDates: (listingId: number) =>
    request<BookedRange[]>(`/api/listings/${listingId}/booked-dates`, { cacheMode: "public" }),
  quote: (listingId: number, params: QuoteParams) =>
    request<Quote>(`/api/listings/${listingId}/quote${toQuery(params)}`),
  amenities: () => request<Amenity[]>("/api/amenities", { cacheMode: "public" }),
  categories: () => request<CategoryCount[]>("/api/categories", { cacheMode: "public" }),
};

export const couponsApi = {
  validate: (params: { code: string; listing_id: number; check_in: string; check_out: string }) =>
    request<CouponValidation>(`/api/coupons/validate${toQuery(params)}`),
};

export const bookingsApi = {
  create: (body: BookingCreate) =>
    request<BookingDetail>("/api/bookings", { method: "POST", body: JSON.stringify(body) }),
  mine: () => request<MyBookings>("/api/bookings/me"),
  get: (bookingId: number) => request<BookingDetail>(`/api/bookings/${bookingId}`),
  cancellationPreview: (bookingId: number) =>
    request<CancellationPreview>(`/api/bookings/${bookingId}/cancellation-preview`),
  cancel: (bookingId: number, reason: CancelReason) =>
    request<BookingDetail>(`/api/bookings/${bookingId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  addCompanions: (bookingId: number, companions: { name: string; email: string }[]) =>
    request<BookingCompanion[]>(`/api/bookings/${bookingId}/companions`, {
      method: "POST",
      body: JSON.stringify({ companions }),
    }),
};

export const hostApi = {
  profile: () => request<HostProfile>("/api/host/profile"),
  upsertProfile: (body: HostProfileInput) =>
    request<HostProfile>("/api/host/profile", { method: "PUT", body: JSON.stringify(body) }),
  listings: () => request<HostListing[]>("/api/host/listings"),
  createListing: (body: ListingInput) =>
    request<ListingDetail>("/api/host/listings", { method: "POST", body: JSON.stringify(body) }),
  updateListing: (listingId: number, body: ListingInput) =>
    request<ListingDetail>(`/api/host/listings/${listingId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteListing: (listingId: number) =>
    request<ListingDeleteResult>(`/api/host/listings/${listingId}`, { method: "DELETE" }),
  setStatus: (listingId: number, body: ListingStatusUpdate) =>
    request<HostListing>(`/api/host/listings/${listingId}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  bookings: (status: HostBookingStatus) =>
    request<HostBooking[]>(`/api/host/bookings${toQuery({ status })}`),
  acceptBooking: (bookingId: number) =>
    request<BookingDetail>(`/api/host/bookings/${bookingId}/accept`, { method: "POST" }),
  declineBooking: (bookingId: number) =>
    request<BookingDetail>(`/api/host/bookings/${bookingId}/decline`, { method: "POST" }),
  stats: () => request<HostStats>("/api/host/stats"),
};

export const wishlistApi = {
  list: () => request<WishlistSummary[]>("/api/wishlists"),
  savedIds: () => request<SavedListingIds>("/api/wishlists/saved-ids"),
  create: (body: { name: string; listing_id?: number }) =>
    request<WishlistSummary>("/api/wishlists", { method: "POST", body: JSON.stringify(body) }),
  items: (wishlistId: number) => request<ListingCard[]>(`/api/wishlists/${wishlistId}`),
  rename: (wishlistId: number, name: string) =>
    request<WishlistSummary>(`/api/wishlists/${wishlistId}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),
  remove: (wishlistId: number) => request<void>(`/api/wishlists/${wishlistId}`, { method: "DELETE" }),
  addItem: (wishlistId: number, listingId: number) =>
    request<void>(`/api/wishlists/${wishlistId}/items/${listingId}`, { method: "POST" }),
  removeItem: (wishlistId: number, listingId: number) =>
    request<void>(`/api/wishlists/${wishlistId}/items/${listingId}`, { method: "DELETE" }),
};

export const experiencesApi = {
  list: (params: { city?: string; category?: string } = {}) =>
    request<ExperienceCard[]>(`/api/experiences${toQuery(params)}`, { cacheMode: "public" }),
  get: (id: number) => request<ExperienceDetail>(`/api/experiences/${id}`, { cacheMode: "public" }),
  slots: (id: number, params: { from?: string; to?: string; guests?: number } = {}) =>
    request<ExperienceSlotsByDate[]>(`/api/experiences/${id}/slots${toQuery(params)}`, { cacheMode: "public" }),
  quote: (body: ExperienceQuoteRequest) =>
    request<ExperienceQuote>("/api/experiences/quote", { method: "POST", body: JSON.stringify(body) }),
};

export const experienceBookingsApi = {
  create: (body: ExperienceBookingCreate) =>
    request<ExperienceBookingDetail>("/api/experience-bookings", { method: "POST", body: JSON.stringify(body) }),
  mine: () => request<ExperienceMyBookings>("/api/experience-bookings/me"),
  get: (bookingId: number) => request<ExperienceBookingDetail>(`/api/experience-bookings/${bookingId}`),
  cancel: (bookingId: number) =>
    request<ExperienceBookingDetail>(`/api/experience-bookings/${bookingId}/cancel`, { method: "POST" }),
};

export const reviewsApi = {
  list: (listingId: number, page = 1, pageSize = 6) =>
    request<ReviewPage>(`/api/listings/${listingId}/reviews${toQuery({ page, page_size: pageSize })}`, {
      cacheMode: "public",
    }),
  create: (bookingId: number, body: ReviewCreate) =>
    request<Review>(`/api/bookings/${bookingId}/review`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

function uploadWithProgress(file: File, onProgress?: (ratio: number) => void): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${apiBase()}/api/uploads`);
    const userId = window.localStorage.getItem(USER_ID_STORAGE_KEY);
    if (userId) xhr.setRequestHeader("X-User-Id", userId);
    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable || event.total === 0) return;
      onProgress(event.loaded / event.total);
    };
    xhr.onerror = () => reject(new ApiError(0, "Network error"));
    xhr.onload = () => {
      let payload: unknown = null;
      if (xhr.responseText) {
        try {
          payload = JSON.parse(xhr.responseText) as unknown;
        } catch {
          payload = null;
        }
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new ApiError(xhr.status, readDetail(payload)));
        return;
      }
      if (!isRecord(payload) || typeof payload.url !== "string") {
        reject(new ApiError(xhr.status, "Upload failed"));
        return;
      }
      resolve({ url: payload.url });
    };
    xhr.send(body);
  });
}

export const uploadApi = {
  upload: (file: File, onProgress?: (ratio: number) => void) => uploadWithProgress(file, onProgress),
};
