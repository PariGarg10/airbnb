/** Resize Unsplash URLs for listing photos; other hosts unchanged. */
export function listingPhotoUrl(url: string, width = 800): string {
  if (!url.includes("images.unsplash.com")) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("w", String(width));
    parsed.searchParams.set("q", "70");
    parsed.searchParams.set("auto", "format");
    return parsed.toString();
  } catch {
    return url;
  }
}

export const LISTING_CARD_SIZES = "(min-width: 1128px) 20vw, 50vw";
