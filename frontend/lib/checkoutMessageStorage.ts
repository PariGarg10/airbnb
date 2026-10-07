const prefix = "checkout-message-";

export function messageStorageKey(listingId: number): string {
  return `${prefix}${listingId}`;
}

export function loadCheckoutMessage(listingId: number): string {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(messageStorageKey(listingId)) ?? "";
  } catch {
    return "";
  }
}

export function saveCheckoutMessage(listingId: number, message: string): void {
  if (typeof window === "undefined") return;
  try {
    if (!message.trim()) window.sessionStorage.removeItem(messageStorageKey(listingId));
    else window.sessionStorage.setItem(messageStorageKey(listingId), message);
  } catch {
    /* ignore quota */
  }
}

export function clearCheckoutMessage(listingId: number): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(messageStorageKey(listingId));
  } catch {
    /* ignore */
  }
}
