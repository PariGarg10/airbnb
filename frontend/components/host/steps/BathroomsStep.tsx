"use client";

import { Counter } from "@/components/ui/Counter";
import { StepShell } from "@/components/host/wizard/StepShell";
import { useWizard } from "@/components/host/wizard/WizardContext";

const ROWS = [
  {
    key: "private_bathrooms" as const,
    title: "Private and attached",
    description: "It's connected to the guest's room and is just for them.",
  },
  {
    key: "dedicated_bathrooms" as const,
    title: "Dedicated",
    description: "It's private, but accessed via a shared space, such as a hallway.",
  },
  {
    key: "shared_bathrooms" as const,
    title: "Shared",
    description: "It's shared with other people.",
  },
];

export function BathroomsStep() {
  const { draft, patch } = useWizard();

  const syncTotal = (next: Partial<typeof draft>) => {
    const privateB = next.private_bathrooms ?? draft.private_bathrooms;
    const dedicatedB = next.dedicated_bathrooms ?? draft.dedicated_bathrooms;
    const sharedB = next.shared_bathrooms ?? draft.shared_bathrooms;
    patch({ ...next, bathrooms: privateB + dedicatedB + sharedB });
  };

  return (
    <StepShell title="What kind of bathrooms are available to guests?">
      <div className="divide-y divide-hairline">
        {ROWS.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-6 py-6 min-[1128px]:py-7">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">{row.title}</p>
              <p className="mt-1 text-meta text-muted">{row.description}</p>
            </div>
            <Counter
              variant="stepper"
              value={draft[row.key]}
              min={0}
              max={20}
              step={0.5}
              decreaseLabel={`Decrease ${row.title}`}
              increaseLabel={`Increase ${row.title}`}
              onChange={(value) => syncTotal({ [row.key]: value })}
            />
          </div>
        ))}
      </div>
    </StepShell>
  );
}
