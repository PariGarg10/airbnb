"use client";

import { Counter } from "@/components/ui/Counter";
import { StepShell } from "@/components/host/wizard/StepShell";
import { useWizard } from "@/components/host/wizard/WizardContext";

export function BasicsStep() {
  const { draft, patch } = useWizard();
  const rows = [
    { label: "Guests", value: draft.max_guests, min: 1, max: 16, step: 1, key: "max_guests" as const },
    { label: "Bedrooms", value: draft.bedrooms, min: 0, max: 20, step: 1, key: "bedrooms" as const },
    { label: "Beds", value: draft.beds, min: 1, max: 30, step: 1, key: "beds" as const },
  ];

  const showLocks = draft.room_type === "private_room";

  return (
    <StepShell title="Let's start with the basics" subtitle="How many people can stay here?">
      <div className="divide-y divide-hairline">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between py-6 min-[1128px]:py-7">
            <p className="font-medium text-ink">{row.label}</p>
            <Counter
              variant="stepper"
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
      {showLocks ? (
        <div className="mt-10 border-t border-hairline pt-10 min-[1128px]:mt-12">
          <p className="font-medium text-ink">Does every bedroom have a lock?</p>
          <div className="mt-4 flex flex-col gap-4">
            {[
              { value: true, label: "Yes" },
              { value: false, label: "No" },
            ].map((option) => (
              <label key={String(option.value)} className="flex cursor-pointer items-center gap-3 text-body">
                <input
                  type="radio"
                  name="bedroom-locks"
                  checked={draft.bedrooms_have_locks === option.value}
                  onChange={() => patch({ bedrooms_have_locks: option.value })}
                  className="h-5 w-5 accent-ink"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </StepShell>
  );
}
