"use client";

import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatInr, formatRating } from "@/lib/format";
import { listingPhotoUrl, LISTING_PHOTO_FALLBACK } from "@/lib/listingPhotoUrl";
import type { ExperienceCard as ExperienceCardData } from "@/types/experience";

export function ExperienceCard({ experience }: { experience: ExperienceCardData }) {
  const photo = experience.cover_image ? listingPhotoUrl(experience.cover_image, 400) : LISTING_PHOTO_FALLBACK;
  return (
    <Link href={`/experiences/${experience.id}`} className="group block">
      <div className="relative aspect-[20/19] overflow-hidden rounded-[var(--card-radius)] bg-soft">
        <Image
          src={photo}
          alt=""
          fill
          className="object-cover transition duration-200 group-hover:brightness-95"
          sizes="320px"
        />
      </div>
      <p className="mt-2 truncate text-[15px] font-semibold leading-[19px] text-ink">{experience.title}</p>
      <p className="mt-0.5 text-[15px] leading-[19px] text-muted">{experience.city}</p>
      <p className="mt-1 flex items-center gap-1 text-[15px] leading-[19px] text-ink">
        <Star size={12} fill="currentColor" className="shrink-0" />
        {formatRating(experience.avg_rating)}
        {experience.review_count > 0 ? <span className="text-muted">({experience.review_count})</span> : null}
        <span className="text-muted">·</span>
        <span>
          From {formatInr(experience.price_per_guest)} <span className="font-normal text-muted">/ guest</span>
        </span>
      </p>
    </Link>
  );
}
