"use client";

import dynamic from "next/dynamic";
import { cityBlurb } from "@/lib/cityBlurbs";

const ListingMap = dynamic(() => import("@/components/listing/ListingMap"), {
  ssr: false,
  loading: () => (
    <div className="listing-map h-[420px] w-full rounded-2xl bg-[#ebebeb] min-[1128px]:h-[480px] min-[1128px]:rounded-2xl" aria-hidden />
  ),
});

export function ListingLocationSection({
  city,
  state,
  country,
  lat,
  lng,
  approximate = false,
}: {
  city: string;
  state: string | null;
  country: string;
  lat: number;
  lng: number;
  approximate?: boolean;
}) {
  const blurb = cityBlurb(city);
  const locationLine = [city, state, country].filter(Boolean).join(", ");

  return (
    <section id="location" className="scroll-mt-[var(--listing-nav-h)]">
      <h2 className="t-heading min-[1128px]:text-[22px] min-[1128px]:leading-[26px] min-[1128px]:tracking-[-0.0275rem]">
        Where you&apos;ll be
      </h2>
      <p className="mt-3 font-semibold min-[1128px]:mt-4 min-[1128px]:text-base min-[1128px]:leading-5">{city}</p>
      <p className="mt-1 text-meta text-muted min-[1128px]:hidden">Exact location will be provided after booking.</p>
      {blurb ? (
        <p className="mt-2 hidden max-w-[720px] text-base leading-6 text-muted min-[1128px]:block">{blurb}</p>
      ) : null}
      <div className="listing-map relative mt-4 h-[420px] overflow-hidden rounded-2xl min-[1128px]:mt-6 min-[1128px]:h-[480px] min-[1128px]:rounded-2xl">
        <ListingMap lat={lat} lng={lng} approximate={approximate} />
      </div>
      <p className="mt-3 hidden text-sm font-semibold leading-[18px] text-ink min-[1128px]:block">{locationLine}</p>
      <p className="mt-1 hidden text-sm leading-[18px] text-muted min-[1128px]:block">
        Exact location provided after booking.
      </p>
    </section>
  );
}
