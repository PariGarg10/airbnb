"use client";

import { Modal } from "@/components/ui/Modal";
import { ListingAmenityRow } from "@/components/listing/modals/ListingAmenityRow";
import { groupAmenities, missingAmenities } from "@/lib/listingAmenities";
import { amenityIcon } from "@/lib/amenityIcons";
import type { Amenity } from "@/types";

export function ListingAmenitiesModal({
  open,
  onClose,
  amenities,
}: {
  open: boolean;
  onClose: () => void;
  amenities: Amenity[];
}) {
  const missing = missingAmenities(amenities);

  return (
    <Modal open={open} title="What this place offers" onClose={onClose} variant="listing" titleInBody size="lg">
      <div className="max-[1127px]:space-y-8 min-[1128px]:-mt-4">
        {groupAmenities(amenities).map(([group, items]) => (
          <section key={group}>
            <h3 className="text-base font-semibold leading-5 text-ink min-[1128px]:text-lg min-[1128px]:leading-6">{group}</h3>
            <div className="mt-1 min-[1128px]:mt-2">
              {items.map((amenity) => {
                const Icon = amenityIcon(amenity.icon);
                return (
                  <div key={amenity.id} className="flex gap-4 border-b border-divider py-5 max-[1127px]:hidden min-[1128px]:flex">
                    <Icon size={24} strokeWidth={1.5} className="shrink-0" aria-hidden />
                    <p className="text-base leading-5 text-ink">{amenity.name}</p>
                  </div>
                );
              })}
              {items.map((amenity) => (
                <p key={`m-${amenity.id}`} className="t-amenity flex items-center gap-4 border-b border-divider py-4 min-[1128px]:hidden">
                  {(() => {
                    const Icon = amenityIcon(amenity.icon);
                    return <Icon size={24} strokeWidth={1.5} />;
                  })()}
                  {amenity.name}
                </p>
              ))}
            </div>
          </section>
        ))}

        {missing.length > 0 ? (
          <section className="hidden min-[1128px]:block">
            <h3 className="text-lg font-semibold leading-6 text-ink">Not included</h3>
            <div className="mt-2">
              {missing.map((item) => (
                <ListingAmenityRow key={item.name} name={item.name} icon={item.icon} unavailable note={item.note} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </Modal>
  );
}
