"use client";

import { TitleStep } from "@/components/host/steps/TitleStep";
import { stepEmbed } from "@/components/host/editor/stepEmbed";

export function TitleSection() {
  return (
    <div className={stepEmbed}>
      <TitleStep />
    </div>
  );
}
