"use client";

import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { listingsApi } from "@/lib/api";
import type { SearchFilters } from "@/hooks/useSearchFilters";

const AMENITY_CHIPS = ["Self check-in", "Wifi", "Free parking", "Air conditioning", "Pool"] as const;
const CATEGORY_CHIPS = ["Beachfront", "Cabins"] as const;

function Chip({
  selected,
  children,
  onClick,
}: {
  selected: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`t-chip flex h-10 shrink-0 items-center rounded-full border px-4 transition-[background-color,border-color,color] duration-200 ${
        selected
          ? "t-chip-selected border-ink bg-inverse hover:bg-inverse-hover"
          : "border-hairline bg-white hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function FilterChips({
  filters,
  activeCount,
  onChange,
  onOpenFilters,
}: {
  filters: SearchFilters;
  activeCount: number;
  onChange: (patch: Partial<SearchFilters>) => void;
  onOpenFilters: () => void;
}) {
  const amenities = useQuery({ queryKey: ["amenities"], queryFn: listingsApi.amenities });
  const byName = new Map((amenities.data ?? []).map((item) => [item.name, item.id]));

  const toggleAmenity = (name: string) => {
    const id = byName.get(name);
    if (id == null) return;
    const current = filters.amenities ?? [];
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    onChange({ amenities: next.length > 0 ? next : undefined });
  };

  return (
    <div className="no-scrollbar overflow-x-auto px-6 py-3 min-[1128px]:px-12 min-[1128px]:py-4">
      <div className="mx-auto flex w-max items-center gap-3 min-[1128px]:gap-2">
        <button
          type="button"
          onClick={onOpenFilters}
          className={`t-chip relative flex h-10 items-center gap-2 rounded-full border bg-white px-4 transition-[border-color] duration-200 min-[1128px]:h-10 min-[1128px]:px-4 ${
            activeCount > 0
              ? "border-ink min-[1128px]:border-ink min-[1128px]:font-normal"
              : "border-hairline hover:border-ink"
          }`}
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[11px] font-semibold leading-none text-white">
              {activeCount}
            </span>
          ) : null}
        </button>
        <span className="h-6 w-px shrink-0 bg-hairline" />
        <Chip selected={filters.min_rating != null} onClick={() => onChange({ min_rating: filters.min_rating != null ? undefined : 4.8 })}>
          Guest favourite
        </Chip>
        {AMENITY_CHIPS.map((name) => {
          const id = byName.get(name);
          const selected = id != null && (filters.amenities ?? []).includes(id);
          return (
            <Chip key={name} selected={selected} onClick={() => toggleAmenity(name)}>
              {name}
            </Chip>
          );
        })}
        {CATEGORY_CHIPS.map((name) => (
          <Chip key={name} selected={filters.category === name} onClick={() => onChange({ category: filters.category === name ? undefined : name })}>
            {name}
          </Chip>
        ))}
      </div>
    </div>
  );
}
