"use client";

import { StepShell } from "@/components/host/wizard/StepShell";
import { useWizard } from "@/components/host/wizard/WizardContext";
import { propertyLabel } from "@/lib/format";

export function TitleStep() {
  const { draft, patch } = useWizard();
  const place = draft.property_type ? propertyLabel(draft.property_type).toLowerCase() : "place";

  return (
    <StepShell
      title={`Now, let's give your ${place} a title`}
      subtitle="Short titles work best. Have fun with it – you can always change it later."
    >
      <textarea
        value={draft.title}
        maxLength={50}
        rows={5}
        onChange={(event) => patch({ title: event.target.value })}
        className="w-full resize-y rounded-xl border border-hairline p-4 text-lg outline-none focus:border-ink min-[1128px]:min-h-[160px] min-[1128px]:rounded-2xl min-[1128px]:p-5 min-[1128px]:text-xl"
      />
      <p className="mt-2 text-label text-muted">{draft.title.length}/50</p>
    </StepShell>
  );
}
