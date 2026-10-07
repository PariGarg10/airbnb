"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ListingCard } from "@/components/listings/ListingCard";
import type { ListingCard as ListingCardData } from "@/types";

function useRowScroller(itemCount: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ prev: false, next: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
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

  return { ref, edges, scrollPage };
}

function ArrowButton({
  label,
  direction,
  disabled,
  onClick,
}: {
  label: string;
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="row-arrow flex h-7 w-7 items-center justify-center rounded-[50%] bg-quaternary text-ink enabled:hover:bg-quaternary-hover disabled:cursor-not-allowed disabled:text-disabled disabled:opacity-50"
    >
      <Icon size={16} />
    </button>
  );
}

export function CatalogRow({
  title,
  subtitle,
  listings,
  onNeedAuth,
}: {
  title: string;
  subtitle?: string;
  listings: ListingCardData[];
  onNeedAuth: () => void;
}) {
  const { ref, edges, scrollPage } = useRowScroller(listings.length);

  if (listings.length === 0) return null;

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 md:flex-none">
          <h2 className="t-section-title min-w-0 pl-0.5 md:truncate">{title}</h2>
          {subtitle ? <p className="t-section-subtitle mt-0.5 pl-0.5">{subtitle}</p> : null}
        </div>
        <div className="hidden shrink-0 gap-1 md:flex">
          <ArrowButton label="Previous" direction="left" disabled={!edges.prev} onClick={() => scrollPage(-1)} />
          <ArrowButton label="Next" direction="right" disabled={!edges.next} onClick={() => scrollPage(1)} />
        </div>
      </div>
      <div ref={ref} className="home-row no-scrollbar">
        {listings.map((listing, index) => (
          <div key={listing.id} className="home-row-card">
            <ListingCard
              listing={listing}
              href={`/listings/${listing.id}`}
              variant="rail"
              priority={index < 2}
              onNeedAuth={onNeedAuth}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
