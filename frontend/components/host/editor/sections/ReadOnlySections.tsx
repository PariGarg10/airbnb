"use client";

import { useQuery } from "@tanstack/react-query";
import { AlarmSmoke, Ban, Clock, Users } from "lucide-react";
import { useEditorUi } from "@/components/host/editor/editorUi";
import { useWizard } from "@/components/host/wizard/WizardContext";
import { listingsApi } from "@/lib/api";

export function HouseRulesBody({ guests }: { guests: number }) {
  return (
    <div className="space-y-3 text-meta text-muted">
      <p className="flex items-center gap-3">
        <Clock size={18} className="shrink-0 text-ink" />
        <span>Check-in after 2:00 pm</span>
      </p>
      <p className="flex items-center gap-3">
        <Users size={18} className="shrink-0 text-ink" />
        <span>
          {guests} {guests === 1 ? "guest" : "guests"} maximum
        </span>
      </p>
    </div>
  );
}

export function HouseRulesEditor() {
  const { draft } = useWizard();
  return (
    <div>
      <HouseRulesBody guests={draft.max_guests} />
      <p className="mt-6 text-meta text-muted">House rules are fixed in this demo.</p>
    </div>
  );
}

function reported(names: string[], needle: string) {
  return names.some((name) => name.toLowerCase().includes(needle));
}

export function SafetyBody({ names }: { names: string[] }) {
  const rows = [
    {
      on: reported(names, "carbon monoxide"),
      label: reported(names, "carbon monoxide") ? "Carbon monoxide alarm" : "Carbon monoxide alarm not reported",
    },
    {
      on: reported(names, "smoke"),
      label: reported(names, "smoke") ? "Smoke alarm" : "Smoke alarm not reported",
    },
  ];
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <p key={row.label} className="flex items-center gap-3 text-meta text-muted">
          {row.on ? <AlarmSmoke size={18} className="shrink-0 text-ink" /> : <Ban size={18} className="shrink-0" />}
          <span className={row.on ? "text-ink" : ""}>{row.label}</span>
        </p>
      ))}
    </div>
  );
}

export function SafetyEditor() {
  const { draft } = useWizard();
  const amenities = useQuery({ queryKey: ["amenities"], queryFn: listingsApi.amenities });
  const names = (amenities.data ?? [])
    .filter((item) => draft.amenity_ids.includes(item.id))
    .map((item) => item.name);
  return (
    <div>
      <SafetyBody names={names} />
      <p className="mt-6 text-meta text-muted">These details come from the Safety amenities on this listing.</p>
    </div>
  );
}

export function CancellationPanel() {
  return (
    <div>
      <p className="text-meta text-muted">Free cancellation before check-in</p>
      <p className="mt-6 text-meta text-muted">This policy is fixed in this demo.</p>
    </div>
  );
}

export function HostEditor() {
  const host = useEditorUi();
  return <HostBody name={host.hostName} year={host.joinedYear} avatarUrl={host.avatarUrl} />;
}

export function HostBody({
  name,
  year,
  avatarUrl,
}: {
  name: string;
  year: number;
  avatarUrl: string | null;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "H";
  return (
    <div className="flex flex-col items-center py-4 text-center">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-24 w-24 rounded-full object-cover" />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-peach text-3xl font-semibold text-peach-ink">
          {initial}
        </div>
      )}
      <p className="mt-4 text-lg font-semibold text-ink">{name}</p>
      <p className="text-meta text-muted">Started hosting in {year}</p>
    </div>
  );
}
