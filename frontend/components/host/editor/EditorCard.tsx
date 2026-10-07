"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";

export function EditorCard({
  title,
  summary,
  selected,
  split,
  onClick,
}: {
  title: string;
  summary: ReactNode;
  selected: boolean;
  split?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected ? "true" : undefined}
      className={clsx(
        "w-full rounded-3xl border-2 bg-white p-6 text-left shadow-[0_6px_16px_rgba(0,0,0,0.08)]",
        selected ? "border-ink" : "border-transparent",
      )}
    >
      {split ? (
        summary
      ) : (
        <>
          <p className="t-editor-title">{title}</p>
          <div className="t-editor-summary mt-2">{summary}</div>
        </>
      )}
    </button>
  );
}
