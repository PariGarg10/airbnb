"use client";

import { PlaceTypeStep } from "@/components/host/steps/PlaceTypeStep";
import { PropertyTypeStep } from "@/components/host/steps/PropertyTypeStep";
import { stepEmbed } from "@/components/host/editor/stepEmbed";

export function PropertySection() {
  return (
    <div className={stepEmbed}>
      <PropertyTypeStep />
      <PlaceTypeStep />
    </div>
  );
}
