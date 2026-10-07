"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ConfirmAddressModal, type AddressParts } from "@/components/host/steps/ConfirmAddressModal";
import { EnterAddressModal } from "@/components/host/steps/EnterAddressModal";
import { IntroHeroCarousel } from "@/components/host/wizard/IntroHeroCarousel";
import { useWizard } from "@/components/host/wizard/WizardContext";
import { IN_STATE_CODE, lookupCity, type CityPoint } from "@/lib/cities";
import { useAuth } from "@/lib/auth";
import { APP_NAME } from "@/lib/brand";

const EMPTY_PARTS: AddressParts = {
  country: "India",
  flat: "",
  street: "",
  landmark: "",
  district: "",
  city: "",
  state: "",
  pin: "",
};

function partsFromDraft(draft: { country: string; city: string; state: string; address: string }): AddressParts {
  return {
    ...EMPTY_PARTS,
    country: draft.country || "India",
    city: draft.city,
    state: draft.state,
    street: draft.address,
  };
}

export function AddressIntroStep() {
  const { draft, patch, setStep, registerAddressOpener } = useWizard();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [enterOpen, setEnterOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [parts, setParts] = useState<AddressParts>(() => partsFromDraft(draft));
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1128px)");
    const apply = () => setDesktop(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  const openFlow = useCallback(() => {
    if (window.matchMedia("(min-width: 1128px)").matches) setEnterOpen(true);
    else setConfirmOpen(true);
  }, []);

  useEffect(() => {
    registerAddressOpener(openFlow);
    return () => registerAddressOpener(null);
  }, [openFlow, registerAddressOpener]);

  const openConfirmFromCity = (city: CityPoint, seedStreet = "") => {
    setParts({
      ...EMPTY_PARTS,
      country: city.country,
      city: city.name,
      state: IN_STATE_CODE[city.name] ?? "",
      street: seedStreet,
    });
    setEnterOpen(false);
    setConfirmOpen(true);
  };

  const openConfirmManual = (seed: string) => {
    const match = lookupCity(seed);
    setParts({
      ...EMPTY_PARTS,
      country: match?.country ?? "India",
      city: match?.name ?? "",
      state: match ? IN_STATE_CODE[match.name] ?? "" : "",
      street: match ? "" : seed.trim(),
    });
    setEnterOpen(false);
    setConfirmOpen(true);
  };

  const confirmAddress = async (next: AddressParts, address: string) => {
    const city = lookupCity(next.city) ?? lookupCity(next.street);
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    patch({
      address,
      city: next.city.trim(),
      state: next.state.trim(),
      country: next.country.trim(),
      lat: city?.lat ?? draft.lat,
      lng: city?.lng ?? draft.lng,
    });
    setConfirmOpen(false);
    setStep(draft.currentStep + 1);
  };

  return (
    <>
      <div className="mx-auto grid min-h-[70vh] w-full max-w-6xl items-center gap-10 px-6 py-8 lg:grid-cols-2 min-[1128px]:max-w-[1120px] min-[1128px]:gap-16 min-[1128px]:px-12">
        <div>
          <h1 className="t-wizard-title min-[1128px]:t-wizard-intro-title">{`Set up your ${APP_NAME} listing`}</h1>
          <p className="t-wizard-subtitle mt-4 max-w-md min-[1128px]:mt-5 min-[1128px]:max-w-lg">
            It&apos;s easy to create a great listing – let&apos;s start with your address.
          </p>
          <button
            type="button"
            onClick={openFlow}
            className="mt-8 hidden w-full max-w-lg items-center gap-3 rounded-full border border-ink px-4 py-3.5 text-left shadow-[var(--shadow-secondary)] min-[1128px]:mt-10 min-[1128px]:flex"
          >
            <Search size={18} className="shrink-0 text-muted" strokeWidth={2} />
            <span className={`flex-1 text-body ${query ? "text-ink" : "text-muted"}`}>{query || "Enter your address"}</span>
          </button>
          <label className="mt-8 flex items-center gap-3 rounded-full border border-hairline px-4 py-3 shadow-sm min-[1128px]:hidden">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  openConfirmManual(query);
                }
              }}
              placeholder="Enter your address"
              className="w-full bg-transparent text-body outline-none"
            />
          </label>
          <p className="mt-4 text-meta text-muted min-[1128px]:mt-6">
            Not listing a home? Host an{" "}
            <Link href="/coming-soon" className="font-semibold text-ink underline decoration-1 underline-offset-2">
              experience or service
            </Link>
            .
          </p>
        </div>

        <IntroHeroCarousel />

        <div className="rounded-[32px] bg-[#f6f1f1] p-8 max-[1127px]:block min-[1128px]:hidden">
          <div className="mx-auto max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl">
            <div className="relative m-4 aspect-[4/3] overflow-hidden rounded-2xl">
              <Image
                src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80"
                alt=""
                fill
                className="object-cover"
                sizes="320px"
              />
            </div>
            <div className="px-6 pb-6">
              <p className="t-overview">Entire home in Goa, India</p>
              <div className="mt-6 flex items-center justify-between border-t border-hairline pt-4 text-body">
                <span>Hosted by {user?.name ?? "you"}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-label text-white">
                  {(user?.name ?? "Y").charAt(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EnterAddressModal
        open={enterOpen}
        query={query}
        onQueryChange={setQuery}
        onClose={() => setEnterOpen(false)}
        onPickCity={(city) => openConfirmFromCity(city, query.trim())}
        onManual={(seed) => openConfirmManual(seed)}
      />

      <ConfirmAddressModal
        open={confirmOpen}
        initial={parts}
        onClose={() => setConfirmOpen(false)}
        onBack={
          desktop
            ? () => {
                setConfirmOpen(false);
                setEnterOpen(true);
              }
            : undefined
        }
        onConfirm={confirmAddress}
      />
    </>
  );
}
