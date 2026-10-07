"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FiltersModal } from "@/components/search/FiltersModal";
import { GlideUnderline } from "@/components/ui/Glide";
import { iconForCategory } from "@/lib/categoryIcons";
import { listingsApi } from "@/lib/api";
import { useSearchFilters } from "@/hooks/useSearchFilters";

export function CategoryBar() {
  const pathname = usePathname();
  const { filters, setFilters, activeFilterCount } = useSearchFilters();
  const categories = useQuery({ queryKey: ["categories"], queryFn: listingsApi.categories });
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(80);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const header = document.getElementById("site-header");
    if (!header) return;
    const apply = () => setHeaderHeight(header.offsetHeight);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(header);
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const update = () => {
      setEdges({
        left: element.scrollLeft > 4,
        right: element.scrollLeft + element.clientWidth < element.scrollWidth - 4,
      });
    };
    update();
    element.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      element.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [categories.data]);

  const scrollBy = (distance: number) => {
    scroller.current?.scrollBy({ left: distance, behavior: "smooth" });
  };

  return (
    <div className="sticky z-30 border-b border-hairline bg-white" style={{ top: headerHeight }}>
      <div className="container-airbnb flex items-center gap-3">
        <div className="relative min-w-0 flex-1">
          {edges.left ? (
            <button
              type="button"
              aria-label="Scroll categories left"
              onClick={() => scrollBy(-240)}
              className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-hairline bg-white shadow"
            >
              <ChevronLeft size={16} />
            </button>
          ) : null}
          <GlideUnderline
            active={hover ?? filters.category ?? ""}
            mode="icon"
            onMouseLeave={() => setHover(null)}
            scrollerRef={scroller}
            className="no-scrollbar flex gap-7 overflow-x-auto py-4"
          >
            <div className="contents">
              {categories.data?.map((item) => {
                const Icon = iconForCategory(item.category);
                const active = (hover ?? filters.category) === item.category;
                return (
                  <button
                    key={item.category}
                    type="button"
                    data-glide={item.category}
                    onMouseEnter={() => setHover(item.category)}
                    onClick={() => setFilters({ category: filters.category === item.category ? undefined : item.category })}
                    className={`relative z-10 flex shrink-0 flex-col items-center gap-2 pb-2 text-label font-semibold transition-colors duration-200 ${active ? "text-ink" : "text-muted"}`}
                  >
                    <Icon size={24} strokeWidth={1.5} />
                    {item.category}
                  </button>
                );
              })}
            </div>
          </GlideUnderline>
          {edges.right ? (
            <button
              type="button"
              aria-label="Scroll categories right"
              onClick={() => scrollBy(240)}
              className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-hairline bg-white shadow"
            >
              <ChevronRight size={16} />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="mb-2 flex shrink-0 items-center gap-2 rounded-xl border border-hairline px-4 py-3 text-body font-semibold text-ink"
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeFilterCount > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-label text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>
      <FiltersModal
        open={filtersOpen}
        filters={filters}
        onClose={() => setFiltersOpen(false)}
        onApply={setFilters}
      />
    </div>
  );
}
