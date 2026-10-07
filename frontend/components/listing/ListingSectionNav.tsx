"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const LINKS = [
  { id: "photos", label: "Photos" },
  { id: "amenities", label: "Amenities" },
  { id: "reviews", label: "Reviews" },
  { id: "location", label: "Location" },
] as const;

interface ListingSectionNavProps {
  reserveVisible: boolean;
  priceLine: ReactNode;
  reserveHref: string;
  onPickDates: () => void;
}

/** Space still occupied at the top of the viewport. The site header scrolls away, so this is 0 once it has left. */
function topOccupiedPx(): number {
  const header = document.getElementById("site-header");
  if (!header) return 0;
  return Math.max(0, header.getBoundingClientRect().bottom);
}

export function ListingSectionNav({ reserveVisible, priceLine, reserveHref, onPickDates }: ListingSectionNavProps) {
  const [active, setActive] = useState<(typeof LINKS)[number]["id"]>("photos");
  const [pinned, setPinned] = useState(false);
  const [headerTop, setHeaderTop] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const updatePinned = () => {
      const top = topOccupiedPx();
      setHeaderTop(top);
      setPinned(sentinel.getBoundingClientRect().top <= top + 1);
    };

    updatePinned();
    window.addEventListener("scroll", updatePinned, { passive: true });
    window.addEventListener("resize", updatePinned);
    return () => {
      window.removeEventListener("scroll", updatePinned);
      window.removeEventListener("resize", updatePinned);
    };
  }, []);

  useEffect(() => {
    const nodes = LINKS.map((link) => document.getElementById(link.id)).filter(Boolean) as HTMLElement[];
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const id = visible[0]?.target.id;
        if (id === "photos" || id === "amenities" || id === "reviews" || id === "location") setActive(id);
      },
      { rootMargin: "-40% 0px -45% 0px", threshold: [0, 0.1, 0.25] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const bar = (
    <div className="container-airbnb flex h-[var(--listing-nav-h)] items-center justify-between gap-6">
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar min-[1128px]:gap-8">
        {LINKS.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className={`shrink-0 border-b-2 pb-[18px] pt-5 text-sm font-medium leading-[18px] transition-colors duration-200 ${
              active === link.id ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {link.label}
          </a>
        ))}
      </div>
      {!reserveVisible ? (
        <div className="hidden shrink-0 items-center gap-4 min-[1128px]:flex">
          <p className="text-sm leading-[18px]">
            <span className="font-semibold underline">{priceLine}</span>
          </p>
          {reserveHref ? (
            <Link
              href={reserveHref}
              className="search-fill inline-flex h-12 items-center rounded-lg px-6 text-base font-semibold text-white"
            >
              Reserve
            </Link>
          ) : (
            <button
              type="button"
              onClick={onPickDates}
              className="search-fill inline-flex h-12 items-center rounded-lg px-6 text-base font-semibold text-white"
            >
              Check availability
            </button>
          )}
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />
      {pinned ? <div className="h-[var(--listing-nav-h)]" aria-hidden /> : null}
      <nav
        aria-label="Listing sections"
        className={`z-40 border-b border-divider bg-white ${pinned ? "fixed inset-x-0 shadow-[0_1px_0_#ebebeb]" : "relative"}`}
        style={pinned ? { top: headerTop } : undefined}
      >
        {bar}
      </nav>
    </>
  );
}
