"use client";

import { useQueries } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SwitchUserModal } from "@/components/auth/SwitchUserModal";
import { ArrowButton, SeeAllTile, searchHref, useRowScroller } from "@/components/home/homeRowUi";
import { ListingCard } from "@/components/listings/ListingCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { listingsApi } from "@/lib/api";
import { APP_NAME } from "@/lib/brand";
import { DESTINATIONS } from "@/lib/destinations";
import { listingPhotoUrl } from "@/lib/listingPhotoUrl";
import type { ListingCard as ListingCardData, ListingSearchParams } from "@/types";

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

function bestCover(items: ListingCardData[]) {
  return [...items].sort((a, b) => b.avg_rating - a.avg_rating || b.review_count - a.review_count)[0];
}

function RowSkeleton() {
  return (
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

function PromoArt({ src }: { src: string }) {
  return <img src={src} alt="" className="h-14 w-14 shrink-0 object-contain md:h-16 md:w-16" />;
}

const PROMOS = [
  {
    title: "Your first stay, now 10% off",
    href: "/s",
    art: "/icons/promo-first-stay.png",
  },
  {
    title: "Explore beachfront retreats",
    href: "/s?category=Beachfront",
    art: "/icons/promo-beachfront.png",
  },
  {
    title: "Discover Guest favourites",
    subtitle: `The most loved homes on ${APP_NAME}, near you`,
    href: "/s?min_rating=4.8",
    art: "/icons/promo-guest-favourites.png",
  },
] as const;

export function HomePage() {
  const [authOpen, setAuthOpen] = useState(false);
  const cities = useMemo(() => DESTINATIONS.filter((item) => item.query), []);
  const rows = useMemo(
    () => [
      {
        id: "goa",
        title: "Guest favourite homes in Goa",
        params: { location: "Goa", page_size: 18 } satisfies ListingSearchParams,
      },
      {
        id: "manali",
        title: "Popular homes in Manali",
        params: { location: "Manali", page_size: 18 } satisfies ListingSearchParams,
      },
      {
        id: "jaipur",
        title: "Guest favourite homes in Jaipur",
        params: { location: "Jaipur", page_size: 18 } satisfies ListingSearchParams,
      },
      {
        id: "udaipur",
        title: "Popular homes in Udaipur",
        params: { location: "Udaipur", page_size: 18 } satisfies ListingSearchParams,
      },
      {
        id: "rishikesh",
        title: "Stays in Rishikesh",
        params: { location: "Rishikesh", page_size: 18 } satisfies ListingSearchParams,
      },
      {
        id: "coorg",
        title: "Homes in Coorg",
        params: { location: "Coorg", page_size: 18 } satisfies ListingSearchParams,
      },
      {
        id: "munnar",
        title: "Popular stays in Munnar",
        params: { location: "Munnar", page_size: 18 } satisfies ListingSearchParams,
      },
      {
        id: "mumbai",
        title: "Popular homes in Mumbai",
        params: { location: "Mumbai", page_size: 18 } satisfies ListingSearchParams,
      },
      {
        id: "bali",
        title: "Guest favourite homes in Bali",
        params: { location: "Bali", page_size: 18 } satisfies ListingSearchParams,
      },
      {
        id: "lisbon",
        title: "Homes in Lisbon",
        params: { location: "Lisbon", page_size: 18 } satisfies ListingSearchParams,
      },
      {
        id: "tokyo",
        title: "Stays in Tokyo",
        params: { location: "Tokyo", page_size: 18 } satisfies ListingSearchParams,
      },
      {
        id: "santorini",
        title: "Guest favourites in Santorini",
        params: { location: "Santorini", page_size: 18 } satisfies ListingSearchParams,
      },
    ],
    [],
  );

  const coverQueries = useMemo(
    () =>
      cities.map((city) => ({
        queryKey: ["home-cover", city.query],
        queryFn: () => listingsApi.search({ location: city.query, page_size: 20 }),
      })),
    [cities],
  );
  const rowQueries = useMemo(
    () =>
      rows.map((row) => ({
        queryKey: ["home-row", row.id, row.params],
        queryFn: () => listingsApi.search(row.params),
      })),
    [rows],
  );

  const covers = useQueries({ queries: coverQueries });
  const listingRows = useQueries({ queries: rowQueries });

  return (
    <main className="container-home space-y-6 pb-12 md:space-y-10 md:pt-[54px]">
      <DestinationRow cities={cities} covers={covers} />

      <section className="promo-row no-scrollbar">
        {PROMOS.map((promo) => {
          return (
            <Link key={promo.title} href={promo.href} role="link" className="promo-card group">
              <PromoArt src={promo.art} />
              <span className="min-w-0 flex-1">
                <span className="t-promo-title">{promo.title}</span>
                {"subtitle" in promo && promo.subtitle ? <span className="t-promo-subtitle mt-0.5 block">{promo.subtitle}</span> : null}
              </span>
              <span className="t-promo-button ml-auto inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full bg-quaternary px-3 transition-colors duration-200 ease-standard group-hover:bg-quaternary-hover">
                Browse homes
              </span>
            </Link>
          );
        })}
      </section>

      {rows.map((row, index) => {
        const query = listingRows[index];
        if (!query || query.isLoading) return <RowSkeleton key={row.id} />;
        const items = query.data?.items ?? [];
        if (query.isError || items.length === 0) return null;
        return (
          <ListingRow
            key={row.id}
            title={row.title}
            href={searchHref(row.params)}
            listings={items}
            onNeedAuth={() => setAuthOpen(true)}
          />
        );
      })}

      <SwitchUserModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </main>
  );
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
      src={listingPhotoUrl(current, 400)}
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

function DestinationRow({
  cities,
  covers,
}: {
  cities: { id: string; title: string; subtitle: string; query: string }[];
  covers: { isLoading: boolean; isError: boolean; data?: { items: ListingCardData[] } }[];
}) {
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
        {cities.map((city, index) => {
          const query = covers[index];
          if (!query || query.isLoading) {
            return (
              <div key={city.id} className="w-[clamp(92px,11vw,124px)] shrink-0">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="mt-2 h-4 w-16" />
                <Skeleton className="mt-2 h-3 w-24" />
              </div>
            );
          }
          const cover = query.isError ? undefined : bestCover(query.data?.items ?? []);
          return (
            <Link key={city.id} href={searchHref({ location: city.query })} className="w-[clamp(92px,11vw,124px)] shrink-0 snap-start">
              <span className="relative block aspect-square w-full overflow-hidden rounded-xl bg-soft">
                <CoverPhoto src={cover?.images[0] || COVER_FALLBACKS[city.title]} alt={city.title} />
              </span>
              <span className="t-destination-name mt-2 block truncate">{city.title}</span>
              <span className="t-destination-tag block truncate">{city.subtitle}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
