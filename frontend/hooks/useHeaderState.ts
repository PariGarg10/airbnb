"use client";

import { useCallback, useEffect, useState } from "react";

export type HeaderSegment = "where" | "when" | "who" | "service";

export function useHeaderState(tall: boolean) {
  const [scrolled, setScrolled] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [segment, setSegment] = useState<HeaderSegment | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled((current) => (current ? y > 12 : y > 80));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!tall) {
      setPinned(false);
      setSegment(null);
    }
  }, [tall]);

  useEffect(() => {
    if (tall && !scrolled) setPinned(false);
  }, [scrolled, tall]);

  useEffect(() => {
    if (tall && scrolled && !pinned) setSegment(null);
  }, [pinned, scrolled, tall]);

  const expanded = (tall && !scrolled) || pinned;

  const open = useCallback((next: HeaderSegment) => {
    if (!tall || window.scrollY > 12) setPinned(true);
    setSegment(next);
  }, [tall]);

  const close = useCallback(() => {
    setPinned(false);
    setSegment(null);
  }, []);

  return { expanded, scrolled, pinned, segment, open, close };
}
