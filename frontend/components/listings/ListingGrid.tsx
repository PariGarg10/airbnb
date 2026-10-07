import { ListingCard } from "@/components/listings/ListingCard";
import { Skeleton } from "@/components/ui/Skeleton";
import type { SearchFilters } from "@/hooks/useSearchFilters";
import type { ListingCard as ListingCardData } from "@/types";

interface ListingGridProps {
  listings: ListingCardData[];
  loading: boolean;
  filters: SearchFilters;
  compact?: boolean;
  hoveredId: number | null;
  selectedId: number | null;
  onHover: (id: number | null) => void;
  onNeedAuth: () => void;
  onClear: () => void;
}

function listingHref(id: number, filters: SearchFilters): string {
  const params = new URLSearchParams();
  if (filters.check_in) params.set("check_in", filters.check_in);
  if (filters.check_out) params.set("check_out", filters.check_out);
  if (filters.guests) params.set("guests", String(filters.guests));
  const query = params.toString();
  return `/listings/${id}${query ? `?${query}` : ""}`;
}

function SkeletonCard({ results = false }: { results?: boolean }) {
  return (
    <div>
      <Skeleton className="aspect-[20/19] w-full rounded-[var(--card-radius)]" />
      <div className={`mt-3 flex items-start justify-between gap-3 ${results ? "" : "hidden"}`}>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-16 shrink-0" />
      </div>
      <Skeleton className={`h-4 w-2/3 ${results ? "mt-2" : "mt-3"}`} />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <Skeleton className="mt-2 h-4 w-2/5" />
    </div>
  );
}

export function ListingGrid({
  listings,
  loading,
  filters,
  compact = false,
  hoveredId,
  selectedId,
  onHover,
  onNeedAuth,
  onClear,
  results = false,
  mapHidden = false,
}: ListingGridProps & { results?: boolean; mapHidden?: boolean }) {
  const columns = results
    ? "grid grid-cols-1 gap-x-[var(--search-results-grid-gap-x)] gap-y-[var(--search-results-grid-gap-y)] sm:grid-cols-2 min-[1128px]:grid-cols-2"
    : compact
      ? "grid grid-cols-1 gap-x-6 gap-y-10 lg:grid-cols-2"
      : "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

  if (loading) {
    return (
      <div className={columns}>
        {Array.from({ length: results || compact ? 6 : 10 }, (_, index) => (
          <SkeletonCard key={index} results={results} />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="py-16">
        <h2 className="t-section-title">No exact matches</h2>
        <p className="mt-2 max-w-md text-body text-muted">
          {results
            ? "Try changing or removing some of your filters or adjusting your search area."
            : "Try changing or removing some of your filters."}
        </p>
        <button
          type="button"
          className={results ? "mt-6 rounded-lg border border-ink px-5 py-3 text-body font-semibold text-ink" : "mt-4 t-link"}
          onClick={onClear}
        >
          Remove all filters
        </button>
      </div>
    );
  }

  return (
    <div className={`${columns}${results && mapHidden ? " min-[1440px]:grid-cols-3" : ""}`}>
      {listings.map((listing, index) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          href={listingHref(listing.id, filters)}
          active={!results && (hoveredId === listing.id || selectedId === listing.id)}
          onHover={onHover}
          onNeedAuth={onNeedAuth}
          priority={index < 6}
          variant={results ? "results" : "grid"}
          stayDates={
            results && filters.check_in && filters.check_out ? { checkIn: filters.check_in, checkOut: filters.check_out } : undefined
          }
        />
      ))}
    </div>
  );
}
