"use client";

import { Armchair, Flower2, MapPin, RockingChair, Sparkles, Users, type LucideIcon } from "lucide-react";
import { StepShell } from "@/components/host/wizard/StepShell";
import { descriptionFromHighlights } from "@/components/host/wizard/highlights";
import { useWizard } from "@/components/host/wizard/WizardContext";
import { propertyLabel } from "@/lib/format";

const HIGHLIGHTS: { name: string; icon: LucideIcon }[] = [
  { name: "Peaceful", icon: Flower2 },
  { name: "Unique", icon: Sparkles },
  { name: "Family-friendly", icon: RockingChair },
  { name: "Stylish", icon: Armchair },
  { name: "Central", icon: MapPin },
  { name: "Spacious", icon: Users },
];

function selectedHighlights(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function HighlightsStep() {
  const { draft, patch } = useWizard();
  const place = draft.property_type ? propertyLabel(draft.property_type).toLowerCase() : "place";
  const selected = selectedHighlights(draft.highlights);

  const toggle = (name: string) => {
    const next = selected.includes(name)
      ? selected.filter((item) => item !== name)
      : selected.length >= 2
        ? selected
        : [...selected, name];
    const joined = next.join(",");
    const place = draft.property_type ? propertyLabel(draft.property_type) : "place";
    const suggested = descriptionFromHighlights(joined, place);
    patch({
      highlights: joined,
      ...(suggested ? { description: suggested } : {}),
    });
  };

  return (
    <StepShell
      title={`Next, let's describe your ${place}`}
      subtitle="Choose up to 2 highlights. We'll use these to get your description started."
    >
      <div className="flex flex-wrap justify-center gap-3 min-[1128px]:max-w-xl min-[1128px]:gap-4">
        {HIGHLIGHTS.map((item) => {
          const Icon = item.icon;
          const active = selected.includes(item.name);
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => toggle(item.name)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-body min-[1128px]:px-5 min-[1128px]:py-3.5 ${
                active ? "border-2 border-[#222222] bg-[#F7F7F7] font-semibold" : "border-hairline hover:border-[#222222]"
              }`}
            >
              <Icon size={18} strokeWidth={1.5} />
              {item.name}
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}
