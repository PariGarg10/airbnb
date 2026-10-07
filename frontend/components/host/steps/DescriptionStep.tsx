"use client";

import { StepShell } from "@/components/host/wizard/StepShell";
import { useWizard } from "@/components/host/wizard/WizardContext";

export function DescriptionStep() {
  const { draft, patch } = useWizard();

  return (
    <StepShell title="Create your description" subtitle="Share what makes your place special.">
      <textarea
        value={draft.description}
        maxLength={500}
        rows={8}
        onChange={(event) => patch({ description: event.target.value })}
        className="w-full resize-y rounded-xl border border-hairline p-4 text-base outline-none focus:border-ink min-[1128px]:min-h-[200px] min-[1128px]:rounded-2xl min-[1128px]:p-5 min-[1128px]:text-lg"
      />
      <p className="mt-2 text-label text-muted">
        {draft.description.length}/500
      </p>
    </StepShell>
  );
}
