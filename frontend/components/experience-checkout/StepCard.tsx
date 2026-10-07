"use client";

import { Check } from "lucide-react";

export function StepCard({
  active,
  title,
  children,
  action,
}: {
  active: boolean;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-[var(--r-12)] border border-[#DDDDDD] bg-white p-6 ${active ? "shadow-[var(--shadow-secondary)]" : ""}`}
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold leading-5 text-ink">{title}</h3>
        {action}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export function StepDone({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-base font-semibold text-ink">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white">
        <Check size={14} strokeWidth={3} />
      </span>
      {label}
    </span>
  );
}
