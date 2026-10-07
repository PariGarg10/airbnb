"use client";

import { AttributionControl, MapContainer, TileLayer } from "react-leaflet";
import { MapClientGate } from "@/components/map/MapClientGate";
import { MapResize } from "@/components/map/MapResize";
import { TILE_LAYER } from "@/lib/map";
import "leaflet/dist/leaflet.css";

export default function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapClientGate className="host-map h-32 w-full">
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
        keyboard={false}
        attributionControl={false}
        className="h-full w-full"
      >
        <TileLayer {...TILE_LAYER} />
        <AttributionControl prefix={false} position="bottomright" />
        <MapResize />
      </MapContainer>
    </MapClientGate>
  );
}
