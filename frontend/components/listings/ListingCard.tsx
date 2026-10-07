"use client";

import { ChevronLeft, ChevronRight, Heart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import { useAuth } from "@/lib/auth";
import { formatInr, formatRating, formatResultsStayRange, propertyLabel } from "@/lib/format";
import { useWishlist } from "@/hooks/useWishlist";
import { isGuestFavourite } from "@/lib/isGuestFavourite";
import {
  LISTING_CARD_SIZES,
  LISTING_CARD_WIDTH,
  LISTING_PHOTO_FALLBACK,
  listingPhotoUrl,
} from "@/lib/listingPhotoUrl";
import type { ListingCard as ListingCardData } from "@/types";

interface ListingCardProps {
  listing: ListingCardData;
  href: string;
  active?: boolean;
  onHover?: (id: number | null) => void;
  onNeedAuth: () => void;
  variant?: "grid" | "mini" | "row" | "results" | "rail";
  nights?: number;
  stayDates?: { checkIn: string; checkOut: string };
  priority?: boolean;
}

export function ListingCard({
  listing,
  href,
  active = false,
  onHover,
  onNeedAuth,
  variant = "grid",
  nights,
  stayDates,
  priority = false,
}: ListingCardProps) {
  const { user } = useAuth();
  const { onHeart } = useWishlist();
  const [index, setIndex] = useState(0);
  const [heartBeat, setHeartBeat] = useState(0);
  const images = listing.images.length > 0 ? listing.images : [];
  const photo = images[index];
  const [photoSrc, setPhotoSrc] = useState(() =>
    photo ? listingPhotoUrl(photo, LISTING_CARD_WIDTH) : LISTING_PHOTO_FALLBACK,
  );
  useEffect(() => {
    setPhotoSrc(photo ? listingPhotoUrl(photo, LISTING_CARD_WIDTH) : LISTING_PHOTO_FALLBACK);
  }, [photo]);
  const guestFavourite = isGuestFavourite(listing);
  const placeName =
    listing.room_type === "private_room"
      ? `Room in ${listing.city}`
      : listing.room_type === "shared_room"
        ? `Shared room in ${listing.city}`
        : `${listing.property_type === "apartment" ? "Flat" : listing.property_type === "house" ? "Home" : propertyLabel(listing.property_type)} in ${listing.city}`;

  const save = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      onNeedAuth();
      return;
    }
    onHeart({ id: listing.id, is_wishlisted: listing.is_wishlisted, image: photo });
    if (variant === "row" || variant === "rail") setHeartBeat((current) => current + 1);
  };

  const railTitle = (() => {
    if (listing.room_type === "private_room") return `Room in ${listing.city}`;
    if (listing.room_type === "shared_room") return `Shared room in ${listing.city}`;
    const kind =
      listing.property_type === "apartment"
        ? "Flat"
        : listing.property_type === "house"
          ? "Home"
          : listing.property_type === "guesthouse"
            ? "Guest house"
            : propertyLabel(listing.property_type);
    return `${kind} in ${listing.city}`;
  })();

  const stayNights = listing.stay_total != null ? (listing.nights ?? nights ?? 1) : 1;
  const stayAmount = listing.stay_total != null ? listing.stay_total : listing.price_per_night;
  const stayOriginal =
    listing.stay_original_total != null && listing.stay_total != null && listing.stay_original_total > listing.stay_total
      ? listing.stay_original_total
      : null;
  const ratingLabel = listing.review_count > 0 ? `★ ${formatRating(listing.avg_rating)}` : "★ New";
  const rowTitle =
    listing.room_type === "private_room"
      ? `Room in ${listing.city}`
      : listing.room_type === "shared_room"
        ? `Shared room in ${listing.city}`
        : `${propertyLabel(listing.property_type)} in ${listing.city}`;

  const step = (event: MouseEvent, direction: -1 | 1) => {
    event.preventDefault();
    event.stopPropagation();
    setIndex((current) => {
      const next = current + direction;
      if (next < 0 || next >= images.length) return current;
      return next;
    });
  };

  return (
    <article
      className={`group ${variant === "rail" ? "rounded-[var(--card-radius)]" : ""} ${active ? "rounded-xl ring-2 ring-ink" : ""}`}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div
        className={`relative overflow-hidden rounded-[var(--card-radius)] bg-[var(--image-placeholder)] ${variant === "rail" ? "rail-image" : ""} ${
          variant === "mini" ? "aspect-[4/3]" : variant === "grid" ? "aspect-square" : "aspect-[20/19]"
        }`}
      >
        {photo ? (
          <Image
            src={photoSrc}
            alt=""
            fill
            className="object-cover"
            sizes={
              variant === "rail"
                ? "280px"
                : variant === "row" || variant === "results"
                  ? "320px"
                  : variant === "mini"
                    ? "240px"
                    : LISTING_CARD_SIZES
            }
            priority={priority}
            loading={priority ? undefined : "lazy"}
            onError={() => {
              if (photoSrc !== LISTING_PHOTO_FALLBACK) setPhotoSrc(LISTING_PHOTO_FALLBACK);
            }}
          />
        ) : (
          <div className="h-full w-full bg-[var(--image-placeholder)]" />
        )}
        {guestFavourite ? (
          <span
            className={`absolute left-3 top-3 ${
              variant === "rail" || variant === "results"
                ? "t-guest-pill inline-flex max-w-[calc(100%-60px)] rounded-[var(--r-badge)] border border-white/50 bg-white/80 px-[9.5px] py-[5.5px] shadow-badge backdrop-blur-[32px]"
                : variant === "row"
                  ? "t-guest-pill-lg rounded-full bg-white px-3 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.18)]"
                  : "t-guest-pill-lg rounded-full bg-white px-3 py-1 shadow-sm"
            }`}
          >
            <span>Guest favourite</span>
          </span>
        ) : listing.host_is_superhost && variant === "results" ? (
          <span className="t-superhost-pill absolute left-3 top-3 rounded-[var(--r-badge)] bg-black/50 px-3 py-1.5 backdrop-blur-[32px]">
            Superhost
          </span>
        ) : null}
        <button
          type="button"
          aria-label={listing.is_wishlisted ? "Remove from wishlist" : "Save"}
          onClick={save}
          className={
            variant === "rail"
              ? "card-heart absolute right-2 top-2 z-10 flex h-8 w-8 items-start justify-center rounded-[50%] pt-[5px]"
              : "absolute right-3 top-3 z-10"
          }
          style={variant === "row" || variant === "rail" ? (heartBeat > 0 ? { animation: "heart-pop 150ms ease-out" } : undefined) : undefined}
          key={variant === "row" || variant === "rail" ? heartBeat : undefined}
        >
          <Heart
            size={24}
            className={
              listing.is_wishlisted
                ? variant === "row" || variant === "results" || variant === "rail"
                  ? "fill-rausch text-white"
                  : "fill-rausch text-rausch"
                : "fill-black/50 text-white"
            }
            strokeWidth={variant === "row" || variant === "results" || variant === "rail" ? 2 : 1.75}
          />
        </button>
        {(variant === "grid" || variant === "results") && images.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={(event) => step(event, -1)}
              className={`absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white opacity-0 shadow transition-opacity duration-200 group-hover:opacity-100 ${index === 0 ? "pointer-events-none" : ""}`}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={(event) => step(event, 1)}
              className={`absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white opacity-0 shadow transition-opacity duration-200 group-hover:opacity-100 ${index === images.length - 1 ? "pointer-events-none" : ""}`}
            >
              <ChevronRight size={16} />
            </button>
            <div className="pointer-events-none absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1">
              {images.map((image, dot) => (
                <span key={`${listing.id}-${dot}`} className={`h-1.5 w-1.5 rounded-full ${dot === index ? "bg-white" : "bg-white/60"}`} />
              ))}
            </div>
          </>
        ) : null}
        <Link href={href} target="_blank" rel="noreferrer" className="absolute inset-0 z-0" aria-label={listing.title} />
      </div>
      {variant === "rail" ? (
        <Link href={href} target="_blank" rel="noreferrer" className="mt-2 block px-1">
          <p className="t-rail-title line-clamp-3">{railTitle}</p>
          <p className="t-rail-meta mt-0.5 flex items-center whitespace-nowrap">
            <span className="min-w-0 truncate">{formatInr(listing.price_per_night)} for 1 night</span>
            <span className="shrink-0 px-1">·</span>
            <Star size={10} className="shrink-0 fill-muted text-muted" aria-hidden />
            <span className="ml-1 shrink-0">{listing.review_count > 0 ? formatRating(listing.avg_rating) : "New"}</span>
          </p>
        </Link>
      ) : variant === "row" ? (
        <Link href={href} target="_blank" rel="noreferrer" className="mt-2 block">
          <p className="t-card-title truncate">{rowTitle}</p>
          <p className="t-meta">
            {stayOriginal ? (
              <>
                <span className="text-muted line-through">{formatInr(stayOriginal)}</span>{" "}
              </>
            ) : null}
            {formatInr(stayAmount)} for {stayNights === 1 ? "1 night" : `${stayNights} nights`} · {ratingLabel}
          </p>
        </Link>
      ) : variant === "results" ? (
        <Link href={href} target="_blank" rel="noreferrer" className="mt-2 block">
          <div className="flex items-start justify-between gap-3">
            <p className="t-results-title truncate">{placeName}</p>
            <p className="t-results-rating shrink-0">
              {listing.review_count > 0 ? `★ ${formatRating(listing.avg_rating)} (${listing.review_count})` : "★ New"}
            </p>
          </div>
          <p className="t-results-subtitle truncate">{listing.title}</p>
          <p className="t-results-subtitle truncate">
            {listing.bedrooms === 1 ? "1 bedroom" : `${listing.bedrooms ?? 0} bedrooms`} · {listing.beds === 1 ? "1 bed" : `${listing.beds ?? 0} beds`}
          </p>
          {stayDates ? (
            <p className="t-results-subtitle truncate">{formatResultsStayRange(stayDates.checkIn, stayDates.checkOut)}</p>
          ) : null}
          <p className="mt-0.5">
            <span className="t-results-price-line">
              {stayOriginal ? (
                <span className="t-results-price-strong text-muted line-through">{formatInr(stayOriginal)} </span>
              ) : null}
              <span className="t-results-price-strong">{formatInr(stayAmount)}</span>{" "}
              <span className="t-results-price-tail">{stayNights === 1 ? "for 1 night" : `for ${stayNights} nights`}</span>
            </span>
          </p>
        </Link>
      ) : (
        <Link href={href} target="_blank" rel="noreferrer" className="mt-3 block">
          <div className="flex items-start justify-between gap-3">
            <p className="t-card-title truncate">{placeName}</p>
            {listing.review_count > 0 ? (
              <p className="t-results-rating shrink-0">★ {formatRating(listing.avg_rating)}</p>
            ) : null}
          </div>
          <p className="t-card-title mt-1">
            <span className="font-semibold">{formatInr(listing.price_per_night)}</span> night
          </p>
        </Link>
      )}
    </article>
  );
}
