"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";

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

export function ListingSectionNav({ reserveVisible, priceLine, reserveHref, onPickDates }: ListingSectionNavProps) {
  const [active, setActive] = useState<(typeof LINKS)[number]["id"]>("photos");

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

  return (
    <nav
      aria-label="Listing sections"
      className="sticky top-[var(--header-h)] z-30 hidden border-b border-divider bg-white min-[1128px]:block"
    >
      <div className="flex h-[var(--listing-nav-h)] items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className={`border-b-2 pb-[18px] pt-5 text-sm font-medium leading-[18px] transition-colors duration-200 ${
                active === link.id ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>
        {!reserveVisible ? (
          <div className="flex items-center gap-4">
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
    </nav>
  );
}
