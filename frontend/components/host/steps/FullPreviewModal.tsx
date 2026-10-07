"use client";

import { useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { Divider } from "@/components/ui/Divider";
import { useWizard } from "@/components/host/wizard/WizardContext";
import { listingsApi } from "@/lib/api";
import { amenityIcon } from "@/lib/amenityIcons";
import { roomTypeLabel } from "@/lib/format";
import { useAuth } from "@/lib/auth";

function countLabel(value: number, singular: string, plural: string): string {
  const text = Number.isInteger(value) ? String(value) : String(value);
  return `${text} ${value === 1 ? singular : plural}`;
}

export function FullPreviewModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { draft } = useWizard();
  const { user } = useAuth();
  const amenities = useQuery({ queryKey: ["amenities"], queryFn: listingsApi.amenities, enabled: open });
  const chosen = (amenities.data ?? []).filter((amenity) => draft.amenity_ids.includes(amenity.id));
  const name = user?.name || "you";
  const room = draft.room_type ? roomTypeLabel(draft.room_type) : "Place";
  const cover = draft.image_urls[0];

  return (
    <Modal open={open} title="Full preview" onClose={onClose} size="lg">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-xl bg-soft">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="aspect-square w-full object-cover" />
          ) : (
            <div className="aspect-square w-full" />
          )}
        </div>
        <div>
          <h3 className="t-listing-title">{draft.title || "Untitled"}</h3>
          <div className="mt-4 flex items-start justify-between gap-3">
            <p className="font-semibold">
              {room} hosted by {name}
            </p>
            <Avatar name={name} src={user?.avatar_url} size={48} />
          </div>
          <p className="mt-2 text-meta text-muted">
            {countLabel(draft.max_guests, "guest", "guests")} · {countLabel(draft.bedrooms, "bedroom", "bedrooms")} · {countLabel(draft.beds, "bed", "beds")} · {countLabel(draft.bathrooms, "bathroom", "bathrooms")}
          </p>
          <Divider className="my-4" />
          <p className="whitespace-pre-wrap text-body">{draft.description}</p>
          <Divider className="my-4" />
          <h4 className="font-semibold">Amenities</h4>
          {chosen.length === 0 ? <p className="mt-3 text-meta text-muted">No amenities selected</p> : null}
          <div className="mt-2 divide-y divide-hairline">
            {chosen.map((amenity) => {
              const Icon = amenityIcon(amenity.icon);
              return (
                <p key={amenity.id} className="flex items-center gap-3 py-3 text-body">
                  <Icon size={20} strokeWidth={1.5} />
                  {amenity.name}
                </p>
              );
            })}
          </div>
          <Divider className="my-4" />
          <h4 className="font-semibold">Location</h4>
          <p className="mt-2 text-body">{draft.address}</p>
          <p className="mt-2 text-meta text-muted">We&apos;ll only share your address with guests who are booked.</p>
        </div>
      </div>
    </Modal>
  );
}
