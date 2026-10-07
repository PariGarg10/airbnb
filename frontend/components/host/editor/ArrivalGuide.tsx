"use client";

import type { ReactNode } from "react";
import { EditorCard } from "@/components/host/editor/EditorCard";

export function CheckinPanel() {
  return (
    <div className="max-w-xl">
      <p className="font-medium text-ink">Check-in window</p>
      <div className="mt-3 overflow-hidden rounded-xl border border-hairline">
        <label className="block border-b border-hairline px-4 py-3">
          <span className="text-label text-muted">Start time</span>
          <select disabled defaultValue="2:00 pm" className="mt-1 w-full appearance-none bg-transparent text-body text-ink">
            <option>2:00 pm</option>
          </select>
        </label>
        <label className="block px-4 py-3">
          <span className="text-label text-muted">End time</span>
          <select disabled defaultValue="Flexible" className="mt-1 w-full appearance-none bg-transparent text-body text-ink">
            <option>Flexible</option>
          </select>
        </label>
      </div>
      <p className="mt-8 font-medium text-ink">Checkout</p>
      <label className="mt-3 block rounded-xl border border-hairline px-4 py-3">
        <span className="text-label text-muted">Time</span>
        <select disabled defaultValue="11:00 am" className="mt-1 w-full appearance-none bg-transparent text-body text-ink">
          <option>11:00 am</option>
        </select>
      </label>
      <p className="mt-4 text-meta text-muted">Times are fixed in this demo.</p>
    </div>
  );
}

export function CheckinSummary() {
  return (
    <div className="grid grid-cols-2">
      <div>
        <p className="text-meta text-muted">Check-in</p>
        <p className="mt-1 text-lg text-ink">2:00 pm</p>
      </div>
      <div className="border-l border-hairline pl-5">
        <p className="text-meta text-muted">Checkout</p>
        <p className="mt-1 text-lg text-ink">11:00 am</p>
      </div>
    </div>
  );
}

export function ArrivalGuide({
  cards,
}: {
  cards: { id: string; title: string; summary: ReactNode; split?: boolean; selected: boolean; onSelect: () => void }[];
}) {
  return (
    <div className="mt-6 space-y-4">
      {cards.map((card) => (
        <EditorCard
          key={card.id}
          title={card.title}
          summary={card.summary}
          split={card.split}
          selected={card.selected}
          onClick={card.onSelect}
        />
      ))}
    </div>
  );
}
