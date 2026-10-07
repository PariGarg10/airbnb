"use client";

import { clsx } from "clsx";

export function WizardLoadingDots({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center justify-center gap-1.5", className)} aria-hidden>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-1.5 w-1.5 rounded-full bg-current opacity-70 wizard-loading-dot"
          style={{ animationDelay: `${index * 0.12}s` }}
        />
      ))}
    </span>
  );
}
