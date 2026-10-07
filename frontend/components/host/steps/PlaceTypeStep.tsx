"use client";

import { BedDouble, House, Users } from "lucide-react";
import { SelectCard } from "@/components/host/wizard/SelectCard";
import { StepShell } from "@/components/host/wizard/StepShell";
import { useWizard } from "@/components/host/wizard/WizardContext";
import type { RoomType } from "@/types";

const OPTIONS: { value: RoomType; title: string; description: string; icon: typeof House }[] = [
  {
    value: "entire_place",
    title: "An entire place",
    description: "Guests have the whole place to themselves.",
    icon: House,
  },
  {
    value: "private_room",
    title: "A room",
    description: "Guests have their own room in a home, plus access to shared spaces.",
    icon: BedDouble,
  },
  {
    value: "shared_room",
    title: "A shared room",
    description: "Guests sleep in a shared room in a professionally managed hostel with staff on-site 24/7.",
    icon: Users,
  },
];

export function PlaceTypeStep() {
  const { draft, patch } = useWizard();
  return (
    <StepShell title="What type of place will guests have?">
      <div className="flex flex-col gap-4">
        {OPTIONS.map((option) => (
          <SelectCard
            key={option.value}
            title={option.title}
            description={option.description}
            icon={option.icon}
            selected={draft.room_type === option.value}
            onClick={() =>
              patch({
                room_type: option.value,
                bedrooms_have_locks: option.value === "private_room" ? draft.bedrooms_have_locks : null,
                occupants: option.value === "entire_place" ? [] : draft.occupants,
              })
            }
          />
        ))}
      </div>
    </StepShell>
  );
}
