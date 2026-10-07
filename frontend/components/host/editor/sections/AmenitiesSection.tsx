"use client";

import { AmenitiesStep } from "@/components/host/steps/AmenitiesStep";
import { stepEmbed } from "@/components/host/editor/stepEmbed";

export function AmenitiesSection() {
  return (
    <div className={stepEmbed}>
      <AmenitiesStep />
    </div>
  );
}
