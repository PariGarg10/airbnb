"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { HostReservationsPanel } from "@/components/host/HostReservationsPanel";
import { StepsToPublishDrawer } from "@/components/host/StepsToPublishDrawer";

export function TodayPage() {
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get("tab");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (tab === "listings") router.replace("/host/listings");
    else if (tab === "reservations") router.replace("/host");
  }, [router, tab]);

  if (tab === "listings" || tab === "reservations") return null;

  return (
    <>
      <div className="bg-divider px-6 py-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mx-auto flex w-full max-w-xl items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-soft text-rausch">
            <ShieldCheck size={22} />
          </span>
          <span>
            <span className="block font-semibold">Verify your identity</span>
            <span className="block text-meta text-muted">Required to publish</span>
          </span>
        </button>
      </div>
      <main className="container-airbnb py-8">
        <HostReservationsPanel />
      </main>
      <StepsToPublishDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
