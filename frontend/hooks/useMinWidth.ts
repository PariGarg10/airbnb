"use client";

import { useEffect, useState } from "react";

/** True when viewport width is at least `min` CSS pixels. */
export function useMinWidth(min: number) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${min}px)`);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [min]);

  return matches;
}
