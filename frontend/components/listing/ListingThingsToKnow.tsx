import { CalendarX, ChevronRight, KeyRound, Shield } from "lucide-react";
import Link from "next/link";
import type { Amenity } from "@/types";

function hasAmenity(amenities: Amenity[], name: string): boolean {
  return amenities.some((a) => a.name.toLowerCase().includes(name.toLowerCase().split(" ")[0]!));
}

function LearnMore({ href = "/coming-soon" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold leading-[18px] text-ink underline decoration-1 underline-offset-2"
    >
      Learn more
      <ChevronRight size={14} strokeWidth={2} aria-hidden />
    </Link>
  );
}

export function ListingThingsToKnow({
  maxGuests,
  amenities,
  hasExteriorCamera,
  hasNoiseMonitor,
  hasWeapons,
}: {
  maxGuests: number;
  amenities: Amenity[];
  hasExteriorCamera: boolean;
  hasNoiseMonitor: boolean;
  hasWeapons: boolean;
}) {
  const co = hasAmenity(amenities, "Carbon monoxide");
  const smoke = hasAmenity(amenities, "Smoke alarm");

  const safetyLines = [
    co ? "Carbon monoxide alarm" : "Carbon monoxide alarm not reported",
    smoke ? "Smoke alarm" : "Smoke alarm not reported",
    hasExteriorCamera ? "Exterior security camera present" : "No exterior security camera reported",
    hasNoiseMonitor ? "Noise decibel monitor present" : "No noise decibel monitor reported",
    hasWeapons ? "Weapon(s) on the property" : "No weapons reported",
  ];

  return (
    <section className="hidden min-[1128px]:block">
      <h2 className="text-[22px] font-semibold leading-[26px] tracking-[-0.0275rem] text-ink">Things to know</h2>
      <div className="mt-8 grid grid-cols-3 gap-12">
        <div>
          <CalendarX size={24} strokeWidth={1.5} className="text-ink" aria-hidden />
          <h3 className="mt-4 text-base font-semibold leading-5 text-ink">Cancellation policy</h3>
          <p className="mt-3 text-sm leading-[18px] text-muted">
            This reservation is non-refundable. Review this host&apos;s full policy for details.
          </p>
          <LearnMore />
        </div>
        <div>
          <KeyRound size={24} strokeWidth={1.5} className="text-ink" aria-hidden />
          <h3 className="mt-4 text-base font-semibold leading-5 text-ink">House rules</h3>
          <ul className="mt-3 space-y-2 text-sm leading-[18px] text-muted">
            <li>Check-in after 3:00 pm</li>
            <li>Checkout before 11:00 am</li>
            <li>
              {maxGuests} {maxGuests === 1 ? "guest" : "guests"} maximum
            </li>
          </ul>
          <LearnMore />
        </div>
        <div>
          <Shield size={24} strokeWidth={1.5} className="text-ink" aria-hidden />
          <h3 className="mt-4 text-base font-semibold leading-5 text-ink">Safety &amp; property</h3>
          <ul className="mt-3 space-y-2 text-sm leading-[18px] text-muted">
            {safetyLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <LearnMore />
        </div>
      </div>
    </section>
  );
}
