"use client";

import { PhaseIntro } from "@/components/host/wizard/PhaseIntro";
import { Step1IntroIllustration } from "@/components/host/wizard/Step1IntroIllustration";

export function AboutPlaceStep() {
  return (
    <PhaseIntro
      step={1}
      title="Tell us about your place"
      body="In this step, we'll ask which type of property you have and if guests will book the entire place or just a room. Then tell us the location and how many guests can stay."
      illustration={<Step1IntroIllustration />}
    />
  );
}
