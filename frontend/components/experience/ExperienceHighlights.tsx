"use client";

import { ClipboardList, Clock, MapPin } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { experienceDurationLabel, hostTagline } from "@/lib/experienceLabels";
import type { ExperienceDetail } from "@/types/experience";

function IconTile({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-soft text-ink">{children}</div>
  );
}

export function ExperienceHighlights({ experience }: { experience: ExperienceDetail }) {
  const tagline = hostTagline(experience.host.bio, experience.city);
  return (
    <ul className="space-y-6">
      <li className="flex gap-4">
        <Avatar name={experience.host.name} src={experience.host.avatar_url} size={48} className="!h-12 !w-12 shrink-0" />
        <div>
          <p className="text-base font-semibold leading-5 text-ink">Hosted by {experience.host.name}</p>
          <p className="mt-0.5 text-sm leading-[18px] text-muted">{tagline}</p>
        </div>
      </li>
      <li className="flex gap-4">
        <IconTile>
          <MapPin size={22} strokeWidth={1.75} />
        </IconTile>
        <div>
          <p className="text-base font-semibold leading-5 text-ink">{experience.meeting_point_name}</p>
          <p className="mt-0.5 text-sm leading-[18px] text-muted">
            {experience.city}, {experience.region}
          </p>
        </div>
      </li>
      <li className="flex gap-4">
        <IconTile>
          <Clock size={22} strokeWidth={1.75} />
        </IconTile>
        <div>
          <p className="text-base font-semibold leading-5 text-ink">{experienceDurationLabel(experience.duration_minutes)}</p>
          <p className="mt-0.5 text-sm leading-[18px] text-muted">Hosted in {experience.language}</p>
        </div>
      </li>
      {experience.whats_included ? (
        <li className="flex gap-4">
          <IconTile>
            <ClipboardList size={22} strokeWidth={1.75} />
          </IconTile>
          <div>
            <p className="text-base font-semibold leading-5 text-ink">What&apos;s included</p>
            <p className="mt-0.5 text-sm leading-[18px] text-muted">{experience.whats_included}</p>
          </div>
        </li>
      ) : null}
    </ul>
  );
}
