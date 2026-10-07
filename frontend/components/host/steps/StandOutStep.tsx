"use client";

import { PhaseIntro } from "@/components/host/wizard/PhaseIntro";
import { Step2IntroIllustration } from "@/components/host/wizard/Step2IntroIllustration";

export function StandOutStep() {
  return (
    <PhaseIntro
      step={2}
      title="Make your place stand out"
      body="In this step, you'll add some of the amenities your place offers, plus 5 or more photos. Then you'll create a title and description."
      illustration={<Step2IntroIllustration />}
    />
  );
}
