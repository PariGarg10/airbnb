"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

export function usePopoverPlacement(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  estimatedHeight: number,
) {
  const [state, setState] = useState<{ maxHeight: number; placement: "below" | "above" }>({
    maxHeight: estimatedHeight,
    placement: "below",
  });

  useLayoutEffect(() => {
    if (!open) return;

    const measure = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const margin = 16;
      const below = window.innerHeight - rect.bottom - margin;
      const above = rect.top - margin;
      const placement = below >= estimatedHeight || below >= above ? "below" : "above";
      const space = placement === "below" ? below : above;
      setState({
        placement,
        maxHeight: Math.max(160, Math.min(estimatedHeight, space)),
      });
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, anchorRef, estimatedHeight]);

  return state;
}
