"use client";

import { PhaseIntro } from "@/components/host/wizard/PhaseIntro";
import { Step3IntroIllustration } from "@/components/host/wizard/Step3IntroIllustration";

export function FinishUpStep() {
  return (
    <PhaseIntro
      step={3}
      title="Finish up and publish"
      body="Finally, you'll choose booking settings, set up pricing and publish your listing."
      illustration={<Step3IntroIllustration />}
    />
  );
}
