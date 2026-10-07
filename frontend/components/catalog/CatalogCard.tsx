"use client";

import { Heart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toastComingSoonWishlist } from "@/lib/toastUi";
import { formatInr, formatRating } from "@/lib/format";
import type { CatalogItem } from "@/lib/mock/experiences";

export function CatalogCard({ item }: { item: CatalogItem }) {
  const [saved, setSaved] = useState(false);

  const save = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setSaved((open) => !open);
    toastComingSoonWishlist(item.image);
  };

  return (
    <article className="group rounded-[var(--card-radius)]">
      <Link href="/coming-soon" className="catalog-card block w-full cursor-pointer">
        <div className="relative aspect-[20/19] overflow-hidden rounded-[var(--card-radius)] bg-[var(--image-placeholder)] rail-image">
          <Image
            src={item.image}
            alt=""
            fill
            sizes="280px"
            className="object-cover transition duration-200 group-hover:brightness-[0.92]"
          />
          {item.badge ? (
            <span className="t-guest-pill absolute left-3 top-3 inline-flex max-w-[calc(100%-60px)] rounded-[var(--r-badge)] border border-white/50 bg-white/80 px-[9.5px] py-[5.5px] shadow-badge backdrop-blur-[32px]">
              {item.badge}
            </span>
          ) : null}
          {item.popular ? (
            <span className="t-guest-pill absolute left-3 top-3 inline-flex max-w-[calc(100%-60px)] rounded-[var(--r-badge)] border border-white/50 bg-white/80 px-[9.5px] py-[5.5px] shadow-badge backdrop-blur-[32px]">
              Popular
            </span>
          ) : null}
          <button
            type="button"
            aria-label={saved ? "Remove from wishlist" : "Save"}
            onClick={save}
            className="card-heart absolute right-2 top-2 z-10 flex h-8 w-8 items-start justify-center rounded-[50%] pt-[5px]"
          >
            <Heart
              size={24}
              className={saved ? "fill-rausch text-white" : "fill-black/50 text-white"}
              strokeWidth={2}
            />
          </button>
        </div>
        <p className="t-rail-title mt-2 line-clamp-3 px-1">{item.title}</p>
        <p className="t-rail-meta mt-0.5 flex items-center whitespace-nowrap px-1">
          <span className="min-w-0 truncate">From {formatInr(item.price)} / guest</span>
          <span className="shrink-0 px-1">·</span>
          <Star size={10} className="shrink-0 fill-muted text-muted" aria-hidden />
          <span className="ml-1 shrink-0">{formatRating(item.rating)}</span>
        </p>
      </Link>
    </article>
  );
}
