import { Award, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { PAYMENT_SAFETY_NOTE } from "@/lib/brand";
import { formatRating } from "@/lib/format";
import type { Host } from "@/types";

function yearsHosting(joinedYear: number): number {
  return Math.max(0, new Date().getFullYear() - joinedYear);
}

export function ListingMeetHost({
  host,
  reviewCount,
  avgRating,
}: {
  host: Host;
  reviewCount: number;
  avgRating: number;
}) {
  const years = yearsHosting(host.joined_year);

  return (
    <section>
      <h2 className="t-heading min-[1128px]:text-[22px] min-[1128px]:leading-[26px] min-[1128px]:tracking-[-0.0275rem]">
        Meet your host
      </h2>

      <div className="mt-6 grid gap-8 md:grid-cols-[280px_1fr] min-[1128px]:mt-8 min-[1128px]:grid-cols-[minmax(0,380px)_1fr] min-[1128px]:gap-16">
        <div>
          <div className="rounded-2xl border border-hairline p-6 text-center shadow-sm min-[1128px]:rounded-[24px] min-[1128px]:border-0 min-[1128px]:p-8 min-[1128px]:text-left min-[1128px]:shadow-[var(--shadow-secondary)]">
            <div className="min-[1128px]:flex min-[1128px]:items-start min-[1128px]:gap-6">
              <div className="relative mx-auto shrink-0 min-[1128px]:mx-0">
                <Avatar name={host.name} src={host.avatar_url} size={96} className="min-[1128px]:!h-[104px] min-[1128px]:!w-[104px]" />
                {host.is_superhost ? (
                  <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-rausch text-white min-[1128px]:h-8 min-[1128px]:w-8">
                    <Award size={14} strokeWidth={2} aria-hidden />
                  </span>
                ) : null}
              </div>
              <div className="min-[1128px]:flex min-[1128px]:flex-1 min-[1128px]:flex-col min-[1128px]:justify-center">
                <p className="t-host-name mt-3 min-[1128px]:mt-0 min-[1128px]:text-[22px] min-[1128px]:leading-[26px]">{host.name}</p>
                {host.is_superhost ? (
                  <p className="text-body font-semibold min-[1128px]:mt-1 min-[1128px]:text-sm min-[1128px]:font-normal min-[1128px]:text-muted">
                    Superhost
                  </p>
                ) : null}
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-hairline pt-4 min-[1128px]:mt-6 min-[1128px]:grid-cols-1 min-[1128px]:gap-0 min-[1128px]:border-t-0 min-[1128px]:pt-0">
                  {[
                    { value: String(reviewCount), label: "Reviews" },
                    { value: reviewCount > 0 ? `${formatRating(avgRating)}★` : "–", label: "Rating" },
                    { value: String(years), label: "Years hosting" },
                  ].map((stat, index) => (
                    <div
                      key={stat.label}
                      className={index > 0 ? "min-[1128px]:border-t min-[1128px]:border-divider min-[1128px]:py-4" : "min-[1128px]:pb-4"}
                    >
                      <p className="t-stat-number">{stat.value}</p>
                      <p className="t-stat-label">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {host.bio ? (
            <p className="t-body mt-4 hidden whitespace-pre-wrap min-[1128px]:block min-[1128px]:max-w-[380px]">{host.bio}</p>
          ) : null}
        </div>

        <div>
          {host.is_superhost ? (
            <>
              <p className="font-semibold min-[1128px]:text-lg min-[1128px]:leading-6">{host.name} is a Superhost</p>
              <p className="t-body mt-2 text-muted min-[1128px]:mt-3">
                Superhosts are experienced, highly rated hosts who are committed to providing great stays for guests.
              </p>
            </>
          ) : null}
          {host.bio ? <p className="t-body mt-3 whitespace-pre-wrap min-[1128px]:hidden">{host.bio}</p> : null}

          <div className="mt-6 min-[1128px]:mt-8">
            <p className="font-semibold min-[1128px]:text-base min-[1128px]:leading-5">Host details</p>
            <p className="t-body mt-2 text-muted">Response rate: 100%</p>
            <p className="t-body mt-1 text-muted">Responds within an hour</p>
          </div>

          <Link
            href="/coming-soon"
            className="t-button mt-6 inline-flex rounded-lg border border-ink px-5 py-3 min-[1128px]:mt-8 min-[1128px]:rounded-xl min-[1128px]:border-0 min-[1128px]:bg-quaternary min-[1128px]:px-6 min-[1128px]:py-3.5 min-[1128px]:font-semibold min-[1128px]:transition min-[1128px]:hover:bg-divider"
          >
            Message host
          </Link>

          <div className="mt-8 hidden border-t border-divider pt-6 min-[1128px]:flex min-[1128px]:items-start min-[1128px]:gap-3">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-rausch" strokeWidth={1.75} aria-hidden />
            <p className="text-sm leading-[18px] text-muted">
              {PAYMENT_SAFETY_NOTE}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
