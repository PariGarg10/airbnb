import type { ListingImage } from "@/types";

const TOUR_LABELS = ["Living room", "Full kitchen", "Bedroom", "Full bathroom", "Workspace", "Additional photos"];

export interface PhotoTourSection {
  id: string;
  label: string;
  urls: string[];
  startIndex: number;
}

export type PhotoTourRow =
  | { kind: "single"; url: string; index: number }
  | { kind: "pair"; left: string; right?: string; index: number };

export function buildPhotoTour(images: ListingImage[]): { urls: string[]; sections: PhotoTourSection[] } {
  const sorted = [...images].sort((a, b) => a.position - b.position);
  const urls = sorted.map((image) => image.url);
  if (urls.length === 0) return { urls, sections: [] };

  const sectionCount = Math.min(TOUR_LABELS.length, Math.max(1, Math.ceil(urls.length / 4)));
  const sections: PhotoTourSection[] = [];
  let cursor = 0;

  for (let i = 0; i < sectionCount; i += 1) {
    const remaining = urls.length - cursor;
    const left = sectionCount - i;
    const take = Math.max(1, Math.ceil(remaining / left));
    const slice = urls.slice(cursor, cursor + take);
    if (slice.length === 0) break;
    sections.push({
      id: `section-${i}`,
      label: TOUR_LABELS[i] ?? "Additional photos",
      urls: slice,
      startIndex: cursor,
    });
    cursor += slice.length;
  }

  return { urls, sections };
}

export function photoTourRows(urls: string[]): PhotoTourRow[] {
  const rows: PhotoTourRow[] = [];
  let i = 0;
  while (i < urls.length) {
    if (i === 0 || i % 3 === 0) {
      rows.push({ kind: "single", url: urls[i]!, index: i });
      i += 1;
    } else {
      rows.push({ kind: "pair", left: urls[i]!, right: urls[i + 1], index: i });
      i += urls[i + 1] ? 2 : 1;
    }
  }
  return rows;
}
