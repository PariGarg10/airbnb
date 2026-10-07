"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

/** Leaflet often mounts before the panel has final dimensions; invalidate after layout. */
export function MapResize() {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize({ animate: false });
    fix();
    const t1 = window.setTimeout(fix, 0);
    const t2 = window.setTimeout(fix, 150);
    const t3 = window.setTimeout(fix, 400);
    window.addEventListener("resize", fix);
    const container = map.getContainer();
    const observer = new ResizeObserver(() => fix());
    observer.observe(container);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.removeEventListener("resize", fix);
      observer.disconnect();
    };
  }, [map]);
  return null;
}
