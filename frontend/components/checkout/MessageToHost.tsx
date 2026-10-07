"use client";

import Image from "next/image";
import { forwardRef } from "react";
import type { Host } from "@/types";

interface MessageToHostProps {
  host: Host;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const MessageToHost = forwardRef<HTMLTextAreaElement, MessageToHostProps>(function MessageToHost(
  { host, value, onChange, error },
  ref,
) {
  const placeholder = `Example: “Hi ${host.name}, my partner and I are going to a friend’s wedding and your place is just down the road.”`;

  return (
    <section className="rounded-3xl border border-hairline p-8">
      <h2 className="text-section font-semibold text-ink">Write a message to the host</h2>
      <p className="mt-2 text-meta text-muted">
        Before you can continue, let {host.name} know a little about your trip and why their place is a good fit.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-soft">
          {host.avatar_url ? (
            <Image src={host.avatar_url} alt="" fill className="object-cover" sizes="48px" />
          ) : null}
        </div>
        <div>
          <p className="text-[18px] font-semibold leading-[22px] text-ink">{host.name}</p>
          <p className="text-meta text-muted">Hosting since {host.joined_year}</p>
        </div>
      </div>
      <label className="mt-6 block">
        <span className="sr-only">Message to host</span>
        <textarea
          ref={ref}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={4}
          className={`min-h-[104px] w-full resize-y rounded-xl border px-4 py-3 text-body text-ink outline-none transition-[box-shadow,border-color] placeholder:text-muted focus:border-ink focus:ring-2 focus:ring-ink ${
            error ? "border-error" : "border-faint"
          }`}
        />
      </label>
      {error ? <p className="mt-2 text-label text-error">{error}</p> : null}
    </section>
  );
});
