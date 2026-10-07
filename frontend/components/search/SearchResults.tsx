"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { Map, Tag } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { SwitchUserModal } from "@/components/auth/SwitchUserModal";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { FilterChips } from "@/components/search/FilterChips";
import { Skeleton } from "@/components/ui/Skeleton";
import { listingsApi } from "@/lib/api";
import { formatResultsHeading } from "@/lib/format";
import { useMinWidth } from "@/hooks/useMinWidth";
import { useSearchFilters } from "@/hooks/useSearchFilters";

const ListingsMap = dynamic(() => import("@/components/listings/ListingsMap"), {
  ssr: false,
  loading: () => <div className="search-map h-full w-full bg-[#ebebeb]" aria-hidden />,
});

const FiltersModal = dynamic(
  () => import("@/components/search/FiltersModal").then((mod) => ({ default: mod.FiltersModal })),
  { ssr: false },
);

export function ResultsLoadingSkeleton({ mapHidden }: { mapHidden?: boolean }) {
  return (
    <div>
      <div className="no-scrollbar overflow-x-auto px-6 py-3 min-[1128px]:px-12 min-[1128px]:py-4">
        <div className="flex w-max items-center gap-3 min-[1128px]:gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-24 rounded-full" />
          ))}
        </div>
      </div>
      <div className="min-[1128px]:flex min-[1128px]:items-start">
        <div className={`min-w-0 px-6 pb-16 pt-2 min-[1128px]:w-[var(--search-list-w)] min-[1128px]:px-12 ${mapHidden ? "" : ""}`}>
          <div className="mb-6 flex items-center justify-between gap-4">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="hidden h-4 w-44 min-[1128px]:block" />
          </div>
          <div className="grid grid-cols-1 gap-x-[var(--search-results-grid-gap-x)] gap-y-[var(--search-results-grid-gap-y)] sm:grid-cols-2 min-[1128px]:grid-cols-2">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index}>
                <Skeleton className="aspect-[20/19] w-full rounded-[var(--card-radius)]" />
                <div className="mt-3 flex items-start justify-between gap-3">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-16 shrink-0" />
                </div>
                <Skeleton className="mt-2 h-4 w-4/5" />
                <Skeleton className="mt-2 h-4 w-1/2" />
                <Skeleton className="mt-2 h-4 w-2/5" />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden min-[1128px]:block min-[1128px]:w-[var(--search-map-w)]">
          <div
            className="sticky pr-6"
            style={{
              top: "var(--search-map-sticky-top)",
              height: "calc(100vh - var(--search-map-sticky-top) - var(--search-map-inset-b))",
            }}
          >
            <Skeleton className="search-map h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchResults() {
  const { filters, setFilters, activeFilterCount } = useSearchFilters();
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [mobileMap, setMobileMap] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const listings = useInfiniteQuery({
    queryKey: ["listings", filters],
    queryFn: ({ pageParam }) => listingsApi.search({ ...filters, page: pageParam, page_size: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.has_more ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });

  const items = listings.data?.pages.flatMap((page) => page.items) ?? [];
  const total = listings.data?.pages[0]?.total ?? 0;
  const dimmed = listings.isFetching && !listings.isFetchingNextPage && !listings.isLoading;
  const boundsKey = listings.isLoading || listings.isPlaceholderData ? "" : `${JSON.stringify(filters)}:${items[0]?.id ?? "none"}`;

  const hasNextPage = listings.hasNextPage;
  const isFetchingNextPage = listings.isFetchingNextPage;
  const fetchNextPage = listings.fetchNextPage;

  useEffect(() => {
    const node = sentinel.current;
    if (!node || listings.isLoading) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, listings.isLoading, items.length]);

  const heading = useMemo(() => formatResultsHeading(total, filters.location), [filters.location, total]);

  const showMap = mapExpanded || mobileMap;
  const desktopMap = useMinWidth(1128);
  const mountMap = desktopMap || mobileMap || mapExpanded;

  if (listings.isLoading && items.length === 0) {
    return <ResultsLoadingSkeleton mapHidden={mapExpanded} />;
  }

  return (
    <div>
      <FilterChips filters={filters} activeCount={activeFilterCount} onChange={setFilters} onOpenFilters={() => setFiltersOpen(true)} />
      <div className="min-[1128px]:flex min-[1128px]:items-start">
        <div
          className={`min-w-0 px-6 pb-16 pt-2 min-[1128px]:w-[var(--search-list-w)] min-[1128px]:px-12 ${showMap ? "max-[1127px]:hidden" : ""} ${mapExpanded ? "min-[1128px]:hidden" : ""}`}
        >
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <h1 className="t-results-heading">{heading}</h1>
            <p className="t-results-fees flex shrink-0 items-center gap-1.5">
              <Tag size={16} className="shrink-0 text-rausch" strokeWidth={2} />
              Prices include all fees
            </p>
          </div>
          <div className={dimmed ? "opacity-50 transition-opacity duration-200" : "transition-opacity duration-200"}>
            {listings.isError ? (
              <div className="py-16">
                <h2 className="t-section-title">Could not load stays</h2>
                <button type="button" className="mt-4 t-link" onClick={() => listings.refetch()}>
                  Try again
                </button>
              </div>
            ) : (
              <ListingGrid
                listings={items}
                loading={listings.isLoading}
                filters={filters}
                hoveredId={hoveredId}
                selectedId={selectedId}
                onHover={setHoveredId}
                onNeedAuth={() => setAuthOpen(true)}
                onClear={() =>
                  setFilters({
                    category: undefined,
                    min_price: undefined,
                    max_price: undefined,
                    property_types: undefined,
                    room_type: undefined,
                    amenities: undefined,
                    min_bedrooms: undefined,
                    min_beds: undefined,
                    min_bathrooms: undefined,
                    min_rating: undefined,
                    instant_book: undefined,
                    allows_pets: undefined,
                  })
                }
                results
                mapHidden={mapExpanded}
              />
            )}
          </div>
          <div ref={sentinel} className="h-8" />
          {listings.isFetchingNextPage ? <p className="py-4 text-center text-body text-muted">Loading more stays</p> : null}
        </div>
        <div
          className={`${mobileMap ? "fixed inset-0 z-40 bg-white p-3" : "hidden"} min-[1128px]:block min-[1128px]:w-[var(--search-map-w)] min-[1128px]:bg-transparent min-[1128px]:p-0 ${
            mapExpanded ? "min-[1128px]:w-full" : ""
          } ${mobileMap ? "min-[1128px]:static" : ""}`}
        >
          <div
            className={`h-[calc(100vh-24px)] min-[1128px]:sticky min-[1128px]:top-[var(--search-map-sticky-top)] min-[1128px]:h-[calc(100vh-var(--search-map-sticky-top)-var(--search-map-inset-b))] min-[1128px]:pr-6 ${mapExpanded ? "min-[1128px]:px-6" : ""}`}
          >
            {listings.isLoading ? (
              <Skeleton className="search-map h-full w-full" />
            ) : mountMap ? (
              <ListingsMap
                key={mobileMap ? "search-map-mobile" : "search-map-desktop"}
                listings={items}
                filters={filters}
                boundsKey={boundsKey}
                hoveredId={hoveredId}
                selectedId={selectedId}
                expanded={mapExpanded || mobileMap}
                onHover={setHoveredId}
                onSelect={setSelectedId}
                onExpand={() => {
                  if (window.matchMedia("(max-width: 1127px)").matches) setMobileMap(false);
                  else setMapExpanded((open) => !open);
                }}
                onNeedAuth={() => setAuthOpen(true)}
              />
            ) : null}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setMobileMap((open) => !open)}
        className="fixed bottom-8 left-1/2 z-[45] flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3.5 t-button text-white shadow-pill min-[1128px]:hidden"
      >
        <Map size={16} />
        {mobileMap ? "List" : "Map"}
      </button>
      <FiltersModal open={filtersOpen} filters={filters} onClose={() => setFiltersOpen(false)} onApply={setFilters} />
      <SwitchUserModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
