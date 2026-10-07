"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { MapZoomControls } from "@/components/host/wizard/MapZoomControls";
import "leaflet/dist/leaflet.css";

function SyncCenter({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  const map = useMap();
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  useEffect(() => {
    const apply = () => {
      const center = map.getCenter();
      onMoveRef.current(center.lat, center.lng);
    };
    map.on("moveend", apply);
    apply();
    return () => {
      map.off("moveend", apply);
    };
  }, [map]);

  return null;
}

function DisableInteraction() {
  const map = useMap();
  useEffect(() => {
    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
  }, [map]);
  return null;
}

export default function LocationMap({
  lat,
  lng,
  onMove,
  interactive = true,
  className = "",
}: {
  lat: number;
  lng: number;
  onMove?: (lat: number, lng: number) => void;
  interactive?: boolean;
  className?: string;
}) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={interactive}
      dragging={interactive}
      className={`h-[360px] w-full min-[1128px]:h-[480px] ${className}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {interactive && onMove ? <SyncCenter onMove={onMove} /> : null}
      {!interactive ? <DisableInteraction /> : null}
      {interactive ? <MapZoomControls /> : null}
    </MapContainer>
  );
}
