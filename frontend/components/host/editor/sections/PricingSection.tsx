"use client";

import { stepEmbed } from "@/components/host/editor/stepEmbed";
import { WeekendPricingRow } from "@/components/host/editor/sections/HostSetupSections";
import { PriceStep } from "@/components/host/steps/PriceStep";

export function PricingSection() {
  return (
    <div className={stepEmbed}>
      <PriceStep />
      <WeekendPricingRow />
    </div>
  );
}
