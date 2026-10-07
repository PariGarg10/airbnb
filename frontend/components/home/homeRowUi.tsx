"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LISTING_THUMB_WIDTH, listingPhotoUrl } from "@/lib/listingPhotoUrl";
import type { ListingSearchParams } from "@/types";

export function searchHref(params: ListingSearchParams) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (key === "page" || key === "page_size") return;
    if (typeof value !== "string" && typeof value !== "number") return;
    if (value === "") return;
    search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `/s?${text}` : "/s";
}

export function useRowScroller(itemCount: number) {
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

export function ArrowButton({
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

export function SeeAllTile({ href, photos }: { href: string; photos: string[] }) {
  const rootRef = useRef<HTMLAnchorElement>(null);
  const [play, setPlay] = useState(false);
  const stack = (photos.length >= 3 ? photos : [...photos, ...photos, ...photos]).slice(0, 3);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setPlay(true);
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Link ref={rootRef} href={href} className={`see-all-tile ${play ? "see-all-play" : ""}`}>
      <span className="see-all-fan" aria-hidden>
        {stack.map((photo, index) => (
          <span key={`${photo}-${index}`} className="see-all-card">
            <Image src={listingPhotoUrl(photo, LISTING_THUMB_WIDTH)} alt="" fill className="object-cover" sizes="120px" loading="lazy" />
          </span>
        ))}
      </span>
      <span className="see-all-label">See all</span>
    </Link>
  );
}
