import { addDays, format, parseISO } from "date-fns";
import type { PropertyType, RoomType } from "@/types";

const PROPERTY_LABELS: Record<PropertyType, string> = {
  house: "House",
  apartment: "Apartment",
  villa: "Villa",
  cabin: "Cabin",
  guesthouse: "Guesthouse",
  hotel: "Hotel",
  cottage: "Cottage",
  tiny_home: "Tiny home",
  treehouse: "Treehouse",
  castle: "Castle",
};

export function propertyLabel(type: PropertyType): string {
  return PROPERTY_LABELS[type];
}

const ROOM_LABELS: Record<RoomType, string> = {
  entire_place: "Entire place",
  private_room: "Private room",
  shared_room: "Shared room",
};

export function roomTypeLabel(type: RoomType): string {
  return ROOM_LABELS[type];
}

export function formatInr(amount: number): string {
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`;
}

export function formatCompactInr(amount: number): string {
  if (amount < 1000) return formatInr(amount);
  const scaled = Math.round((amount / 1000) * 10) / 10;
  const text = Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1);
  return `₹${text}K`;
}

export function formatRating(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) return rounded.toFixed(1);
  const text = rounded.toFixed(2);
  return text.endsWith("0") ? rounded.toFixed(1) : text;
}

export function formatDateRange(checkIn: string, checkOut: string): string {
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  }
  return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
}

export function formatStay(checkIn?: string, checkOut?: string): string {
  if (!checkIn || !checkOut) return "Anytime";
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Any week";
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${format(start, "MMM d")} – ${format(end, "d")}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
  }
  return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
}

export function formatShortDate(value?: string): string {
  if (!value) return "Add dates";
  const date = parseISO(value);
  if (Number.isNaN(date.getTime())) return "Add dates";
  return format(date, "MMM d");
}

/** Reserve card date inputs (e.g. 10/6/2026). */
export function formatReserveInputDate(value?: string): string {
  if (!value) return "Add date";
  const date = parseISO(value);
  if (Number.isNaN(date.getTime())) return "Add date";
  return format(date, "M/d/yyyy");
}

/** Listing availability subtitle (e.g. 6 Oct 2026 - 7 Oct 2026). */
export function formatListingStaySubtitle(checkIn: string, checkOut: string): string {
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
  return `${format(start, "d MMM yyyy")} - ${format(end, "d MMM yyyy")}`;
}

export function formatGuests(count?: number): string {
  if (!count || count < 1) return "Add guests";
  return count === 1 ? "1 guest" : `${count} guests`;
}

/** Checkout summary guest line (omit zero counts). */
export function formatCheckoutGuestSummary(adults: number, children: number, infants: number, pets = 0): string {
  const parts: string[] = [];
  if (adults > 0) parts.push(`${adults} ${adults === 1 ? "adult" : "adults"}`);
  if (children > 0) parts.push(`${children} ${children === 1 ? "child" : "children"}`);
  if (infants > 0) parts.push(`${infants} ${infants === 1 ? "infant" : "infants"}`);
  if (pets > 0) parts.push(`${pets} ${pets === 1 ? "pet" : "pets"}`);
  return parts.length > 0 ? parts.join(", ") : "1 adult";
}

/** Price breakdown modal date span (e.g. 9–11 Oct). */
export function formatBreakdownStayRange(checkIn: string, checkOut: string): string {
  const start = parseISO(checkIn);
  const end = addDays(parseISO(checkOut), -1);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${format(start, "d")}–${format(end, "d MMM")}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, "d MMM")} – ${format(end, "d MMM")}`;
  }
  return `${format(start, "d MMM, yyyy")} – ${format(end, "d MMM, yyyy")}`;
}

export function formatFreeCancelBefore(checkIn: string): string {
  const dayBefore = addDays(parseISO(checkIn), -1);
  if (Number.isNaN(dayBefore.getTime())) return "check-in";
  return format(dayBefore, "d MMMM");
}

/** Checkout summary card — matches booking cancellation policy (not “free cancel” only). */
export function formatCheckoutCancellationSummary(checkIn: string): string {
  const deadline = formatFreeCancelBefore(checkIn);
  return `Cancel before ${deadline}, 3:00 pm for a full refund. After that, a partial refund applies if you cancel before check-in.`;
}

/** Stay range on search-result cards (e.g. `12–17 Oct`). */
export function formatResultsStayRange(checkIn: string, checkOut: string): string {
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${format(start, "d")}–${format(end, "d MMM")}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, "d MMM")} – ${format(end, "d MMM")}`;
  }
  return `${format(start, "d MMM, yyyy")} – ${format(end, "d MMM, yyyy")}`;
}

export function formatResultsHeading(total: number, location?: string): string {
  const place = location
    ? location.replace(/\b\w/g, (letter) => letter.toUpperCase())
    : undefined;
  if (total >= 1000) {
    return place ? `Over 1,000 homes in ${place}` : "Over 1,000 homes";
  }
  const count = new Intl.NumberFormat("en-IN").format(total);
  const noun = total === 1 ? "home" : "homes";
  return place ? `${count} ${noun} in ${place}` : `${count} ${noun}`;
}

export function toIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
