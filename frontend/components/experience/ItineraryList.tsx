"use client";

import Image from "next/image";
import { listingPhotoUrl } from "@/lib/listingPhotoUrl";
import type { ExperienceItineraryItem } from "@/types/experience";

export function ItineraryList({ items }: { items: ExperienceItineraryItem[] }) {
  const sorted = [...items].sort((a, b) => a.position - b.position);
  return (
    <section className="mt-12">
      <h2 className="text-[32px] font-semibold leading-9 tracking-[-0.02em] text-ink">What you&apos;ll do</h2>
      <ol className="mt-8 space-y-8">
        {sorted.map((item) => (
          <li key={item.position} className="flex gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-soft">
              {item.image_url ? (
                <Image src={listingPhotoUrl(item.image_url, 128)} alt="" fill className="object-cover" sizes="64px" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold leading-5 text-ink">{item.title}</p>
              <p className="mt-1 text-sm leading-[18px] text-muted">{item.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
