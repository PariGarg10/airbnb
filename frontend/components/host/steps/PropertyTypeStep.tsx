"use client";

import { useQuery } from "@tanstack/react-query";
import { StepShell } from "@/components/host/wizard/StepShell";
import { SelectTile } from "@/components/host/wizard/SelectTile";
import { useWizard } from "@/components/host/wizard/WizardContext";
import { propertyTypeIcons } from "@/lib/categoryIcons";
import { listingsApi } from "@/lib/api";
import { propertyLabel } from "@/lib/format";
import type { PropertyType } from "@/types";

const PROPERTY_TYPES = Object.keys(propertyTypeIcons) as PropertyType[];

export function PropertyTypeStep() {
  const { draft, patch } = useWizard();
  const categories = useQuery({ queryKey: ["categories"], queryFn: listingsApi.categories });

  return (
    <StepShell wide title="Which of these best describes your place?">
      <div className="grid grid-cols-2 gap-3 min-[1128px]:grid-cols-3 min-[1128px]:gap-4">
        {PROPERTY_TYPES.map((type) => (
          <SelectTile
            key={type}
            icon={propertyTypeIcons[type]}
            label={propertyLabel(type)}
            selected={draft.property_type === type}
            onClick={() => patch({ property_type: type })}
          />
        ))}
      </div>
      <h2 className="mb-3 mt-10 text-lg font-semibold">Which category fits best?</h2>
      <div className="flex flex-wrap gap-2">
        {categories.data?.map((item) => {
          const selected = draft.category === item.category;
          return (
            <button
              key={item.category}
              type="button"
              onClick={() => patch({ category: item.category })}
              className={`rounded-full border px-4 py-2 text-body ${selected ? "border-ink bg-soft font-semibold" : "border-hairline"}`}
            >
              {item.category}
            </button>
          );
        })}
      </div>
      {categories.isError ? <p className="mt-3 text-body text-rausch">Could not load categories</p> : null}
    </StepShell>
  );
}
