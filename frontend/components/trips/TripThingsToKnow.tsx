"use client";

import Link from "next/link";
import { Ban, CigaretteOff, Clock, PawPrint, ShieldAlert } from "lucide-react";
import type { ListingDetail } from "@/types";

export function TripThingsToKnow({ listing }: { listing: ListingDetail }) {
  const rules: { icon: React.ReactNode; text: string }[] = [
    { icon: <Clock size={18} />, text: "Check-in: After 3:00 pm" },
    { icon: <Clock size={18} />, text: "Checkout: Before 11:00 am" },
    { icon: <Ban size={18} />, text: `Maximum ${listing.max_guests} guests` },
    {
      icon: <PawPrint size={18} />,
      text: listing.allows_pets ? "Pets allowed" : "No pets",
    },
    { icon: <CigaretteOff size={18} />, text: "No smoking" },
    { icon: <Ban size={18} />, text: "No parties or events" },
  ];

  const hasSmokeAlarm = listing.amenities.some((a) => a.name.toLowerCase().includes("smoke alarm"));
  const safety: { icon: React.ReactNode; text: string }[] = [
    {
      icon: <ShieldAlert size={18} />,
      text: hasSmokeAlarm ? "Smoke alarm" : "Smoke alarm not reported",
    },
  ];
  if (listing.has_exterior_camera) safety.push({ icon: <ShieldAlert size={18} />, text: "Exterior security camera" });
  if (listing.has_weapons) safety.push({ icon: <ShieldAlert size={18} />, text: "Weapons on property" });

  return (
    <section className="mt-12">
      <h2 className="text-section font-semibold text-ink">Things to know</h2>
      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        <div>
          <h3 className="text-body font-semibold text-ink">House rules</h3>
          <ul className="mt-3 space-y-3 text-body text-ink">
            {rules.map((item) => (
              <li key={item.text} className="flex items-start gap-3">
                <span className="mt-0.5 text-muted">{item.icon}</span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-body font-semibold text-ink">Safety & property</h3>
          <ul className="mt-3 space-y-3 text-body text-ink">
            {safety.map((item) => (
              <li key={item.text} className="flex items-start gap-3">
                <span className="mt-0.5 text-muted">{item.icon}</span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-10 rounded-2xl border border-hairline p-6">
        <p className="text-body font-semibold text-ink">Considering travel insurance?</p>
        <p className="mt-1 text-meta text-muted">Get information on how to protect your trip.</p>
        <Link href="/coming-soon" className="mt-3 inline-block text-body font-semibold underline underline-offset-4">
          Learn more
        </Link>
      </div>
    </section>
  );
}
