import type { ListingDraft } from "@/hooks/useListingDraft";

export interface DraftImage {
  url: string;
  caption: string | null;
}

export function draftImagesFromDraft(draft: ListingDraft): DraftImage[] {
  if (draft.images.length > 0) return draft.images;
  return draft.image_urls.map((url) => ({ url, caption: null }));
}

export function patchImages(images: DraftImage[]): Pick<ListingDraft, "images" | "image_urls"> {
  return {
    images,
    image_urls: images.map((item) => item.url),
  };
}

export function appendImages(draft: ListingDraft, urls: string[]): Pick<ListingDraft, "images" | "image_urls"> {
  const current = draftImagesFromDraft(draft);
  const seen = new Set(current.map((item) => item.url));
  const next = [...current];
  urls.forEach((url) => {
    if (seen.has(url) || next.length >= 20) return;
    seen.add(url);
    next.push({ url, caption: null });
  });
  return patchImages(next);
}

export function moveImages(images: DraftImage[], from: number, to: number): DraftImage[] {
  if (from === to || from < 0 || to < 0 || from >= images.length || to >= images.length) return images;
  const next = images.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function sanitizeDraftImages(raw: Partial<ListingDraft>): DraftImage[] {
  if (Array.isArray(raw.images)) {
    return raw.images
      .filter((item) => item && typeof item.url === "string" && item.url.length > 0)
      .map((item) => ({
        url: item.url,
        caption: typeof item.caption === "string" ? item.caption.slice(0, 250) : null,
      }))
      .slice(0, 20);
  }
  const urls = Array.isArray(raw.image_urls) ? raw.image_urls.filter((item) => typeof item === "string") : [];
  return urls.map((url) => ({ url, caption: null }));
}
