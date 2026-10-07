"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { List, Map } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { SwitchUserModal } from "@/components/auth/SwitchUserModal";
import { CategoryBar } from "@/components/home/CategoryBar";
import { HomeRails } from "@/components/home/HomeRails";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { Skeleton } from "@/components/ui/Skeleton";
import { listingsApi } from "@/lib/api";
import { useSearchFilters } from "@/hooks/useSearchFilters";

const ListingsMap = dynamic(() => import("@/components/listings/ListingsMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full skeleton rounded-2xl" />,
});

export function ExplorePage() {
  const { filters, clearFilters } = useSearchFilters();
  const [mapOpen, setMapOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const browsing =
    !filters.location &&
    !filters.check_in &&
    !filters.check_out &&
    !filters.guests &&
    !filters.category &&
    !filters.min_price &&
    !filters.max_price &&
    filters.property_types == null &&
    !filters.room_type &&
    filters.amenities == null &&
    filters.min_bedrooms == null &&
    filters.min_beds == null &&
    filters.min_bathrooms == null &&
    !filters.instant_book &&
    !filters.allows_pets;

  const listings = useInfiniteQuery({
    queryKey: ["listings", filters, browsing ? 40 : 24],
    queryFn: ({ pageParam }) => listingsApi.search({ ...filters, page: pageParam, page_size: browsing ? 40 : 24 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.has_more ? last.page + 1 : undefined),
    staleTime: 60_000,
  });

  const items = listings.data?.pages.flatMap((page) => page.items) ?? [];

  const hasNextPage = listings.hasNextPage;
  const isFetchingNextPage = listings.isFetchingNextPage;
  const fetchNextPage = listings.fetchNextPage;

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const browseShell = "container-home space-y-6 pb-12 md:space-y-10 md:pt-[54px]";

  return (
    <div className={browsing ? "" : "pb-24"}>
      {browsing ? null : <CategoryBar />}
      <div className={browsing ? browseShell : "container-airbnb py-6"}>
        {browsing && listings.isLoading ? (
          <div className="space-y-6 md:space-y-10">
            <section>
              <Skeleton className="h-7 w-56" />
              <div className="dest-row no-scrollbar mt-4 flex gap-3 overflow-hidden">
                {Array.from({ length: 8 }, (_, index) => (
                  <Skeleton key={index} className="aspect-square w-[clamp(92px,11vw,124px)] shrink-0 rounded-xl" />
                ))}
              </div>
            </section>
            <section>
              <Skeleton className="h-6 w-72" />
              <Skeleton className="mt-2 h-4 w-56" />
              <div className="home-row no-scrollbar">
                {Array.from({ length: 7 }, (_, index) => (
                  <div key={index} className="home-row-card">
                    <Skeleton className="aspect-[20/19] w-full rounded-[var(--card-radius)]" />
                    <Skeleton className="mt-1.5 h-[19px] w-3/4" />
                    <Skeleton className="mt-1 h-[18px] w-1/2" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}
        {browsing && !listings.isLoading && !listings.isError ? (
          <HomeRails items={items} onNeedAuth={() => setAuthOpen(true)} />
        ) : null}
        {listings.isError ? (
          <div className="py-16">
            <h2 className="t-section-title">Could not load stays</h2>
            <button type="button" className="mt-4 t-link" onClick={() => listings.refetch()}>
              Try again
            </button>
          </div>
        ) : null}
        {!browsing && !listings.isError ? (
          <div className={mapOpen ? "md:grid md:grid-cols-2 md:gap-6" : ""}>
            <div className={mapOpen ? "hidden md:block" : ""}>
              <ListingGrid
                listings={items}
                loading={listings.isLoading}
                filters={filters}
                compact={mapOpen}
                hoveredId={hoveredId}
                selectedId={selectedId}
                onHover={setHoveredId}
                onNeedAuth={() => setAuthOpen(true)}
                onClear={clearFilters}
              />
              <div ref={sentinel} className="h-10" />
              {listings.isFetchingNextPage ? <p className="py-4 text-center text-meta text-muted">Loading more stays</p> : null}
            </div>
            {mapOpen ? (
              <div className="sticky top-36 h-[calc(100vh-11rem)]">
                <ListingsMap
                  key="explore-map"
                  listings={items}
                  filters={filters}
                  boundsKey={JSON.stringify(filters)}
                  expanded={false}
                  onExpand={() => setMapOpen(false)}
                  hoveredId={hoveredId}
                  selectedId={selectedId}
                  onHover={setHoveredId}
                  onSelect={setSelectedId}
                  onNeedAuth={() => setAuthOpen(true)}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {browsing ? null : (
        <button
          type="button"
          onClick={() => setMapOpen((open) => !open)}
          className="fixed bottom-8 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 t-button text-white shadow-pill"
        >
          {mapOpen ? <List size={16} /> : <Map size={16} />}
          {mapOpen ? "Show list" : "Show map"}
        </button>
      )}
      <SwitchUserModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
