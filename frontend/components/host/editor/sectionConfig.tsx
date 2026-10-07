"use client";

import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/brand";
import { ComingSoonPanel } from "@/components/host/editor/ComingSoonPanel";
import { CheckinPanel, CheckinSummary } from "@/components/host/editor/ArrivalGuide";
import { LanguagesPanel, RemovePreferencePanel } from "@/components/host/editor/PreferencesView";
import { AmenitiesSection } from "@/components/host/editor/sections/AmenitiesSection";
import { DescriptionSection } from "@/components/host/editor/sections/DescriptionSection";
import { GuestsSection } from "@/components/host/editor/sections/GuestsSection";
import { LocationSection, LocationSummary } from "@/components/host/editor/sections/LocationSection";
import { PhotosSection } from "@/components/host/editor/sections/PhotosSection";
import { PricingSection } from "@/components/host/editor/sections/PricingSection";
import { PropertySection } from "@/components/host/editor/sections/PropertySection";
import {
  BathroomsEditorSection,
  BookingSettingsSection,
  DiscountsSection,
  LocationPrivacySection,
  SafetyDetailsSection,
  WhoElseEditorSection,
} from "@/components/host/editor/sections/HostSetupSections";
import { HostResidentialSection } from "@/components/host/editor/sections/HostResidentialSection";
import { SleepingSection } from "@/components/host/editor/sections/SleepingSection";
import { TitleSection } from "@/components/host/editor/sections/TitleSection";
import {
  CancellationPanel,
  HostBody,
  HostEditor,
  HouseRulesBody,
  HouseRulesEditor,
} from "@/components/host/editor/sections/ReadOnlySections";
import type { ListingDraft } from "@/hooks/useListingDraft";
import { amenityIcon } from "@/lib/amenityIcons";
import { formatInr, propertyLabel, roomTypeLabel } from "@/lib/format";
import type { Amenity } from "@/types";
import {
  addressValid,
  locationValid,
  photosValid,
  placeTypeValid,
  priceValid,
  propertyTypeValid,
  titleValid,
  bathroomsValid,
} from "@/components/host/wizard/validators";

export interface EditorContext {
  draft: ListingDraft;
  amenities: Amenity[];
  hostName: string;
  joinedYear: number;
  avatarUrl: string | null;
}

export interface EditorSection {
  id: string;
  title: string;
  tab: "space" | "arrival" | "preferences";
  editable: boolean;
  split?: boolean;
  fields?: (keyof ListingDraft)[];
  validate?: (draft: ListingDraft) => string | null;
  summary: (ctx: EditorContext) => ReactNode;
  Editor: React.ComponentType;
}

function ComingSoonEditor() {
  return <ComingSoonPanel />;
}
const addDetails = () => "Add details";

function countPhrase(value: number, singular: string, plural: string) {
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${text} ${value === 1 ? singular : plural}`;
}

function selectedAmenities(ctx: EditorContext) {
  return ctx.amenities.filter((item) => ctx.draft.amenity_ids.includes(item.id));
}

function photosSummary(draft: ListingDraft) {
  const urls = draft.image_urls;
  const count = urls.length;
  return (
    <div className="flex items-center gap-3">
      {count > 0 ? (
        <div className="flex">
          {urls.slice(0, 3).map((url, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${url}-${index}`}
              src={url}
              alt=""
              className="h-12 w-12 rounded-lg border-2 border-white object-cover"
              style={{ marginLeft: index === 0 ? 0 : -12 }}
            />
          ))}
        </div>
      ) : null}
      <span>{count === 0 ? "Add photos" : `${count} ${count === 1 ? "photo" : "photos"}`}</span>
    </div>
  );
}

