"use client";

import { Home, User, UserRound, Users } from "lucide-react";
import { SelectTile } from "@/components/host/wizard/SelectTile";
import { StepShell } from "@/components/host/wizard/StepShell";
import { useWizard } from "@/components/host/wizard/WizardContext";
import type { OccupantType } from "@/types";

const OPTIONS: { value: OccupantType; label: string; icon: typeof User }[] = [
  { value: "me", label: "Me", icon: User },
  { value: "family", label: "My family", icon: Users },
  { value: "other_guests", label: "Other guests", icon: UserRound },
  { value: "flatmates", label: "Flatmates/housemates", icon: Home },
];

export function WhoElseStep() {
  const { draft, patch } = useWizard();

  const toggle = (value: OccupantType) => {
    const selected = draft.occupants.includes(value);
    patch({
      occupants: selected ? draft.occupants.filter((item) => item !== value) : [...draft.occupants, value],
    });
  };

  return (
    <StepShell
      title="Who else might be there?"
      subtitle="Guests need to know whether they'll encounter other people during their stay."
    >
      <div className="grid grid-cols-2 gap-3 min-[1128px]:grid-cols-3 min-[1128px]:gap-4">
        {OPTIONS.map((option) => (
          <SelectTile
            key={option.value}
            icon={option.icon}
            label={option.label}
            selected={draft.occupants.includes(option.value)}
            onClick={() => toggle(option.value)}
          />
        ))}
      </div>
      <p className="mt-8 text-meta text-muted min-[1128px]:mt-10">
        We&apos;ll show this information on your listing and in search results.
      </p>
    </StepShell>
  );
}
