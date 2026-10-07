"use client";

import dynamic from "next/dynamic";

const ExperienceMapInner = dynamic(() => import("@/components/experience/ExperienceMapInner"), {
  ssr: false,
  loading: () => <div className="h-[480px] w-full animate-pulse rounded-[var(--r-12)] bg-[#ebebeb]" aria-hidden />,
});

export function MeetingPointMap({
  name,
  address,
  lat,
  lng,
}: {
  name: string;
  address: string;
  lat: number;
  lng: number;
}) {
  return (
    <section className="mt-12 border-t border-hairline pt-12">
      <h2 className="text-[32px] font-semibold leading-9 tracking-[-0.02em] text-ink">Where we&apos;ll meet</h2>
      <p className="mt-4 text-base font-semibold leading-5 text-ink">{name}</p>
      <p className="mt-1 text-sm leading-[18px] text-muted">{address}</p>
      <div className="relative mt-6 h-[480px] overflow-hidden rounded-[var(--r-12)]">
        <ExperienceMapInner lat={lat} lng={lng} label={name} />
      </div>
    </section>
  );
}
