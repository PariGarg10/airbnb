"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SaveBar({
  dirty,
  saving,
  onSave,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-end border-t border-hairline px-6 py-4">
      <Button
        type="button"
        onClick={onSave}
        disabled={!dirty || saving}
        className="min-w-[7.5rem] !bg-ink !bg-none"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : "Save"}
      </Button>
    </div>
  );
}
