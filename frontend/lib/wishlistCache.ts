import type { QueryClient } from "@tanstack/react-query";
import type { ListingCard, WishlistSummary } from "@/types";

const LISTING_ROOTS = [["listings"], ["home-cover"], ["home-row"], ["listing"]] as const;

type CacheSnapshot = Array<[readonly unknown[], unknown]>;

function withFlag(value: unknown, listingId: number, saved: boolean): unknown {
  if (Array.isArray(value)) return value.map((item) => withFlag(item, listingId, saved));
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  if (record.id === listingId && typeof record.is_wishlisted === "boolean") {
    return { ...record, is_wishlisted: saved };
  }
  let changed = false;
  const next: Record<string, unknown> = { ...record };
  if (Array.isArray(record.pages)) {
    next.pages = record.pages.map((page) => withFlag(page, listingId, saved));
    changed = true;
  }
  if (Array.isArray(record.items)) {
    next.items = record.items.map((item) => withFlag(item, listingId, saved));
    changed = true;
  }
  return changed ? next : value;
}

export function captureWishlistCaches(queryClient: QueryClient): CacheSnapshot {
  const snapshots: CacheSnapshot = [];
  for (const key of [...LISTING_ROOTS, ["wishlist-items"], ["wishlists"]]) {
    for (const entry of queryClient.getQueriesData({ queryKey: key })) {
      snapshots.push(entry);
    }
  }
  return snapshots;
}

export function restoreWishlistCaches(queryClient: QueryClient, snapshots: CacheSnapshot) {
  for (const [key, data] of snapshots) {
    queryClient.setQueryData(key, data);
  }
}

export function applyListingSaved(queryClient: QueryClient, listingId: number, saved: boolean) {
  for (const key of LISTING_ROOTS) {
    queryClient.setQueriesData({ queryKey: [...key] }, (current) => withFlag(current, listingId, saved));
  }
  queryClient.setQueriesData<ListingCard[]>({ queryKey: ["wishlist-items"] }, (current) => {
    if (!current) return current;
    if (!saved) return current.filter((item) => item.id !== listingId);
    return current.map((item) => (item.id === listingId ? { ...item, is_wishlisted: true } : item));
  });
}

export function applyWishlistMembership(
  queryClient: QueryClient,
  userId: number,
  listingId: number,
  saved: boolean,
  wishlistId?: number,
) {
  queryClient.setQueryData<WishlistSummary[]>(["wishlists", userId], (current) => {
    if (!current) return current;
    return current.map((list) => {
      const has = list.listing_ids.includes(listingId);
      if (saved) {
        if (list.id !== wishlistId || has) return list;
        return { ...list, count: list.count + 1, listing_ids: [listingId, ...list.listing_ids] };
      }
      if (!has) return list;
      return {
        ...list,
        count: Math.max(0, list.count - 1),
        listing_ids: list.listing_ids.filter((id) => id !== listingId),
      };
    });
  });
}

export function savedCountLabel(count: number): string {
  return `${count} saved`;
}
