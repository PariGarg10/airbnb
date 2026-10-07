"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ExperienceCard } from "@/components/catalog/ExperienceCard";
import type { ExperienceCard as ExperienceCardData } from "@/types/experience";

function useRowScroller(itemCount: number) {
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

export function ExperienceCatalogRow({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: ExperienceCardData[];
}) {
  const { ref, edges, scrollPage } = useRowScroller(items.length);
  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 md:flex-none">
          <h2 className="t-section-title min-w-0 pl-0.5 md:truncate">{title}</h2>
          {subtitle ? <p className="t-section-subtitle mt-0.5 pl-0.5">{subtitle}</p> : null}
        </div>
        <div className="hidden shrink-0 gap-1 md:flex">
          <button
            type="button"
            aria-label="Previous"
            disabled={!edges.prev}
            onClick={() => scrollPage(-1)}
            className="row-arrow flex h-7 w-7 items-center justify-center rounded-[50%] bg-quaternary disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Next"
            disabled={!edges.next}
            onClick={() => scrollPage(1)}
            className="row-arrow flex h-7 w-7 items-center justify-center rounded-[50%] bg-quaternary disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div ref={ref} className="home-row no-scrollbar">
        {items.map((item) => (
          <div key={item.id} className="home-row-card">
            <ExperienceCard experience={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
