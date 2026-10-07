"use client";

import { ArrowLeft, ChevronDown, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { WizardLoadingDots } from "@/components/host/wizard/WizardLoadingDots";
import { IN_STATE_CODE, SEED_COUNTRIES, searchCities, type CityPoint } from "@/lib/cities";

export interface AddressParts {
  country: string;
  flat: string;
  street: string;
  landmark: string;
  district: string;
  city: string;
  state: string;
  pin: string;
}

interface ConfirmAddressModalProps {
  open: boolean;
  initial: AddressParts;
  onClose: () => void;
  onBack?: () => void;
  onConfirm: (parts: AddressParts, address: string) => void | Promise<void>;
}

type FieldKey = keyof AddressParts;

const REQUIRED: FieldKey[] = ["street", "city", "state", "pin"];

function FloatingField({
  label,
  value,
  onChange,
  error,
  focused,
  onFocus,
  onBlur,
  listId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error: boolean;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  listId?: string;
}) {
  return (
    <label
      className={`block px-3 py-2 transition-colors ${
        error ? "bg-[#fef2f2]" : "bg-white"
      } ${focused ? "shadow-[inset_0_0_0_1px_#222222]" : ""}`}
    >
      <span className={`block text-xs leading-4 ${error ? "text-[#c13515]" : "text-muted"}`}>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        list={listId}
        className={`mt-0.5 w-full bg-transparent text-body text-ink outline-none ${error ? "placeholder:text-[#c13515]/60" : ""}`}
      />
    </label>
  );
}

export function ConfirmAddressModal({ open, initial, onClose, onBack, onConfirm }: ConfirmAddressModalProps) {
  const [parts, setParts] = useState(initial);
  const [focused, setFocused] = useState<FieldKey | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const wasOpen = useRef(false);
  const cityListId = useId();

  useEffect(() => {
    if (open && !wasOpen.current) {
      setParts(initial);
      setShowErrors(false);
      setSaving(false);
      setCityQuery("");
    }
    wasOpen.current = open;
  }, [open, initial]);

  const set = (key: FieldKey, value: string) => setParts((current) => ({ ...current, [key]: value }));

  const citySuggestions = cityQuery.trim().length >= 1 ? searchCities(cityQuery, 8) : [];

  const applyCity = (city: CityPoint) => {
    setParts((current) => ({
      ...current,
      city: city.name,
      country: city.country,
      state: IN_STATE_CODE[city.name] ?? current.state,
    }));
    setCityQuery("");
  };

  const invalid = (key: FieldKey) => showErrors && REQUIRED.includes(key) && !parts[key].trim();

  const submit = async () => {
    const missing = REQUIRED.some((key) => !parts[key].trim());
    if (missing) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    const address = [parts.flat, parts.street, parts.landmark, parts.district, parts.city, parts.state, parts.pin, parts.country]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", ");
    try {
      await onConfirm(parts, address);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title="Confirm your address" onClose={onClose} size="lg" variant="listing" titleInBody hideHeader>
      <div className="min-[1128px]:px-2">
        <div className="relative mb-4 min-[1128px]:hidden">
          <button type="button" aria-label="Close" onClick={onClose} className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full hover:bg-soft">
            <X size={16} strokeWidth={2.5} />
          </button>
          <h2 className="text-center text-lg font-semibold text-ink">Confirm your address</h2>
        </div>
        <div className="relative mb-4 hidden min-[1128px]:mb-6 min-[1128px]:block">
          {onBack ? (
            <button type="button" aria-label="Back" onClick={onBack} className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full hover:bg-soft">
              <ArrowLeft size={18} strokeWidth={2} />
            </button>
          ) : null}
          <button type="button" aria-label="Close" onClick={onClose} className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full hover:bg-soft">
            <X size={16} strokeWidth={2.5} />
          </button>
          <h2 className="text-center text-[22px] font-semibold leading-[26px] tracking-[-0.0275rem] text-ink">Confirm your address</h2>
        </div>

        <label className="block rounded-xl border border-hairline px-3 py-2">
          <span className="block text-xs leading-4 text-muted">Country/region</span>
          <span className="relative mt-0.5 flex items-center">
            <select
              className="w-full appearance-none bg-transparent py-1 pr-8 text-body text-ink outline-none"
              value={parts.country}
              onChange={(event) => set("country", event.target.value)}
            >
              {SEED_COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country === "India" ? "India – IN" : country}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-0 text-muted" />
          </span>
        </label>

        <div className="mt-4 divide-y divide-hairline overflow-hidden rounded-xl border border-hairline">
          <FloatingField
            label="Flat, house, etc. (if applicable)"
            value={parts.flat}
            onChange={(value) => set("flat", value)}
            error={false}
            focused={focused === "flat"}
            onFocus={() => setFocused("flat")}
            onBlur={() => setFocused(null)}
          />
          <FloatingField
            label="Street address"
            value={parts.street}
            onChange={(value) => set("street", value)}
            error={invalid("street")}
            focused={focused === "street"}
            onFocus={() => setFocused("street")}
            onBlur={() => setFocused(null)}
          />
          <FloatingField
            label="Nearby landmark (if applicable)"
            value={parts.landmark}
            onChange={(value) => set("landmark", value)}
            error={false}
            focused={focused === "landmark"}
            onFocus={() => setFocused("landmark")}
            onBlur={() => setFocused(null)}
          />
          <FloatingField
            label="District/locality (if applicable)"
            value={parts.district}
            onChange={(value) => set("district", value)}
            error={false}
            focused={focused === "district"}
            onFocus={() => setFocused("district")}
            onBlur={() => setFocused(null)}
          />
          <div className="relative border-t border-hairline">
            <FloatingField
              label="City/town"
              value={parts.city}
              onChange={(value) => {
                set("city", value);
                setCityQuery(value);
              }}
              error={invalid("city")}
              focused={focused === "city"}
              onFocus={() => {
                setFocused("city");
                setCityQuery(parts.city);
              }}
              onBlur={() => {
                setFocused(null);
                window.setTimeout(() => setCityQuery(""), 150);
              }}
              listId={cityListId}
            />
            {focused === "city" && citySuggestions.length > 0 ? (
              <ul className="absolute left-0 right-0 z-10 max-h-40 overflow-y-auto border border-hairline bg-white shadow-popover">
                {citySuggestions.map((city) => (
                  <li key={`${city.name}-${city.country}`}>
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left text-body hover:bg-row-hover"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => applyCity(city)}
                    >
                      {city.name}, {city.country}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <datalist id={cityListId}>
              {citySuggestions.map((city) => (
                <option key={`${city.name}-${city.country}`} value={city.name} />
              ))}
            </datalist>
          </div>
          <FloatingField
            label="State/union territory"
            value={parts.state}
            onChange={(value) => set("state", value)}
            error={invalid("state")}
            focused={focused === "state"}
            onFocus={() => setFocused("state")}
            onBlur={() => setFocused(null)}
          />
          <FloatingField
            label="PIN code"
            value={parts.pin}
            onChange={(value) => set("pin", value)}
            error={invalid("pin")}
            focused={focused === "pin"}
            onFocus={() => setFocused("pin")}
            onBlur={() => setFocused(null)}
          />
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={submit}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-ink text-base font-semibold text-white disabled:opacity-70 min-[1128px]:rounded-xl"
        >
          {saving ? <WizardLoadingDots className="text-white" /> : "Next"}
        </button>
      </div>
    </Modal>
  );
}
