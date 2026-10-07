import { differenceInMonths, parseISO } from "date-fns";
import { APP_NAME } from "@/lib/brand";

export function authorTenureLabel(createdAt?: string | null): string {
  if (!createdAt) return `New to ${APP_NAME}`;
  const start = parseISO(createdAt);
  if (Number.isNaN(start.getTime())) return `New to ${APP_NAME}`;
  const months = differenceInMonths(new Date(), start);
  if (months < 1) return `New to ${APP_NAME}`;
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} on ${APP_NAME}`;
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? "year" : "years"} on ${APP_NAME}`;
}
