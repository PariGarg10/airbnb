const IST = "Asia/Kolkata";

export function formatExperienceMonthYear(isoOrDate: string | Date): string {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat("en-IN", { timeZone: IST, month: "long", year: "numeric" }).format(date);
}

export function formatExperienceDayHeader(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

export function formatExperienceDateLong(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatExperienceDateShort(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

export function formatExperienceTimeRange(startIso: string, endIso: string): string {
  const opts: Intl.DateTimeFormatOptions = { timeZone: IST, hour: "numeric", minute: "2-digit", hour12: true };
  const start = new Intl.DateTimeFormat("en-IN", opts).format(new Date(startIso));
  const end = new Intl.DateTimeFormat("en-IN", opts).format(new Date(endIso));
  return `${start} – ${end}`;
}

export function formatExperienceReviewMonth(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: IST, month: "long", year: "numeric" }).format(new Date(iso));
}

export function monthRange(year: number, monthIndex: number): { from: string; to: string } {
  const from = new Date(Date.UTC(year, monthIndex, 1));
  const to = new Date(Date.UTC(year, monthIndex + 1, 0));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export function adultsLabel(count: number): string {
  return count === 1 ? "1 adult" : `${count} adults`;
}
