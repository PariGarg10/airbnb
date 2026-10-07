import { listingsApi } from "@/lib/api";
import type { ListingCard, ListingSearchParams } from "@/types";

/** Run listing searches in small batches to avoid overloading the API on cold deploys. */
export async function fetchListingSearchesBatched(
  paramsList: ListingSearchParams[],
  batchSize = 3,
): Promise<ListingCard[][]> {
  const results: ListingCard[][] = [];
  for (let i = 0; i < paramsList.length; i += batchSize) {
    const batch = paramsList.slice(i, i + batchSize);
    const pages = await Promise.all(
      batch.map((params) => listingsApi.search({ ...params, page_size: Math.min(params.page_size ?? 12, 18) })),
    );
    results.push(...pages.map((page) => page.items));
  }
  return results;
}
