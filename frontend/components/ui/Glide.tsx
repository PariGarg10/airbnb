"use client";

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";

const EASE = "300ms cubic-bezier(.2, 0, 0, 1)";

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
  ready: boolean;
}

export function useGlideBox(active: string | null) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box>({ x: 0, y: 0, width: 0, height: 0, ready: false });
  const [animate, setAnimate] = useState(false);

  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root || active == null) {
      setBox((current) => (current.ready ? { ...current, ready: false } : current));
      return;
    }
    const target = root.querySelector<HTMLElement>(`[data-glide="${CSS.escape(active)}"]`);
    if (!target) {
      setBox((current) => (current.ready ? { ...current, ready: false } : current));
      return;
    }
    const parent = root.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    setBox({
      x: rect.left - parent.left,
      y: rect.top - parent.top,
      width: rect.width,
      height: rect.height,
      ready: true,
    });
  }, [active]);

  useLayoutEffect(() => {
    measure();
    const frame = requestAnimationFrame(() => setAnimate(true));
    const root = rootRef.current;
    if (!root) return () => cancelAnimationFrame(frame);
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [measure]);

  return { rootRef, box, animate };
}

export function GlideUnderline({
  active,
  mode = "full",
  className,
  onMouseLeave,
  scrollerRef,
  children,
}: {
  active: string;
  mode?: "full" | "icon";
  className?: string;
  onMouseLeave?: () => void;
  scrollerRef?: { current: HTMLDivElement | null };
  children: ReactNode;
}) {
  const { rootRef, box, animate } = useGlideBox(active);
  const width = mode === "icon" ? Math.min(28, box.width) : box.width;
  const x = mode === "icon" ? box.x + (box.width - width) / 2 : box.x;
  const y = box.y + box.height - 2;

  return (
    <div
      ref={(node) => {
        (rootRef as { current: HTMLDivElement | null }).current = node;
        if (scrollerRef) scrollerRef.current = node;
      }}
      onMouseLeave={onMouseLeave}
      className={`relative ${className ?? ""}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-10 h-0.5 rounded-full bg-ink"
        style={{
          width,
          transform: `translate(${x}px, ${y}px)`,
          opacity: box.ready ? 1 : 0,
          transition: animate ? `transform ${EASE}, width ${EASE}, opacity 200ms cubic-bezier(.2, 0, 0, 1)` : "none",
        }}
      />
      {children}
    </div>
  );
}

export function GlidePill({
  active,
  tone = "light",
  inset = 0,
  className,
  onMouseLeave,
  children,
}: {
  active: string | null;
  tone?: "light" | "dark" | "muted";
  inset?: number;
  className?: string;
  onMouseLeave?: () => void;
  children: ReactNode;
}) {
  const { rootRef, box, animate } = useGlideBox(active);
  const fill = tone === "dark" ? "bg-ink" : tone === "muted" ? "bg-divider" : "bg-white shadow-pill";

  return (
    <div ref={rootRef} onMouseLeave={onMouseLeave} className={`relative ${className ?? ""}`}>
      <span
        aria-hidden
        className={`pointer-events-none absolute left-0 top-0 z-0 rounded-full ${fill}`}
        style={{
          width: Math.max(0, box.width - inset * 2),
          height: Math.max(0, box.height - inset * 2),
          transform: `translate(${box.x + inset}px, ${box.y + inset}px)`,
          opacity: box.ready ? 1 : 0,
          transition: animate ? `transform ${EASE}, width ${EASE}, height ${EASE}, opacity 200ms cubic-bezier(.2, 0, 0, 1)` : "none",
        }}
      />
      {children}
    </div>
  );
}
