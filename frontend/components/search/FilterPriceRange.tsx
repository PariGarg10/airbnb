"use client";

import { useMemo } from "react";
import { formatInr } from "@/lib/format";

const PRICE_FLOOR = 0;
const PRICE_CEILING = 100_000;
const HISTOGRAM_BARS = 52;

function formatMaxPrice(amount: number, atCeiling: boolean): string {
  return atCeiling ? `${formatInr(amount)}+` : formatInr(amount);
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
      const index = Math.min(HISTOGRAM_BARS - 1, Math.floor((price / PRICE_CEILING) * HISTOGRAM_BARS));
      counts[index] += 1;
    });
    const peak = Math.max(...counts, 1);
    return counts.map((count) => count / peak);
  }, [prices]);

  return (
    <div className="filter-histogram flex h-[72px] items-end gap-[2px]" aria-hidden>
      {buckets.map((height, index) => {
        const start = (index / HISTOGRAM_BARS) * PRICE_CEILING;
        const end = ((index + 1) / HISTOGRAM_BARS) * PRICE_CEILING;
        const active = end >= minValue && start <= maxValue;
        return (
          <div
            key={index}
            className={`min-h-[4px] flex-1 rounded-t-[2px] ${active ? "filter-histogram-bar-active" : "filter-histogram-bar-inactive"}`}
            style={{ height: `${Math.max(10, height * 100)}%` }}
          />
        );
      })}
    </div>
  );
}

export interface FilterPriceRangeProps {
  prices: number[];
  minPrice: number | undefined;
  maxPrice: number | undefined;
  onChange: (patch: { min_price?: number; max_price?: number }) => void;
}

export function FilterPriceRange({ prices, minPrice, maxPrice, onChange }: FilterPriceRangeProps) {
  const minValue = minPrice ?? PRICE_FLOOR;
  const maxValue = maxPrice ?? PRICE_CEILING;
  const maxAtCeiling = maxPrice == null || maxPrice >= PRICE_CEILING;

  const setMin = (next: number) => {
    onChange({ min_price: next <= PRICE_FLOOR ? undefined : next, max_price: maxPrice });
  };

  const setMax = (next: number) => {
    onChange({ min_price: minPrice, max_price: next >= PRICE_CEILING ? undefined : next });
  };

  return (
    <>
      <div className="filter-price-chart relative mt-6">
        <PriceHistogram prices={prices} minValue={minValue} maxValue={maxValue} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0">
          <div className="pointer-events-auto relative -top-3 h-8 w-full">
            <input
              aria-label="Minimum price"
              type="range"
              min={PRICE_FLOOR}
              max={PRICE_CEILING}
              step={500}
              value={minValue}
              onChange={(event) => {
                const next = Math.min(Number(event.target.value), maxValue);
                setMin(next);
              }}
              className="filter-range-thumb absolute inset-0 w-full"
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
                setMax(next);
              }}
              className="filter-range-thumb absolute inset-0 w-full"
              style={{ zIndex: 4 }}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-2 block text-xs leading-4 text-muted">Minimum</span>
          <input
            readOnly
            tabIndex={-1}
            aria-label="Minimum trip price"
            value={formatInr(minValue)}
            className="w-full cursor-default rounded-full border border-hairline bg-white px-4 py-3.5 text-center text-base leading-5 text-ink outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-right text-xs leading-4 text-muted">Maximum</span>
          <input
            readOnly
            tabIndex={-1}
            aria-label="Maximum trip price"
            value={formatMaxPrice(maxAtCeiling ? PRICE_CEILING : maxValue, maxAtCeiling)}
            className="w-full cursor-default rounded-full border border-hairline bg-white px-4 py-3.5 text-center text-base leading-5 text-ink outline-none"
          />
        </label>
      </div>
    </>
  );
}

export { PRICE_CEILING, PRICE_FLOOR };
