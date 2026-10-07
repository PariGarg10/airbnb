"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { INSPIRATION_BY_TAB, INSPIRATION_TABS } from "@/lib/legal/footer-inspiration";

export function FooterInspiration() {
  const [tab, setTab] = useState("popular");
  const [expanded, setExpanded] = useState(false);
  const places = useMemo(() => INSPIRATION_BY_TAB[tab] ?? [], [tab]);
  const visible = expanded ? places : places.slice(0, 17);

  return (
    <section className="border-t border-divider pt-10 md:pt-[var(--home-px)]">
      <h2 className="t-section-title mb-6">Inspiration for future getaways</h2>
      <div className="inspiration-tabs no-scrollbar mb-6 flex gap-6 overflow-x-auto border-b border-divider">
        {INSPIRATION_TABS.map((item) => {
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                setExpanded(false);
              }}
              className={`inspiration-tab shrink-0 pb-3 text-sm font-medium ${
                active ? "inspiration-tab-active text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <ul className="inspiration-grid">
        {visible.map((place) => (
          <li key={`${tab}-${place.city}`}>
            <Link href={place.href} className="group block py-2">
              <span className="block text-sm font-medium text-ink group-hover:underline">{place.city}</span>
              <span className="mt-0.5 block text-sm text-muted">{place.subtitle}</span>
            </Link>
          </li>
        ))}
        {!expanded && places.length > 17 ? (
          <li>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="flex items-center gap-1 py-2 text-sm font-medium text-ink underline decoration-1 underline-offset-2"
            >
              Show more
              <ChevronDown size={14} aria-hidden />
            </button>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
