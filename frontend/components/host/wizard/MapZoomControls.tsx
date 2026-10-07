"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Minus, Plus } from "lucide-react";
import { useMap } from "react-leaflet";

export function MapZoomControls() {
  const map = useMap();
  const pan = (lat: number, lng: number) => {
    const center = map.getCenter();
    map.panTo([center.lat + lat, center.lng + lng], { animate: true });
  };

  return (
    <div className="absolute bottom-6 left-4 z-[600] flex flex-col overflow-hidden rounded-xl border border-hairline bg-white shadow-md">
      <button
        type="button"
        aria-label="Zoom in"
        className="flex h-10 w-10 items-center justify-center border-b border-hairline hover:bg-soft"
        onClick={() => map.zoomIn()}
      >
        <Plus size={18} />
      </button>
      <button
        type="button"
        aria-label="Zoom out"
        className="flex h-10 w-10 items-center justify-center border-b border-hairline hover:bg-soft"
        onClick={() => map.zoomOut()}
      >
        <Minus size={18} />
      </button>
      <button type="button" aria-label="Pan up" className="flex h-9 w-10 items-center justify-center hover:bg-soft" onClick={() => pan(0.002, 0)}>
        <ChevronUp size={18} />
      </button>
      <div className="flex border-y border-hairline">
        <button type="button" aria-label="Pan left" className="flex h-9 w-10 items-center justify-center hover:bg-soft" onClick={() => pan(0, -0.002)}>
          <ChevronLeft size={18} />
        </button>
        <button type="button" aria-label="Pan right" className="flex h-9 w-10 items-center justify-center hover:bg-soft" onClick={() => pan(0, 0.002)}>
          <ChevronRight size={18} />
        </button>
      </div>
      <button type="button" aria-label="Pan down" className="flex h-9 w-10 items-center justify-center hover:bg-soft" onClick={() => pan(-0.002, 0)}>
        <ChevronDown size={18} />
      </button>
    </div>
  );
}
