import type { ComponentType } from "react";
import { AboutPlaceStep } from "@/components/host/steps/AboutPlaceStep";
import { AddressIntroStep } from "@/components/host/steps/AddressIntroStep";
import { AmenitiesStep } from "@/components/host/steps/AmenitiesStep";
import { BasicsStep } from "@/components/host/steps/BasicsStep";
import { BathroomsStep } from "@/components/host/steps/BathroomsStep";
import { DescriptionStep } from "@/components/host/steps/DescriptionStep";
import { FinishUpStep } from "@/components/host/steps/FinishUpStep";
import { HighlightsStep } from "@/components/host/steps/HighlightsStep";
import { LocationPinStep } from "@/components/host/steps/LocationPinStep";
import { LocationPrivacyStep } from "@/components/host/steps/LocationPrivacyStep";
import { PhotosStep } from "@/components/host/steps/PhotosStep";
import { PlaceTypeStep } from "@/components/host/steps/PlaceTypeStep";
import { PriceStep } from "@/components/host/steps/PriceStep";
import { PropertyTypeStep } from "@/components/host/steps/PropertyTypeStep";
import { ReviewStep } from "@/components/host/steps/ReviewStep";
import { StandOutStep } from "@/components/host/steps/StandOutStep";
import { TitleStep } from "@/components/host/steps/TitleStep";
import { WhoElseStep } from "@/components/host/steps/WhoElseStep";
import {
  addressValid,
  amenitiesValid,
  basicsValid,
  bathroomsValid,
  descriptionValid,
  highlightsValid,
  introValid,
  locationPrivacyValid,
  locationValid,
  photosValid,
  placeTypeValid,
  priceValid,
  propertyTypeValid,
  reviewValid,
  titleValid,
  whoElseValid,
} from "@/components/host/wizard/validators";
import type { ListingDraft } from "@/hooks/useListingDraft";

export interface WizardStep {
  id: string;
  phase: 1 | 2 | 3;
  component: ComponentType;
  isValid: (draft: ListingDraft) => boolean;
}

export const WIZARD_STEPS: WizardStep[] = [
  { id: "address", phase: 1, component: AddressIntroStep, isValid: addressValid },
  { id: "about", phase: 1, component: AboutPlaceStep, isValid: introValid },
  { id: "property-type", phase: 1, component: PropertyTypeStep, isValid: propertyTypeValid },
  { id: "place-type", phase: 1, component: PlaceTypeStep, isValid: placeTypeValid },
  { id: "location", phase: 1, component: LocationPinStep, isValid: locationValid },
  { id: "location-privacy", phase: 1, component: LocationPrivacyStep, isValid: locationPrivacyValid },
  { id: "basics", phase: 1, component: BasicsStep, isValid: basicsValid },
  { id: "bathrooms", phase: 1, component: BathroomsStep, isValid: bathroomsValid },
  { id: "who-else", phase: 1, component: WhoElseStep, isValid: whoElseValid },
  { id: "stand-out", phase: 2, component: StandOutStep, isValid: introValid },
  { id: "amenities", phase: 2, component: AmenitiesStep, isValid: amenitiesValid },
  { id: "photos", phase: 2, component: PhotosStep, isValid: photosValid },
  { id: "title", phase: 2, component: TitleStep, isValid: titleValid },
  { id: "highlights", phase: 2, component: HighlightsStep, isValid: highlightsValid },
  { id: "description", phase: 2, component: DescriptionStep, isValid: descriptionValid },
  { id: "finish", phase: 3, component: FinishUpStep, isValid: introValid },
  { id: "price", phase: 3, component: PriceStep, isValid: priceValid },
  { id: "review", phase: 3, component: ReviewStep, isValid: reviewValid },
];
