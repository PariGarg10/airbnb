"use client";

import { Accessibility, Backpack, CalendarX, CheckCircle2, Footprints, Users } from "lucide-react";
import Link from "next/link";
import {
  cancellationPolicyText,
  guestRequirementsText,
} from "@/lib/experienceLabels";
import type { ExperienceDetail } from "@/types/experience";

function Block({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 text-ink">{icon}</div>
      <p className="text-base font-semibold leading-5 text-ink">{title}</p>
      <p className="mt-2 text-sm leading-[18px] text-muted">{children}</p>
    </div>
  );
}

export function ThingsToKnow({ experience }: { experience: ExperienceDetail }) {
  const activity =
    experience.activity_level?.trim() ?
      `The activity level for this experience is ${experience.activity_level.toLowerCase()} and the skill level is beginner.`
    : "The skill level for this experience is beginner.";
  const bring = experience.description.length > 240 ? `${experience.description.slice(0, 240)}…` : experience.description;

  return (
    <section className="mt-12 border-t border-hairline pt-12">
      <h2 className="text-[32px] font-semibold leading-9 tracking-[-0.02em] text-ink">Things to know</h2>
      <div className="mt-10 grid grid-cols-3 gap-x-12 gap-y-10">
        <Block icon={<Users size={24} strokeWidth={1.5} />} title="Guest requirements">
          {guestRequirementsText(experience.guest_requirements)}
        </Block>
        <Block icon={<Footprints size={24} strokeWidth={1.5} />} title="Activity level">
          {activity}
        </Block>
        <Block icon={<Backpack size={24} strokeWidth={1.5} />} title="What to bring">
          {bring}
        </Block>
        {experience.whats_included ? (
          <Block icon={<CheckCircle2 size={24} strokeWidth={1.5} />} title="What's included">
            {experience.whats_included}
          </Block>
        ) : null}
        <Block icon={<Accessibility size={24} strokeWidth={1.5} />} title="Accessibility">
          {experience.accessibility_note ?? "Message your host for details."}{" "}
          <Link href="/help/article/accessibility" className="font-semibold underline text-ink">
            Learn more
          </Link>
        </Block>
        <Block icon={<CalendarX size={24} strokeWidth={1.5} />} title="Cancellation policy">
          {cancellationPolicyText(experience.cancellation_hours)}
        </Block>
      </div>
    </section>
  );
}
