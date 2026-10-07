import type {
  Amenity,
  BookedRange,
  BookingCreate,
  BookingDetail,
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
  Review,
  ReviewCreate,
  ReviewPage,
  UploadResult,
  User,
  ListingCard,
  SavedListingIds,
  WishlistSummary,
} from "@/types";

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
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new ApiError(0, "NEXT_PUBLIC_API_URL is not set");
  }
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = authHeaders();
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  }
  const isForm = typeof FormData !== "undefined" && init?.body instanceof FormData;
  if (init?.body && !isForm && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${apiBase()}${path}`, {
      ...init,
      cache: init?.cache ?? "no-store",
      headers,
    });
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
  list: () => request<User[]>("/api/users"),
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
    );
  },
  get: (listingId: number) => request<ListingDetail>(`/api/listings/${listingId}`),
  bookedDates: (listingId: number) => request<BookedRange[]>(`/api/listings/${listingId}/booked-dates`),
  quote: (listingId: number, params: QuoteParams) =>
    request<Quote>(`/api/listings/${listingId}/quote${toQuery(params)}`),
  amenities: () => request<Amenity[]>("/api/amenities"),
  categories: () => request<CategoryCount[]>("/api/categories"),
};

export const bookingsApi = {
  create: (body: BookingCreate) =>
    request<BookingDetail>("/api/bookings", { method: "POST", body: JSON.stringify(body) }),
  mine: () => request<MyBookings>("/api/bookings/me"),
  get: (bookingId: number) => request<BookingDetail>(`/api/bookings/${bookingId}`),
  cancel: (bookingId: number) =>
    request<BookingDetail>(`/api/bookings/${bookingId}/cancel`, { method: "POST" }),
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

export const reviewsApi = {
  list: (listingId: number, page = 1, pageSize = 6) =>
    request<ReviewPage>(`/api/listings/${listingId}/reviews${toQuery({ page, page_size: pageSize })}`),
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
