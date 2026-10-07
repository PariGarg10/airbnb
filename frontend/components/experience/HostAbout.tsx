"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { PAYMENT_SAFETY_NOTE } from "@/lib/brand";
import { hostTagline } from "@/lib/experienceLabels";
import type { ExperienceHost } from "@/types/experience";

export function HostAbout({ host, city }: { host: ExperienceHost; city: string }) {
  const tagline = hostTagline(host.bio, city);
  return (
    <section className="mt-12 border-t border-hairline pt-12">
      <h2 className="text-center text-[32px] font-semibold leading-9 tracking-[-0.02em] text-ink min-[1128px]:text-left">
        About me
      </h2>
      <div className="mt-8 flex flex-col items-center gap-8 min-[1128px]:flex-row min-[1128px]:items-start">
        <div className="flex w-full max-w-[280px] flex-col items-center rounded-[var(--r-12)] border border-hairline bg-white p-8 shadow-[var(--shadow-tertiary)]">
          <Avatar name={host.name} src={host.avatar_url} size={96} className="!h-24 !w-24" />
          <p className="mt-4 text-[22px] font-semibold leading-7 text-ink">{host.name}</p>
          <p className="mt-1 text-center text-sm leading-[18px] text-muted">{tagline}</p>
        </div>
        <p className="max-w-[520px] text-base leading-6 text-ink">{host.bio ?? ""}</p>
      </div>
      <Link
        href="/coming-soon"
        className="mt-8 flex w-full max-w-md items-center justify-center rounded-full bg-soft px-6 py-3.5 text-base font-semibold text-ink hover:bg-quaternary-hover min-[1128px]:mx-0"
      >
        Message {host.name}
      </Link>
      <p className="mt-6 text-center text-xs leading-4 text-muted min-[1128px]:text-left">{PAYMENT_SAFETY_NOTE}</p>
    </section>
  );
}
