"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { listingsApi } from "@/lib/api";
import { formatInr, formatRating } from "@/lib/format";
import type { ListingCard as ListingCardData } from "@/types";

function useRowScroller(itemCount: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ prev: false, next: false });
  const [page, setPage] = useState({ current: 1, total: 1 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const total = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
      const current = Math.min(total, Math.floor(el.scrollLeft / el.clientWidth) + 1);
      setPage({ current, total });
      setEdges({
        prev: el.scrollLeft > 4,
        next: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [itemCount]);

  const scrollPage = (direction: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
  };

  return { ref, edges, scrollPage, page };
}

function CompactCard({ listing }: { listing: ListingCardData }) {
  const photo = listing.images[0];
  const rating = listing.review_count > 0 ? `★ ${formatRating(listing.avg_rating)}` : "New";
  return (
    <Link href={`/listings/${listing.id}`} className="block w-[calc((100%-48px)/5)] min-w-[180px] shrink-0 snap-start">
      <div className="relative aspect-[20/19] overflow-hidden rounded-xl bg-placeholder">
        {photo ? (
          <Image src={photo} alt="" fill sizes="200px" className="object-cover" />
        ) : (
          <div className="h-full w-full bg-placeholder" />
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-[18px] text-ink">{listing.title}</p>
      <p className="mt-1 text-sm leading-[18px] text-muted">
        {formatInr(listing.price_per_night)} night · {rating}
      </p>
    </Link>
  );
}

export function MoreStaysNearby({ listingId, city }: { listingId: number; city: string }) {
  const nearby = useQuery({
    queryKey: ["nearby-listings", city, listingId],
    queryFn: () => listingsApi.search({ location: city, page_size: 12 }),
    staleTime: 60_000,
  });

  const items = (nearby.data?.items ?? []).filter((item) => item.id !== listingId).slice(0, 10);
  const { ref, edges, scrollPage, page } = useRowScroller(items.length);

  if (items.length === 0) return null;

  return (
    <section className="hidden min-[1128px]:block">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[22px] font-semibold leading-[26px] tracking-[-0.0275rem] text-ink">More stays nearby</h2>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm leading-[18px] text-muted">
            {page.current} / {page.total}
          </span>
          <button
            type="button"
            aria-label="Previous stays"
            disabled={!edges.prev}
            onClick={() => scrollPage(-1)}
            className="row-arrow flex h-8 w-8 items-center justify-center rounded-full bg-quaternary text-ink enabled:hover:bg-quaternary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Next stays"
            disabled={!edges.next}
            onClick={() => scrollPage(1)}
            className="row-arrow flex h-8 w-8 items-center justify-center rounded-full bg-quaternary text-ink enabled:hover:bg-quaternary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto">
        {items.map((listing) => (
          <CompactCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}
