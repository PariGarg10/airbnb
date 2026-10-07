"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { useEditorUi } from "@/components/host/editor/editorUi";
import { APP_NAME } from "@/lib/brand";

export const PREFERENCE_ROWS = [
  { id: "residential-address", title: "Residential address", summary: "Add your residential address" },
  { id: "languages", title: "Languages", summary: "English" },
  { id: "guest-requirements", title: "Guest requirements", summary: "Profile photo not required" },
  { id: "local-laws", title: "Local laws", summary: "Review your local laws" },
  { id: "taxes", title: "Taxes", summary: "Learn how taxes work for Hosts" },
  { id: "airbnb-org", title: `${APP_NAME}.org stays`, summary: "Set a discount" },
  { id: "remove", title: "Remove listing", summary: "Permanently remove your listing" },
] as const;

export function LanguagesPanel() {
  return (
    <div>
      <p className="max-w-xl text-meta text-muted">
        For some settings, you can add details in any language you add to your listing. Guests will be shown automatic
        translations for everything else.
      </p>
      <div className="mt-8 border-b border-hairline py-4">
        <p className="font-medium">English (Default)</p>
      </div>
      <button
        type="button"
        onClick={() => toast("Coming soon")}
        className="mt-6 rounded-lg border border-ink px-4 py-2 text-body font-semibold"
      >
        + Add a language
      </button>
    </div>
  );
}

export function RemovePreferencePanel() {
  const { openRemove } = useEditorUi();
  return (
    <div>
      <p className="text-meta text-muted">Permanently remove your listing.</p>
      <button type="button" onClick={openRemove} className="search-fill t-button mt-6 rounded-lg px-5 py-3 text-white">
        Remove listing
      </button>
    </div>
  );
}

export function PreferencesView({
  selectedId,
  onBack,
  onSelect,
}: {
  selectedId: string;
  onBack: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to listing editor"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-soft"
      >
        <ArrowLeft size={18} />
      </button>
      <h1 className="t-page-title mt-4">Edit preferences</h1>
      <div className="mt-6 space-y-1">
        {PREFERENCE_ROWS.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => onSelect(row.id)}
            className={clsx(
              "flex w-full items-center justify-between gap-3 rounded-xl px-4 py-4 text-left",
              selectedId === row.id && "bg-soft",
            )}
          >
            <span>
              <span className="t-editor-title block">{row.title}</span>
              <span className="t-editor-summary mt-0.5 block">{row.summary}</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-meta text-muted" />
          </button>
        ))}
      </div>
    </div>
  );
}
