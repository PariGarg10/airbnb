"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { ListingCard } from "@/components/listings/ListingCard";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import { isGuestFavourite } from "@/lib/isGuestFavourite";
import type { ListingCard as ListingCardData } from "@/types";

const BLURBS: Record<string, string> = {
  Goa: "Prime beach spot",
  Manali: "Mountain retreat",
  Jaipur: "Palaces and colour",
  Udaipur: "Lakeside stays",
  Rishikesh: "Riverside escape",
  Coorg: "Coffee country",
  Munnar: "Tea gardens",
  Mumbai: "City energy",
  Bali: "Island living",
  Lisbon: "For a trip abroad",
  Tokyo: "World-class dining",
  Santorini: "Cliffside views",
};

function Row({
  title,
  subtitle,
  onTitle,
  children,
}: {
  title: string;
  subtitle?: string;
  onTitle?: () => void;
  children: React.ReactNode;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const scrollBy = (distance: number) => scroller.current?.scrollBy({ left: distance, behavior: "smooth" });

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <button type="button" onClick={onTitle} className="t-section-title flex items-center text-left">
            {title}
            <span className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-quaternary transition-colors duration-200 hover:bg-quaternary-hover">
              <ChevronRight size={16} />
            </span>
          </button>
          {subtitle ? <p className="t-section-subtitle mt-0.5">{subtitle}</p> : null}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollBy(-520)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline bg-white shadow-sm"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollBy(520)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline bg-white shadow-sm"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div ref={scroller} className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
        {children}
      </div>
    </section>
  );
}

export function HomeRails({ items, onNeedAuth }: { items: ListingCardData[]; onNeedAuth: () => void }) {
  const { setFilters } = useSearchFilters();
  const byCity = new Map<string, ListingCardData[]>();
  for (const item of items) {
    const list = byCity.get(item.city) ?? [];
    list.push(item);
    byCity.set(item.city, list);
  }
  const cities = Array.from(byCity.entries());

  const sections = cities.slice(0, 4).map(([city, list]) => {
    const favourites = list.filter(isGuestFavourite);
    const guestRow = favourites.length >= 2;
    return {
      city,
      title: guestRow ? `Guest favourite homes in ${city}` : `Homes in ${city}`,
      subtitle: guestRow ? "Guests often rate these homes highly" : undefined,
      listings: guestRow ? favourites : list,
    };
  });

  return (
    <div>
      <Row title="Destinations for you">
        {cities.slice(0, 12).map(([city, list]) => {
          const photo = list[0]?.images[0];
          return (
            <button
              key={city}
              type="button"
              onClick={() => setFilters({ location: city })}
              className="w-[148px] shrink-0 text-left"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-soft">
                {photo ? <Image src={photo} alt="" fill className="object-cover" sizes="148px" /> : null}
              </div>
              <p className="mt-2 text-card font-medium text-ink">{city}</p>
              <p className="text-meta text-muted">{BLURBS[city] ?? "Popular with guests"}</p>
            </button>
          );
        })}
      </Row>
      {sections.map((section) => (
        <Row
          key={section.title}
          title={section.title}
          subtitle={section.subtitle}
          onTitle={() => setFilters({ location: section.city })}
        >
          {section.listings.map((listing) => (
            <div key={listing.id} className="w-[260px] shrink-0">
              <ListingCard listing={listing} href={`/listings/${listing.id}`} onNeedAuth={onNeedAuth} />
            </div>
          ))}
        </Row>
      ))}
    </div>
  );
}
