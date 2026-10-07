"use client";

import { useQuery } from "@tanstack/react-query";
import { SelectTile } from "@/components/host/wizard/SelectTile";
import { StepShell } from "@/components/host/wizard/StepShell";
import { useWizard } from "@/components/host/wizard/WizardContext";
import { listingsApi } from "@/lib/api";
import { amenityIcon } from "@/lib/amenityIcons";
import { amenityGroupLabel, amenityHint, groupAmenitiesOrdered } from "@/lib/amenityGroups";

export function AmenitiesStep() {
  const { draft, patch } = useWizard();
  const amenities = useQuery({ queryKey: ["amenities"], queryFn: listingsApi.amenities });

  const toggle = (id: number) => {
    const selected = draft.amenity_ids.includes(id);
    patch({
      amenity_ids: selected ? draft.amenity_ids.filter((item) => item !== id) : [...draft.amenity_ids, id],
    });
  };

  return (
    <StepShell
      wide
      title="Tell guests which amenities they'll find at your place"
      subtitle="You can add more amenities after you publish your listing."
    >
      {amenities.isError ? <p className="text-body text-rausch">Could not load amenities</p> : null}
      {amenities.isLoading ? (
        <div className="space-y-6">
          <div className="h-8 w-32 skeleton rounded-lg" />
          <div className="grid grid-cols-2 gap-3 min-[1128px]:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-28 skeleton rounded-2xl" />
            ))}
          </div>
        </div>
      ) : null}
      <div className="space-y-10 min-[1128px]:space-y-12">
        {groupAmenitiesOrdered(amenities.data ?? []).map(([group, items]) => (
          <section key={group}>
            <h2 className="mb-4 text-lg font-semibold text-ink min-[1128px]:mb-5 min-[1128px]:text-xl">{amenityGroupLabel(group)}</h2>
            <div className="grid grid-cols-2 gap-3 min-[1128px]:grid-cols-3 min-[1128px]:gap-4">
              {items.map((amenity) => (
                <SelectTile
                  key={amenity.id}
                  icon={amenityIcon(amenity.icon)}
                  label={amenity.name}
                  hint={amenityHint(amenity.name)}
                  selected={draft.amenity_ids.includes(amenity.id)}
                  onClick={() => toggle(amenity.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </StepShell>
  );
}
