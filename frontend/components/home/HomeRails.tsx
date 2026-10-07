"use client";

import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowButton, SeeAllTile, searchHref, useRowScroller } from "@/components/home/homeRowUi";
import { ListingCard } from "@/components/listings/ListingCard";
import { DESTINATIONS } from "@/lib/destinations";
import { LISTING_THUMB_WIDTH, listingPhotoUrl } from "@/lib/listingPhotoUrl";
import { isGuestFavourite } from "@/lib/isGuestFavourite";
import type { ListingCard as ListingCardData } from "@/types";

const COVER_FALLBACKS: Record<string, string> = {
  Goa: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=60",
  Manali: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=60",
  Jaipur: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=400&q=60",
  Udaipur: "https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?w=400&q=60",
  Rishikesh: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&q=60",
  Coorg: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&q=60",
  Munnar: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=400&q=60",
  Mumbai: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=400&q=60",
  Bali: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=400&q=60",
  Lisbon: "https://images.unsplash.com/photo-1513735492246-483525079686?w=400&q=60",
  Tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=60",
  Santorini: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400&q=60",
};

function destinationSubtitle(city: string) {
  return DESTINATIONS.find((item) => item.title === city || item.query === city)?.subtitle ?? "Popular with guests";
}

function bestCover(items: ListingCardData[]) {
  return [...items].sort((a, b) => b.avg_rating - a.avg_rating || b.review_count - a.review_count)[0];
}

function CoverPhoto({ src, alt }: { src?: string; alt: string }) {
  const fallback = COVER_FALLBACKS[alt];
  const [current, setCurrent] = useState(src || fallback);
  useEffect(() => {
    setCurrent(src || fallback);
  }, [src, fallback]);
  if (!current) {
    return <img src="/icons/alt-destinations.png" alt="" className="h-full w-full object-contain p-2" />;
  }
  return (
    <Image
      src={listingPhotoUrl(current, LISTING_THUMB_WIDTH)}
      alt=""
      fill
      className="object-cover"
      sizes="124px"
      loading="lazy"
      onError={() => {
        if (fallback && current !== fallback) setCurrent(fallback);
      }}
    />
  );
}

function DestinationRow({ cities }: { cities: [string, ListingCardData[]][] }) {
  const { ref, edges, scrollPage } = useRowScroller(cities.length);

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div className="inline-flex h-7 items-center pl-0.5">
          <h2 className="t-section-title">Destinations for you</h2>
          <span className="row-title-arrow ml-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[14px] bg-quaternary text-ink" aria-hidden>
            <ChevronRight size={16} />
          </span>
        </div>
        <div className="hidden gap-1 md:flex">
          <ArrowButton label="Previous destinations" direction="left" disabled={!edges.prev} onClick={() => scrollPage(-1)} />
          <ArrowButton label="Next destinations" direction="right" disabled={!edges.next} onClick={() => scrollPage(1)} />
        </div>
      </div>
      <div ref={ref} className="dest-row no-scrollbar flex snap-x gap-3 overflow-x-auto">
        {cities.slice(0, 12).map(([city, list]) => {
          const cover = bestCover(list);
          return (
            <Link key={city} href={searchHref({ location: city })} className="w-[clamp(92px,11vw,124px)] shrink-0 snap-start">
              <span className="relative block aspect-square w-full overflow-hidden rounded-xl bg-soft">
                <CoverPhoto src={cover?.images[0] || COVER_FALLBACKS[city]} alt={city} />
              </span>
              <span className="t-destination-name mt-2 block truncate">{city}</span>
              <span className="t-destination-tag block truncate">{destinationSubtitle(city)}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ListingRow({
  title,
  subtitle,
  href,
  listings,
  onNeedAuth,
}: {
  title: string;
  subtitle?: string;
  href: string;
  listings: ListingCardData[];
  onNeedAuth: () => void;
}) {
  const { ref, edges, scrollPage } = useRowScroller(listings.length + 1);
  const photos = listings.map((listing) => listing.images[0]).filter(Boolean);

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 md:flex-none">
          <Link href={href} className="group flex max-w-full items-start justify-between gap-4 pl-0.5 md:inline-flex md:h-7 md:items-center md:justify-start md:gap-0">
            <h2 className="t-section-title min-w-0 md:truncate">{title}</h2>
            <span className="row-title-arrow flex h-7 w-7 shrink-0 items-center justify-center rounded-[14px] bg-quaternary text-ink group-hover:bg-quaternary-hover md:ml-1.5">
              <ChevronRight size={16} />
            </span>
          </Link>
          {subtitle ? <p className="t-section-subtitle mt-0.5 pl-0.5">{subtitle}</p> : null}
        </div>
        <div className="hidden shrink-0 gap-1 md:flex">
          <ArrowButton label="Previous" direction="left" disabled={!edges.prev} onClick={() => scrollPage(-1)} />
          <ArrowButton label="Next" direction="right" disabled={!edges.next} onClick={() => scrollPage(1)} />
        </div>
      </div>
      <div ref={ref} className="home-row no-scrollbar">
        {listings.map((listing) => (
          <div key={listing.id} className="home-row-card">
            <ListingCard listing={listing} href={`/listings/${listing.id}`} variant="rail" onNeedAuth={onNeedAuth} />
          </div>
        ))}
        <div className="home-row-card self-start">
          <SeeAllTile href={href} photos={photos} />
        </div>
      </div>
    </section>
  );
}

export function HomeRails({ items, onNeedAuth }: { items: ListingCardData[]; onNeedAuth: () => void }) {
  const cities = useMemo(() => {
    const byCity = new Map<string, ListingCardData[]>();
    for (const item of items) {
      const list = byCity.get(item.city) ?? [];
      list.push(item);
      byCity.set(item.city, list);
    }
    return Array.from(byCity.entries());
  }, [items]);

  const sections = useMemo(
    () =>
      cities.slice(0, 4).map(([city, list]) => {
        const favourites = list.filter(isGuestFavourite);
        const guestRow = favourites.length >= 2;
        return {
          city,
          title: guestRow ? `Guest favourite homes in ${city}` : `Homes in ${city}`,
          subtitle: guestRow ? "Guests often rate these homes highly" : undefined,
          listings: guestRow ? favourites : list,
          href: searchHref({ location: city }),
        };
      }),
    [cities],
  );

  if (cities.length === 0) return null;

  return (
    <div className="space-y-6 md:space-y-10">
      <DestinationRow cities={cities} />
      {sections.map((section) => (
        <ListingRow
          key={section.title}
          title={section.title}
          subtitle={section.subtitle}
          href={section.href}
          listings={section.listings}
          onNeedAuth={onNeedAuth}
        />
      ))}
    </div>
  );
}
