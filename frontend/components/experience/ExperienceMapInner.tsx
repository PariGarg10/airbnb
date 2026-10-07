"use client";

import L from "leaflet";
import { AttributionControl, MapContainer, Marker, TileLayer } from "react-leaflet";
import { MapZoomControls } from "@/components/host/wizard/MapZoomControls";
import { MapClientGate } from "@/components/map/MapClientGate";
import { MapResize } from "@/components/map/MapResize";
import { TILE_LAYER } from "@/lib/map";
import "leaflet/dist/leaflet.css";

const meetingMarker = L.divIcon({
  className: "border-0 bg-transparent",
  html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-8px)"><div style="width:32px;height:32px;border-radius:999px;background:#222;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.25)"><div style="width:8px;height:8px;border-radius:999px;background:#fff"></div></div><div style="margin-top:4px;background:#fff;padding:4px 8px;border-radius:8px;font-size:12px;font-weight:600;color:#222;box-shadow:0 1px 4px rgba(0,0,0,.15)">Meeting point</div></div>`,
  iconSize: [120, 64],
  iconAnchor: [60, 32],
});

export default function ExperienceMapInner({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  return (
    <MapClientGate className="h-full w-full">
      <MapContainer center={[lat, lng]} zoom={14} scrollWheelZoom attributionControl={false} className="h-full w-full">
        <TileLayer {...TILE_LAYER} />
        <AttributionControl prefix={false} position="bottomright" />
        <Marker position={[lat, lng]} icon={meetingMarker} title={label} />
        <MapZoomControls />
        <MapResize />
      </MapContainer>
    </MapClientGate>
  );
}
