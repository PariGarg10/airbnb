"use client";

import { Counter } from "@/components/ui/Counter";
import { useWizard } from "@/components/host/wizard/WizardContext";

export function GuestsSection() {
  const { draft, patch } = useWizard();
  return (
    <div className="flex items-center justify-between py-6">
      <p className="font-medium">Guests</p>
      <Counter
        value={draft.max_guests}
        min={1}
        max={16}
        decreaseLabel="Decrease guests"
        increaseLabel="Increase guests"
        onChange={(max_guests) => patch({ max_guests })}
      />
    </div>
  );
}
