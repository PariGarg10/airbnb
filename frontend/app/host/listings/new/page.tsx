"use client";

import { WIZARD_STEPS } from "@/components/host/steps";
import { useWizard } from "@/components/host/wizard/WizardContext";
import { clampStepIndex } from "@/components/host/wizard/wizardNav";

export default function NewListingPage() {
  const { draft } = useWizard();
  const index = clampStepIndex(Math.min(draft.currentStep, WIZARD_STEPS.length - 1), draft);
  const Step = WIZARD_STEPS[index].component;
  return <Step />;
}
