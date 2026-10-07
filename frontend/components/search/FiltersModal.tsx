"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { Award, ChevronDown, Minus, PawPrint, Plus, Zap } from "lucide-react";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Modal } from "@/components/ui/Modal";

import { listingsApi } from "@/lib/api";

import { amenityIcon } from "@/lib/amenityIcons";

import { propertyTypeIcons } from "@/lib/categoryIcons";

import { GUEST_FAVOURITE_BLURB } from "@/lib/brand";
import { formatInr, propertyLabel } from "@/lib/format";

import {
  countActiveFilters,
  type SearchFilters,
} from "@/hooks/useSearchFilters";

import type { Amenity, PropertyType, RoomType } from "@/types";

const PRICE_FLOOR = 0;

const PRICE_CEILING = 100_000;

const GROUP_ORDER = ["Essentials", "Features", "Location", "Safety"];

const HISTOGRAM_BARS = 52;

const DESKTOP_AMENITY_PREVIEW = 6;

const RECOMMENDED_NAMES = [
  "Washer",
  "Free parking",
  "Kitchen",
  "Pool",
] as const;

const SELF_CHECKIN_NAME = "Self check-in";

interface FiltersModalProps {
  open: boolean;

  filters: SearchFilters;

  onClose: () => void;

  onApply: (patch: Partial<SearchFilters>) => void;
}

const ROOM_OPTIONS: { label: string; value?: RoomType }[] = [
  { label: "Any", value: undefined },

  { label: "Room", value: "private_room" },

  { label: "Entire home", value: "entire_place" },
];

const DESKTOP_ROOM_OPTIONS: { label: string; value?: RoomType }[] = [
  { label: "Any type", value: undefined },

  { label: "Room", value: "private_room" },

  { label: "Entire home", value: "entire_place" },
];

const PROPERTY_TYPES = Object.keys(propertyTypeIcons) as PropertyType[];

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);

    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function formatShowPlaces(total: number | undefined): string {
  if (total == null) return "Show places";

  if (total >= 1000) return "Show 1,000+ places";

  return `Show ${new Intl.NumberFormat("en-IN").format(total)} places`;
}

function FilterSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-divider py-6 first:border-t-0 first:pt-0">
      <h3 className="text-base font-semibold leading-5 text-ink">{title}</h3>

      {subtitle ? (
        <p className="mt-1 text-sm leading-[18px] text-muted">{subtitle}</p>
      ) : null}

      {children}
    </section>
  );
}

function PriceHistogram({
  prices,

  minValue,

  maxValue,
}: {
  prices: number[];

  minValue: number;

  maxValue: number;
}) {
  const buckets = useMemo(() => {
    const counts = new Array(HISTOGRAM_BARS).fill(0);

    prices.forEach((price) => {
      const index = Math.min(
        HISTOGRAM_BARS - 1,
        Math.floor((price / PRICE_CEILING) * HISTOGRAM_BARS),
      );

      counts[index] += 1;
    });

    const peak = Math.max(...counts, 1);

    return counts.map((count) => count / peak);
  }, [prices]);

  return (
    <div className="mt-6 flex h-[72px] items-end gap-px" aria-hidden>
      {buckets.map((height, index) => {
        const start = (index / HISTOGRAM_BARS) * PRICE_CEILING;

        const end = ((index + 1) / HISTOGRAM_BARS) * PRICE_CEILING;

        const active = end >= minValue && start <= maxValue;

        return (
          <div
            key={index}

            className={`min-h-[3px] flex-1 rounded-t-[2px] ${active ? "bg-rausch" : "bg-[var(--border)]"}`}

            style={{ height: `${Math.max(8, height * 100)}%` }}
          />
        );
      })}
    </div>
  );
}

