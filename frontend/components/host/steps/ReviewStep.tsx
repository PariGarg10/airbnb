"use client";

import { Calendar, Check, Pencil } from "lucide-react";
import { useState } from "react";
import { FullPreviewModal } from "@/components/host/steps/FullPreviewModal";
import { useWizard } from "@/components/host/wizard/WizardContext";
import { formatInr } from "@/lib/format";

const NEXT_STEPS = [
  {
    icon: Check,
    title: "Confirm a few details and publish",
    body: "We'll let you know if you need to verify your identity or register with the local government.",
  },
  {
    icon: Calendar,
    title: "Set up your calendar",
    body: "Choose which dates your listing is available. It will be visible 24 hours after you publish.",
  },
  {
    icon: Pencil,
    title: "Adjust your settings",
    body: "Set house rules, select a cancellation policy, choose how guests book and more.",
  },
];

export function ReviewStep() {
  const { draft } = useWizard();
  const [open, setOpen] = useState(false);
  const cover = draft.image_urls[0];

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="t-wizard-title">Review your listing</h1>
      <p className="mt-3 text-meta text-muted">Here&apos;s what we&apos;ll show to guests. Make sure everything looks good.</p>
      <div className="mt-8 grid items-start gap-10 md:grid-cols-[minmax(0,320px)_1fr]">
        <button type="button" onClick={() => setOpen(true)} className="overflow-hidden rounded-2xl border border-hairline text-left shadow-sm">
          <div className="relative aspect-[4/5] bg-soft">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : null}
            <span className="absolute left-3 top-3 rounded-md bg-white px-2 py-1 text-label font-semibold">Show preview</span>
          </div>
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-semibold">{draft.title || "Untitled"}</p>
              <p className="text-meta text-muted">{formatInr(draft.price_per_night)} night</p>
            </div>
            <p className="text-body">New ★</p>
          </div>
        </button>
        <div>
          <h2 className="t-subheading">What&apos;s next?</h2>
          <div className="mt-4 space-y-5">
            {NEXT_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-4">
                  <Icon size={22} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-meta text-muted">{item.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <FullPreviewModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
