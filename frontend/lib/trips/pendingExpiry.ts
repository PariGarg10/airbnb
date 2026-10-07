import { addHours, differenceInHours, parseISO } from "date-fns";

export function pendingExpiresLabel(createdAt: string | null | undefined): string {
  if (!createdAt) return "Awaiting host";
  const expires = addHours(parseISO(createdAt), 24);
  const hours = Math.max(0, differenceInHours(expires, new Date()));
  if (hours === 0) return "Expires soon";
  return hours === 1 ? "Expires in 1h" : `Expires in ${hours}h`;
}