export const EDITOR_SECTIONS: EditorSection[] = [
  {
    id: "photos",
    title: "Photos",
    tab: "space",
    editable: true,
    fields: ["images", "image_urls"],
    validate: (draft) => (photosValid(draft) ? null : "Add at least 5 photos."),
    summary: (ctx) => photosSummary(ctx.draft),
    Editor: PhotosSection,
  },
  {
    id: "title",
    title: "Title",
    tab: "space",
    editable: true,
    fields: ["title"],
    validate: (draft) => (titleValid(draft) ? null : "Use 5 to 50 characters."),
    summary: (ctx) => <span className="text-2xl text-muted">{ctx.draft.title || "Add a title"}</span>,
    Editor: TitleSection,
  },
  {
    id: "property",
    title: "Property type",
    tab: "space",
    editable: true,
    fields: ["property_type", "room_type", "category"],
    validate: (draft) =>
      propertyTypeValid(draft) && placeTypeValid(draft) ? null : "Choose a property type, a room type, and a category.",
    summary: (ctx) =>
      ctx.draft.room_type && ctx.draft.property_type
        ? `${roomTypeLabel(ctx.draft.room_type)} · ${propertyLabel(ctx.draft.property_type)}`
        : "Add details",
    Editor: PropertySection,
  },
  {
    id: "sleeping",
    title: "Sleeping arrangements",
    tab: "space",
    editable: true,
    fields: ["bedrooms", "beds"],
    validate: (draft) =>
      draft.bedrooms >= 0 && draft.bedrooms <= 20 && draft.beds >= 1 && draft.beds <= 30 ? null : "Check bedrooms and beds.",
    summary: (ctx) =>
      `${countPhrase(ctx.draft.bedrooms, "bedroom", "bedrooms")} · ${countPhrase(ctx.draft.beds, "bed", "beds")}`,
    Editor: SleepingSection,
  },
  {
    id: "bathrooms",
    title: "Bathrooms",
    tab: "space",
    editable: true,
    fields: ["private_bathrooms", "dedicated_bathrooms", "shared_bathrooms", "bathrooms"],
    validate: (draft) => (bathroomsValid(draft) ? null : "Add at least 0.5 bathrooms total."),
    summary: (ctx) => countPhrase(ctx.draft.bathrooms, "bath", "baths"),
    Editor: BathroomsEditorSection,
  },
  {
    id: "who-else",
    title: "Who else might be there",
    tab: "space",
    editable: true,
    fields: ["occupants"],
    validate: () => null,
    summary: (ctx) => (ctx.draft.occupants.length ? ctx.draft.occupants.join(", ") : "Not specified"),
    Editor: WhoElseEditorSection,
  },
  {
    id: "pricing",
    title: "Pricing",
    tab: "space",
    editable: true,
    fields: ["price_per_night", "cleaning_fee", "weekend_adjustment_pct"],
    validate: (draft) => (priceValid(draft) ? null : "Base price must be at least ₹100."),
    summary: (ctx) => `${formatInr(ctx.draft.price_per_night)} per night`,
    Editor: PricingSection,
  },
  {
    id: "discounts",
    title: "Discounts",
    tab: "space",
    editable: true,
    fields: ["discount_new_listing_pct", "discount_last_minute_pct", "discount_weekly_pct", "discount_monthly_pct"],
    validate: () => null,
    summary: (ctx) =>
      [
        ctx.draft.discount_weekly_pct ? `${ctx.draft.discount_weekly_pct}% weekly` : null,
        ctx.draft.discount_monthly_pct ? `${ctx.draft.discount_monthly_pct}% monthly` : null,
      ]
        .filter(Boolean)
        .join(" · ") || "Set discounts",
    Editor: DiscountsSection,
  },
  {
    id: "availability",
    title: "Availability",
    tab: "space",
    editable: false,
    summary: () => "1–30 night stays · Same-day advance notice",
    Editor: ComingSoonEditor,
  },
  {
    id: "guests",
    title: "Number of guests",
    tab: "space",
    editable: true,
    fields: ["max_guests"],
    validate: (draft) => (draft.max_guests >= 1 && draft.max_guests <= 16 ? null : "Choose 1 to 16 guests."),
    summary: (ctx) => countPhrase(ctx.draft.max_guests, "guest", "guests"),
    Editor: GuestsSection,
  },
  {
    id: "description",
    title: "Description",
    tab: "space",
    editable: true,
    fields: ["description"],
    validate: (draft) => {
      const text = draft.description.trim();
      if (text.length < 20) return "Use at least 20 characters.";
      if (text.length > 2000) return "Use 2000 characters or fewer.";
      return null;
    },
    summary: (ctx) => <span className="line-clamp-2">{ctx.draft.description || "Add a description"}</span>,
    Editor: DescriptionSection,
  },
  {
    id: "amenities",
    title: "Amenities",
    tab: "space",
    editable: true,
    fields: ["amenity_ids"],
    summary: (ctx) => {
      const selected = selectedAmenities(ctx);
      if (selected.length === 0) return "Add details";
      return (
        <div className="space-y-2">
          {selected.slice(0, 3).map((item) => {
            const Icon = amenityIcon(item.icon);
            return (
              <p key={item.id} className="flex items-center gap-3 text-meta text-muted">
                <Icon size={18} className="shrink-0 text-ink" />
                <span>{item.name}</span>
              </p>
            );
          })}
        </div>
      );
    },
    Editor: AmenitiesSection,
  },
  {
    id: "accessibility",
    title: "Accessibility features",
    tab: "space",
    editable: false,
    summary: addDetails,
    Editor: ComingSoonEditor,
  },
  {
    id: "location",
    title: "Location",
    tab: "space",
    editable: true,
    fields: ["address", "city", "state", "country", "lat", "lng", "show_precise_location"],
    validate: (draft) =>
      addressValid(draft) && locationValid(draft) ? null : "Add a street address, city, country, and map pin.",
    summary: (ctx) => <LocationSummary lat={ctx.draft.lat} lng={ctx.draft.lng} address={ctx.draft.address} />,
    Editor: LocationSection,
  },
  {
    id: "location-privacy",
    title: "Location privacy",
    tab: "space",
    editable: true,
    fields: ["show_precise_location"],
    validate: () => null,
    summary: (ctx) => (ctx.draft.show_precise_location ? "Precise location shown" : "Approximate location shown"),
    Editor: LocationPrivacySection,
  },
  {
    id: "host",
    title: "About the host",
    tab: "space",
    editable: false,
    summary: (ctx) => <HostBody name={ctx.hostName} year={ctx.joinedYear} avatarUrl={ctx.avatarUrl} />,
    Editor: HostEditor,
  },
  {
    id: "cohosts",
    title: "Co-hosts",
    tab: "space",
    editable: false,
    summary: addDetails,
    Editor: ComingSoonEditor,
  },
  {
    id: "booking",
    title: "Booking settings",
    tab: "space",
    editable: true,
    fields: ["booking_mode"],
    validate: () => null,
    summary: (ctx) => (ctx.draft.booking_mode === "instant" ? "Instant Book" : "Approve first 5 bookings"),
    Editor: BookingSettingsSection,
  },
  {
    id: "house-rules",
    title: "House rules",
    tab: "space",
    editable: false,
    summary: (ctx) => <HouseRulesBody guests={ctx.draft.max_guests} />,
    Editor: HouseRulesEditor,
  },
  {
    id: "safety",
    title: "Safety details",
    tab: "space",
    editable: true,
    fields: ["has_exterior_camera", "has_noise_monitor", "has_weapons"],
    validate: () => null,
    summary: (ctx) => {
      const flags = [
        ctx.draft.has_exterior_camera ? "Camera" : null,
        ctx.draft.has_noise_monitor ? "Noise monitor" : null,
        ctx.draft.has_weapons ? "Weapons" : null,
      ].filter(Boolean);
      return flags.length ? flags.join(" · ") : "No safety flags";
    },
    Editor: SafetyDetailsSection,
  },
  {
    id: "cancellation",
    title: "Cancellation policy",
    tab: "space",
    editable: false,
    summary: () => "Free cancellation before check-in",
    Editor: CancellationPanel,
  },
  {
    id: "custom-link",
    title: "Custom link",
    tab: "space",
    editable: false,
    summary: addDetails,
    Editor: ComingSoonEditor,
  },
  {
    id: "checkin",
    title: "Check-in & checkout",
    tab: "arrival",
    editable: false,
    split: true,
    summary: () => <CheckinSummary />,
    Editor: CheckinPanel,
  },
  { id: "directions", title: "Directions", tab: "arrival", editable: false, summary: addDetails, Editor: ComingSoonEditor },
  { id: "checkin-method", title: "Check-in method", tab: "arrival", editable: false, summary: addDetails, Editor: ComingSoonEditor },
  { id: "wifi", title: "Wifi details", tab: "arrival", editable: false, summary: addDetails, Editor: ComingSoonEditor },
  { id: "house-manual", title: "House manual", tab: "arrival", editable: false, summary: addDetails, Editor: ComingSoonEditor },
  {
    id: "arrival-rules",
    title: "House rules",
    tab: "arrival",
    editable: false,
    summary: (ctx) => <HouseRulesBody guests={ctx.draft.max_guests} />,
    Editor: HouseRulesEditor,
  },
  {
    id: "checkout-instructions",
    title: "Checkout instructions",
    tab: "arrival",
    editable: false,
    summary: addDetails,
    Editor: ComingSoonEditor,
  },
  {
    id: "guidebooks",
    title: "Guidebooks",
    tab: "arrival",
    editable: false,
    summary: () => "Create a guidebook to share your local tips with guests.",
    Editor: ComingSoonEditor,
  },
  {
    id: "interaction",
    title: "Interaction preferences",
    tab: "arrival",
    editable: false,
    summary: addDetails,
    Editor: ComingSoonEditor,
  },
  {
    id: "residential-address",
    title: "Residential address",
    tab: "preferences",
    editable: true,
    summary: () => "Used for payouts and verification",
    Editor: HostResidentialSection,
  },
  {
    id: "languages",
    title: "Languages",
    tab: "preferences",
    editable: false,
    summary: () => "English",
    Editor: LanguagesPanel,
  },
  {
    id: "guest-requirements",
    title: "Guest requirements",
    tab: "preferences",
    editable: false,
    summary: () => "Profile photo not required",
    Editor: ComingSoonEditor,
  },
  {
    id: "local-laws",
    title: "Local laws",
    tab: "preferences",
    editable: false,
    summary: () => "Review your local laws",
    Editor: ComingSoonEditor,
  },
  {
    id: "taxes",
    title: "Taxes",
    tab: "preferences",
    editable: false,
    summary: () => "Learn how taxes work for Hosts",
    Editor: ComingSoonEditor,
  },
  {
    id: "airbnb-org",
    title: `${APP_NAME}.org stays`,
    tab: "preferences",
    editable: false,
    summary: () => "Set a discount",
    Editor: ComingSoonEditor,
  },
  {
    id: "remove",
    title: "Remove listing",
    tab: "preferences",
    editable: false,
    summary: () => "Permanently remove your listing",
    Editor: RemovePreferencePanel,
  },
];

export function sectionsFor(tab: "space" | "arrival" | "preferences") {
  return EDITOR_SECTIONS.filter((section) => section.tab === tab);
}
