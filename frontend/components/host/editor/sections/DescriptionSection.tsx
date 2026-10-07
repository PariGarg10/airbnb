"use client";

import { DescriptionStep } from "@/components/host/steps/DescriptionStep";
import { stepEmbed } from "@/components/host/editor/stepEmbed";

export function DescriptionSection() {
  return (
    <div className={stepEmbed}>
      <DescriptionStep />
    </div>
  );
}
