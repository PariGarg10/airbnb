"use client";

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { SaveBar } from "@/components/host/editor/SaveBar";

export function SectionPanel({
  title,
  children,
  error,
  editable,
  dirty,
  saving,
  onSave,
  onMobileBack,
}: {
  title: string;
  children: ReactNode;
  error: string | null;
  editable: boolean;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onMobileBack: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8 md:px-10">
        <div className="mx-auto w-full max-w-[680px]">
          <button
            type="button"
            onClick={onMobileBack}
            aria-label="Back to sections"
            className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-soft md:hidden"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="t-page-title">{title}</h2>
          <div className="mt-6">{children}</div>
          {error ? <p className="mt-4 text-body text-rausch">{error}</p> : null}
        </div>
      </div>
      {editable ? <SaveBar dirty={dirty} saving={saving} onSave={onSave} /> : null}
    </div>
  );
}