function AmenityPill({
  amenity,
  selected,
  onToggle,
}: {
  amenity: Amenity;
  selected: boolean;
  onToggle: () => void;
}) {
  const Icon = amenityIcon(amenity.icon);

  return (
    <button
      type="button"

      onClick={onToggle}

      className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm leading-[18px] text-ink transition-[border-color,background-color] duration-200 ${
        selected
          ? "border-2 border-ink bg-white"
          : "border border-hairline bg-white hover:border-ink"
      }`}
    >
      <Icon size={16} className="shrink-0" strokeWidth={1.75} />

      {amenity.name}
    </button>
  );
}

function RecommendedTile({
  amenity,
  selected,
  onToggle,
}: {
  amenity: Amenity;
  selected: boolean;
  onToggle: () => void;
}) {
  const Icon = amenityIcon(amenity.icon);

  return (
    <button
      type="button"

      onClick={onToggle}

      className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center text-xs leading-4 text-ink transition-[border-color] duration-200 ${
        selected
          ? "border-2 border-ink"
          : "border border-hairline hover:border-ink"
      }`}
    >
      <Icon size={24} strokeWidth={1.5} />

      <span>{amenity.name}</span>
    </button>
  );
}

function StandoutTile({
  title,

  subtitle,

  icon,

  selected,

  onClick,
}: {
  title: string;

  subtitle: string;

  icon: ReactNode;

  selected: boolean;

  onClick: () => void;
}) {
  return (
    <button
      type="button"

      onClick={onClick}

      className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-[border-color] duration-200 ${
        selected
          ? "border-2 border-ink"
          : "border border-hairline hover:border-ink"
      }`}
    >
      <span className="text-ink">{icon}</span>

      <span className="text-sm font-semibold leading-[18px] text-ink">
        {title}
      </span>

      <span className="text-xs leading-4 text-muted">{subtitle}</span>
    </button>
  );
}

const STEPPER_BTN =
  "flex h-8 w-8 items-center justify-center rounded-full bg-quaternary text-ink transition-[background-color,color] duration-200 ease-standard hover:bg-divider disabled:cursor-not-allowed disabled:bg-quaternary disabled:text-disabled disabled:hover:bg-quaternary";

function formatStepperValue(value: number | undefined, step: number): string {
  if (value == null) return "Any";
  return step < 1 ? (Number.isInteger(value) ? String(value) : value.toFixed(1)) : String(value);
}

function CountRow({
  label,
  value,
  onChange,
  min = 1,
  max = 16,
  step = 1,
  decreaseLabel,
  increaseLabel,
}: {
  label: string;
  value: number | undefined;
  onChange: (next: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  const atAny = value == null;
  const round = (n: number) => (step < 1 ? Math.round(n * 2) / 2 : Math.round(n));

  return (
    <div className="flex items-center justify-between border-b border-divider py-5 last:border-b-0">
      <span className="text-base font-medium leading-5 text-ink">{label}</span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label={decreaseLabel}
          disabled={atAny}
          className={STEPPER_BTN}
          onClick={() => {
            if (value == null) return;
            const next = round(value - step);
            onChange(next < min ? undefined : next);
          }}
        >
          <Minus size={14} />
        </button>
        <span className="min-w-8 text-center text-base leading-5 text-ink">{formatStepperValue(value, step)}</span>
        <button
          type="button"
          aria-label={increaseLabel}
          disabled={value != null && value >= max}
          className={STEPPER_BTN}
          onClick={() => onChange(atAny ? min : round(Math.min(max, (value ?? 0) + step)))}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function BookingOptionPill({
  label,
  icon: Icon,
  selected,
  onClick,
}: {
  label: string;
  icon: typeof Zap;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm leading-[18px] text-ink transition-[border-color] duration-200 ${
        selected ? "border-2 border-ink bg-white" : "border border-hairline bg-white hover:border-ink"
      }`}
    >
      <Icon size={16} className="shrink-0" strokeWidth={1.75} />
      {label}
    </button>
  );
}

function FilterAccordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children?: ReactNode;
}) {
  return (
    <section className="border-t border-divider py-2">
      <button type="button" className="flex w-full items-center justify-between py-4 text-left" onClick={onToggle} aria-expanded={open}>
        <span className="text-base font-semibold leading-5 text-ink">{title}</span>
        <ChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? children : null}
    </section>
  );
}

export function FiltersModal({
  open,
  filters,
  onClose,
  onApply,
}: FiltersModalProps) {
  const [draft, setDraft] = useState<SearchFilters>(filters);

  const [showAllAmenities, setShowAllAmenities] = useState(false);

  const [propertyOpen, setPropertyOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [hostLanguageOpen, setHostLanguageOpen] = useState(false);

  const debounced = useDebounced(draft, 300);

  const amenities = useQuery({
    queryKey: ["amenities"],

    queryFn: listingsApi.amenities,

    enabled: open,
  });

  const count = useQuery({
    queryKey: ["listing-count", debounced],

    queryFn: () => listingsApi.search({ ...debounced, page: 1, page_size: 1 }),

    enabled: open,

    placeholderData: keepPreviousData,
  });

  const priceSamples = useQuery({
    queryKey: [
      "filter-price-samples",
      filters.location,
      filters.check_in,
      filters.check_out,
      filters.guests,
    ],

    queryFn: () =>
      listingsApi.search({
        location: filters.location,

        check_in: filters.check_in,

        check_out: filters.check_out,

        guests: filters.guests,

        page: 1,

        page_size: 50,
      }),

    enabled: open,

    select: (data) => data.items.map((item) => item.price_per_night),
  });

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: listingsApi.categories,
    enabled: open,
  });

  const groupedByGroup = useMemo(() => {
    const rows = amenities.data ?? [];
    const buckets = new Map<string, Amenity[]>();
    rows.forEach((amenity) => {
      const list = buckets.get(amenity.group_name) ?? [];
      list.push(amenity);
      buckets.set(amenity.group_name, list);
    });
    const names = Array.from(buckets.keys()).sort((left, right) => {
      const leftIndex = GROUP_ORDER.indexOf(left);
      const rightIndex = GROUP_ORDER.indexOf(right);
      return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
    });
    return names.map((name) => ({ name, items: buckets.get(name) ?? [] }));
  }, [amenities.data]);

  useEffect(() => {
    if (open) {
      setDraft(filters);

      setShowAllAmenities(false);

      setPropertyOpen(false);
      setAccessibilityOpen(false);
      setHostLanguageOpen(false);
    }
  }, [open, filters]);

  const byName = useMemo(
    () => new Map((amenities.data ?? []).map((item) => [item.name, item])),
    [amenities.data],
  );

  const grouped = useMemo(() => {
    const rows = amenities.data ?? [];

    const buckets = new Map<string, Amenity[]>();

    rows.forEach((amenity) => {
      const list = buckets.get(amenity.group_name) ?? [];

      list.push(amenity);

      buckets.set(amenity.group_name, list);
    });

    const names = Array.from(buckets.keys()).sort((left, right) => {
      const leftIndex = GROUP_ORDER.indexOf(left);

      const rightIndex = GROUP_ORDER.indexOf(right);

      return (
        (leftIndex === -1 ? 99 : leftIndex) -
        (rightIndex === -1 ? 99 : rightIndex)
      );
    });

    return names.flatMap((name) => buckets.get(name) ?? []);
  }, [amenities.data]);

  const visibleAmenities = showAllAmenities
    ? grouped
    : grouped.slice(0, DESKTOP_AMENITY_PREVIEW);

  const minValue = draft.min_price ?? PRICE_FLOOR;

  const maxValue = draft.max_price ?? PRICE_CEILING;

  const left = (minValue / PRICE_CEILING) * 100;

  const right = 100 - (maxValue / PRICE_CEILING) * 100;

  const total = count.data?.total;

  const draftActive = countActiveFilters(draft) > 0;

  const canShow = total !== 0;

  const toggleAmenity = (id: number) => {
    const current = draft.amenities ?? [];

    const next = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id];

    setDraft({ ...draft, amenities: next.length > 0 ? next : undefined });
  };

  const toggleProperty = (type: PropertyType) => {
    const current = draft.property_types ?? [];

    const next = current.includes(type)
      ? current.filter((item) => item !== type)
      : [...current, type];

    setDraft({ ...draft, property_types: next.length > 0 ? next : undefined });
  };

  const apply = () => {
    onApply({
      min_price: draft.min_price,

      max_price: draft.max_price,

      property_types: draft.property_types?.length
        ? draft.property_types
        : undefined,

      room_type: draft.room_type,

      amenities: draft.amenities?.length ? draft.amenities : undefined,

      category: draft.category,

      min_bedrooms: draft.min_bedrooms,
      min_beds: draft.min_beds,
      min_bathrooms: draft.min_bathrooms,
      min_rating: draft.min_rating,
      instant_book: draft.instant_book,
      allows_pets: draft.allows_pets,
    });

    onClose();
  };

  const clearDraft = () => {
    setDraft({
      ...draft,

      min_price: undefined,

      max_price: undefined,

      property_types: undefined,

      room_type: undefined,

      amenities: undefined,

      min_bedrooms: undefined,
      min_beds: undefined,
      min_bathrooms: undefined,
      category: undefined,
      min_rating: undefined,
      instant_book: undefined,
      allows_pets: undefined,
    });
  };

  const roomSegment = (options: typeof ROOM_OPTIONS) => (
    <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-xl border border-hairline">
      {options.map((option) => {
        const selected =
          option.value == null
            ? draft.room_type == null
            : option.value === "private_room"
              ? draft.room_type === "private_room" ||
                draft.room_type === "shared_room"
              : draft.room_type === option.value;

        return (
          <button
            key={option.label}

            type="button"

            onClick={() => setDraft({ ...draft, room_type: option.value })}

            className={`border-r border-hairline px-3 py-3 text-sm leading-[18px] last:border-r-0 ${
              selected
                ? "font-semibold text-ink ring-2 ring-inset ring-ink"
                : "font-normal text-muted"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );

  const priceBlock = (withHistogram: boolean) => (
    <>
      {withHistogram ? (
        <PriceHistogram
          prices={priceSamples.data ?? []}
          minValue={minValue}
          maxValue={maxValue}
        />
      ) : null}

      <div className={`relative ${withHistogram ? "mt-4" : "mt-8"} h-8`}>
        <div className="absolute top-1/2 h-0.5 w-full -translate-y-1/2 rounded-full bg-hairline" />

        <div
          className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-rausch"

          style={{ left: `${left}%`, right: `${right}%` }}
        />

        <input
          aria-label="Minimum price"

          type="range"

          min={PRICE_FLOOR}

          max={PRICE_CEILING}

          step={500}

          value={minValue}

          onChange={(event) => {
            const next = Math.min(Number(event.target.value), maxValue);

            setDraft({
              ...draft,
              min_price: next <= PRICE_FLOOR ? undefined : next,
            });
          }}

          className="range-thumb"

          style={{ zIndex: minValue > PRICE_CEILING - 1000 ? 5 : 3 }}
        />

        <input
          aria-label="Maximum price"

          type="range"

          min={PRICE_FLOOR}

          max={PRICE_CEILING}

          step={500}

          value={maxValue}

          onChange={(event) => {
            const next = Math.max(Number(event.target.value), minValue);

            setDraft({
              ...draft,
              max_price: next >= PRICE_CEILING ? undefined : next,
            });
          }}

          className="range-thumb"

          style={{ zIndex: 4 }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <label className="text-xs leading-4 text-muted">
          Minimum
          <input
            inputMode="numeric"

            value={draft.min_price ?? ""}

            placeholder={formatInr(PRICE_FLOOR)}

            onChange={(event) => {
              const next = Number(event.target.value);

              setDraft({
                ...draft,
                min_price:
                  event.target.value === "" || next <= 0 ? undefined : next,
              });
            }}

            className="mt-1 w-full rounded-lg border border-hairline px-3 py-3 text-base leading-5 text-ink outline-none focus:border-ink"
          />
        </label>

        <label className="text-right text-xs leading-4 text-muted">
          Maximum
          <input
            inputMode="numeric"

            value={draft.max_price ?? ""}

            placeholder={`${formatInr(PRICE_CEILING)}+`}

            onChange={(event) => {
              const next = Number(event.target.value);

              setDraft({
                ...draft,

                max_price:
                  event.target.value === "" || next >= PRICE_CEILING
                    ? undefined
                    : next,
              });
            }}

            className="mt-1 w-full rounded-lg border border-hairline px-3 py-3 text-right text-base leading-5 text-ink outline-none focus:border-ink"
          />
        </label>
      </div>
    </>
  );

  const footer = (
    <div className="hidden shrink-0 items-center justify-between border-t border-divider bg-white px-6 py-4 min-[1128px]:flex">
      <button
        type="button"

        className={`text-base font-semibold underline decoration-1 underline-offset-2 ${
          draftActive ? "text-ink" : "cursor-default text-disabled no-underline"
        }`}

        disabled={!draftActive}

        onClick={clearDraft}
      >
        Clear all
      </button>

      <button
        type="button"

        onClick={apply}

        disabled={!canShow && total != null}

        className="rounded-lg bg-ink px-6 py-3.5 text-base font-semibold leading-5 text-white transition-[background-color] duration-200 disabled:cursor-not-allowed disabled:bg-[var(--bg-disabled)] disabled:text-muted"
      >
        {formatShowPlaces(total)}
      </button>
    </div>
  );

  const mobileBody = (
    <div className="min-[1128px]:hidden space-y-8 pb-4">
      <section>
        <h3 className="text-lg font-semibold text-ink">Type of place</h3>

        {roomSegment(ROOM_OPTIONS)}
      </section>

      <section className="border-t border-hairline pt-8">
        <h3 className="text-lg font-semibold text-ink">Price range</h3>

        <p className="mt-1 text-meta text-muted">Nightly price</p>

        {priceBlock(false)}
      </section>

      <section className="border-t border-hairline pt-8">
        <h3 className="text-lg font-semibold text-ink">Rooms and beds</h3>

        <p className="mt-4 text-body font-medium text-ink">Bedrooms</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {(["any", 1, 2, 3, 4, 5, 6, 7, 8] as const).map((option) => {
            const selected =
              option === "any"
                ? draft.min_bedrooms == null
                : draft.min_bedrooms === option;

            return (
              <button
                key={String(option)}

                type="button"

                onClick={() =>
                  setDraft({
                    ...draft,
                    min_bedrooms: option === "any" ? undefined : option,
                  })
                }

                className={`h-10 min-w-12 rounded-full border px-3 text-body ${selected ? "border-ink bg-ink text-white" : "border-hairline text-ink"}`}
              >
                {option === "any" ? "Any" : option === 8 ? "8+" : option}
              </button>
            );
          })}
        </div>
      </section>

      <section className="border-t border-hairline pt-8">
        <h3 className="text-lg font-semibold text-ink">Property type</h3>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PROPERTY_TYPES.map((type) => {
            const Icon = propertyTypeIcons[type];

            const selected = draft.property_types?.includes(type) ?? false;

            return (
              <button
                key={type}

                type="button"

                onClick={() => toggleProperty(type)}

                className={`flex h-24 flex-col items-start justify-between rounded-xl border p-3 text-left text-body ${selected ? "border-2 border-ink bg-soft" : "border-hairline"}`}
              >
                <Icon size={22} />

                {propertyLabel(type)}
              </button>
            );
          })}
        </div>
      </section>

      <section className="border-t border-hairline pt-8">
        <h3 className="text-lg font-semibold text-ink">Category</h3>

        <div className="mt-4 flex flex-wrap gap-2">
          {(categories.data ?? []).map((item) => {
            const selected = draft.category === item.category;

            return (
              <button
                key={item.category}

                type="button"

                onClick={() =>
                  setDraft({
                    ...draft,
                    category: selected ? undefined : item.category,
                  })
                }

                className={`rounded-full px-4 py-2 text-body ${selected ? "border-2 border-ink bg-soft text-ink" : "border border-hairline text-ink"}`}
              >
                {item.category}
              </button>
            );
          })}
        </div>
      </section>

      <section className="border-t border-hairline pt-8">
        <h3 className="text-lg font-semibold text-ink">Amenities</h3>

        <div className="mt-4 space-y-6">
          {(showAllAmenities ? groupedByGroup : groupedByGroup.slice(0, 2)).map(
            (group) => (
              <div key={group.name}>
                <p className="text-body font-semibold text-ink">{group.name}</p>

                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {group.items.map((amenity) => (
                    <label
                      key={amenity.id}
                      className="flex items-center gap-3 py-1 text-body text-ink"
                    >
                      <input
                        type="checkbox"

                        className="h-5 w-5 accent-ink"

                        checked={draft.amenities?.includes(amenity.id) ?? false}

                        onChange={() => toggleAmenity(amenity.id)}
                      />

                      {amenity.name}
                    </label>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>

        {groupedByGroup.length > 2 ? (
          <button
            type="button"
            className="mt-4 t-link"
            onClick={() => setShowAllAmenities((value) => !value)}
          >
            {showAllAmenities ? "Show less" : "Show more"}
          </button>
        ) : null}
      </section>

      <div className="sticky bottom-0 -mx-6 flex items-center justify-between border-t border-hairline bg-white px-6 py-4">
        <button type="button" className="t-link" onClick={clearDraft}>
          Clear all
        </button>

        <button
          type="button"
          onClick={apply}
          className="rounded-lg bg-ink px-6 py-3 t-button text-white"
        >
          {total == null
            ? "Show places"
            : `Show ${new Intl.NumberFormat("en-IN").format(total)} places`}
        </button>
      </div>
    </div>
  );

  const recommended = RECOMMENDED_NAMES.map((name) => byName.get(name)).filter(
    (item): item is Amenity => item != null,
  );

  const selfCheckIn = byName.get(SELF_CHECKIN_NAME);

  const desktopBody = (
    <div className="hidden min-[1128px]:block pb-2">
      <FilterSection title="Recommended for you">
        <div className="mt-4 grid grid-cols-4 gap-3">
          {recommended.map((amenity) => (
            <RecommendedTile
              key={amenity.id}

              amenity={amenity}

              selected={draft.amenities?.includes(amenity.id) ?? false}

              onToggle={() => toggleAmenity(amenity.id)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Type of place">
        {roomSegment(DESKTOP_ROOM_OPTIONS)}
      </FilterSection>

      <FilterSection
        title="Price range"
        subtitle="Trip price, includes all fees"
      >
        {priceBlock(true)}
      </FilterSection>

      <FilterSection title="Rooms and beds">
        <CountRow
          label="Bedrooms"
          value={draft.min_bedrooms}
          onChange={(min_bedrooms) => setDraft({ ...draft, min_bedrooms })}
          decreaseLabel="Decrease bedrooms"
          increaseLabel="Increase bedrooms"
        />
        <CountRow
          label="Beds"
          value={draft.min_beds}
          onChange={(min_beds) => setDraft({ ...draft, min_beds })}
          decreaseLabel="Decrease beds"
          increaseLabel="Increase beds"
        />
        <CountRow
          label="Bathrooms"
          value={draft.min_bathrooms}
          onChange={(min_bathrooms) => setDraft({ ...draft, min_bathrooms })}
          min={1}
          max={8}
          step={0.5}
          decreaseLabel="Decrease bathrooms"
          increaseLabel="Increase bathrooms"
        />
      </FilterSection>

      <FilterSection title="Amenities">
        <div className="mt-4 flex flex-wrap gap-2">
          {visibleAmenities.map((amenity) => (
            <AmenityPill
              key={amenity.id}

              amenity={amenity}

              selected={draft.amenities?.includes(amenity.id) ?? false}

              onToggle={() => toggleAmenity(amenity.id)}
            />
          ))}
        </div>

        {grouped.length > DESKTOP_AMENITY_PREVIEW ? (
          <button
            type="button"

            className="mt-4 flex items-center gap-1 text-sm font-semibold text-ink underline decoration-1 underline-offset-2"

            onClick={() => setShowAllAmenities((value) => !value)}
          >
            {showAllAmenities ? "Show less" : "Show more"}

            <ChevronDown
              size={14}
              className={showAllAmenities ? "rotate-180" : ""}
            />
          </button>
        ) : null}
      </FilterSection>

      <FilterSection title="Booking options">
        <div className="mt-4 flex flex-wrap gap-2">
          <BookingOptionPill
            label="Instant Book"
            icon={Zap}
            selected={draft.instant_book === true}
            onClick={() => setDraft({ ...draft, instant_book: draft.instant_book ? undefined : true })}
          />
          {selfCheckIn ? (
            <AmenityPill
              amenity={selfCheckIn}
              selected={draft.amenities?.includes(selfCheckIn.id) ?? false}
              onToggle={() => toggleAmenity(selfCheckIn.id)}
            />
          ) : null}
          <BookingOptionPill
            label="Allows pets"
            icon={PawPrint}
            selected={draft.allows_pets === true}
            onClick={() => setDraft({ ...draft, allows_pets: draft.allows_pets ? undefined : true })}
          />
        </div>
      </FilterSection>

      <FilterSection title="Standout stays">
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StandoutTile
            title="Guest favourite"

            subtitle={GUEST_FAVOURITE_BLURB}

            icon={<Award size={24} strokeWidth={1.5} />}

            selected={draft.min_rating != null}

            onClick={() =>
              setDraft({
                ...draft,
                min_rating: draft.min_rating != null ? undefined : 4.8,
              })
            }
          />
        </div>
      </FilterSection>

      <FilterAccordion title="Property type" open={propertyOpen} onToggle={() => setPropertyOpen((v) => !v)}>
        <div className="pb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PROPERTY_TYPES.map((type) => {
            const Icon = propertyTypeIcons[type];
            const selected = draft.property_types?.includes(type) ?? false;
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleProperty(type)}
                className={`flex h-24 flex-col items-start justify-between rounded-xl border p-3 text-left text-sm leading-[18px] ${
                  selected ? "border-2 border-ink" : "border border-hairline hover:border-ink"
                }`}
              >
                <Icon size={22} />
                {propertyLabel(type)}
              </button>
            );
          })}
        </div>
      </FilterAccordion>

      <FilterAccordion title="Accessibility features" open={accessibilityOpen} onToggle={() => setAccessibilityOpen((v) => !v)}>
        <p className="pb-4 text-sm leading-[18px] text-muted">Coming soon</p>
      </FilterAccordion>

      <FilterAccordion title="Host language" open={hostLanguageOpen} onToggle={() => setHostLanguageOpen((v) => !v)}>
        <p className="pb-4 text-sm leading-[18px] text-muted">Coming soon</p>
      </FilterAccordion>
    </div>
  );

  return (
    <Modal
      open={open}
      title="Filters"
      onClose={onClose}
      size="lg"
      variant="filters"
      footer={footer}
    >
      {mobileBody}

      {desktopBody}
    </Modal>
  );
}
