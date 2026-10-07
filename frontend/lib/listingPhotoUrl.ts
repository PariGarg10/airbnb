export const LISTING_PHOTO_FALLBACK =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=480&q=60";

/** Resize Unsplash URLs for listing photos; other hosts unchanged. */
export function listingPhotoUrl(url: string, width = 480): string {
  if (!url.includes("images.unsplash.com")) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("w", String(width));
    parsed.searchParams.set("q", "60");
    parsed.searchParams.set("auto", "format");
    parsed.searchParams.set("fit", "crop");
    return parsed.toString();
  } catch {
    return url;
  }
}

export const LISTING_CARD_WIDTH = 320;
export const LISTING_CARD_SIZES = "(min-width: 1128px) 20vw, 50vw";
export const LISTING_THUMB_WIDTH = 280;
