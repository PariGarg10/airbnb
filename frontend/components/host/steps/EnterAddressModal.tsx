"use client";

import { MapPin, Navigation, Pencil, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { WizardLoadingDots } from "@/components/host/wizard/WizardLoadingDots";
import { nearestCity, searchCities, type CityPoint } from "@/lib/cities";

interface EnterAddressModalProps {
  open: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onPickCity: (city: CityPoint) => void;
  onManual: (query: string) => void;
}

export function EnterAddressModal({
  open,
  query,
  onQueryChange,
  onClose,
  onPickCity,
  onManual,
}: EnterAddressModalProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CityPoint[]>([]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setLoading(false);
      setResults([]);
      return;
    }
    setLoading(true);
    const id = window.setTimeout(() => {
      setResults(searchCities(trimmed));
      setLoading(false);
    }, 450);
    return () => window.clearTimeout(id);
  }, [open, query]);

  const showSuggestions = query.trim().length >= 2 && !loading;

  const useLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const city = nearestCity(pos.coords.latitude, pos.coords.longitude);
        onPickCity(city);
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  return (
    <Modal open={open} title="Enter your address" onClose={onClose} size="lg" variant="listing" titleInBody hideHeader>
      <div className="min-[1128px]:px-2">
        <div className="relative mb-4 min-[1128px]:hidden">
          <button type="button" aria-label="Close" onClick={onClose} className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full hover:bg-soft">
            <X size={16} strokeWidth={2.5} />
          </button>
          <h2 className="text-center text-lg font-semibold text-ink">Enter your address</h2>
        </div>
        <div className="relative hidden min-[1128px]:mb-6 min-[1128px]:block">
          <button type="button" aria-label="Close" onClick={onClose} className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full hover:bg-soft">
            <X size={16} strokeWidth={2.5} />
          </button>
          <h2 className="text-center text-[22px] font-semibold leading-[26px] tracking-[-0.0275rem] text-ink">Enter your address</h2>
        </div>
        <label className="flex items-center gap-3 rounded-full border border-ink px-4 py-3 min-[1128px]:py-3.5">
          <Search size={18} className="shrink-0 text-muted" strokeWidth={2} />
          <input
            autoFocus
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Enter your address"
            className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none"
          />
          {query ? (
            <button type="button" aria-label="Clear" onClick={() => onQueryChange("")} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-divider">
              <X size={14} />
            </button>
          ) : null}
        </label>

        {loading ? (
          <div className="flex justify-center py-10">
            <WizardLoadingDots className="text-muted" />
          </div>
        ) : null}

        {showSuggestions && results.length > 0 ? (
          <ul className="mt-2 max-h-64 overflow-y-auto">
            {results.map((city) => (
              <li key={`${city.name}-${city.country}`}>
                <button
                  type="button"
                  onClick={() => onPickCity(city)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-row-hover"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-soft text-ink">
                    <MapPin size={18} strokeWidth={1.75} />
                  </span>
                  <span>
                    <span className="block text-body font-medium text-ink">{city.name}</span>
                    <span className="block text-meta text-muted">{city.country}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 space-y-1">
          <button
            type="button"
            onClick={useLocation}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-row-hover"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-soft text-ink">
              <Navigation size={18} strokeWidth={1.75} />
            </span>
            <span className="text-body text-ink">Use my current location</span>
          </button>
          <button
            type="button"
            onClick={() => onManual(query)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-row-hover"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-soft text-ink">
              <Pencil size={18} strokeWidth={1.75} />
            </span>
            <span className="text-body text-ink">Enter address manually</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
