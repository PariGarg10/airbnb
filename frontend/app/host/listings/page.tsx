"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { HostListingsPanel } from "@/components/host/HostListingsPanel";

export default function HostListingsPage() {
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <main className="container-airbnb py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="t-page-title">Your listings</h1>
        <div className="flex items-center gap-2">
          {searching ? (
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title or city"
              className="w-56 rounded-full border border-hairline px-4 py-2 text-body outline-none focus:border-ink"
              autoFocus
            />
          ) : null}
          <button
            type="button"
            aria-label="Search listings"
            onClick={() => {
              setSearching((open) => !open);
              if (searching) setQuery("");
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline hover:bg-soft"
          >
            <Search size={16} />
          </button>
          <Link href="/host/listings/new" aria-label="Create listing" className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline hover:bg-soft">
            <Plus size={18} />
          </Link>
        </div>
      </div>
      <div className="mt-8">
        <HostListingsPanel filter={query} />
      </div>
    </main>
  );
}
