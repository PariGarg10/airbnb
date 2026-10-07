"use client";

import { Counter } from "@/components/ui/Counter";
import { useWizard } from "@/components/host/wizard/WizardContext";

export function SleepingSection() {
  const { draft, patch } = useWizard();
  const rows = [
    { label: "Bedrooms", value: draft.bedrooms, min: 0, max: 20, step: 1, key: "bedrooms" as const },
    { label: "Beds", value: draft.beds, min: 1, max: 30, step: 1, key: "beds" as const },
  ];

  return (
    <div className="divide-y divide-hairline">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between py-6">
          <p className="font-medium">{row.label}</p>
          <Counter
            value={row.value}
            min={row.min}
            max={row.max}
            step={row.step}
            decreaseLabel={`Decrease ${row.label}`}
            increaseLabel={`Increase ${row.label}`}
            onChange={(next) => patch({ [row.key]: next })}
          />
        </div>
      ))}
    </div>
  );
}
