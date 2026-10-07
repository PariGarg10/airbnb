"use client";

import L from "leaflet";
import { AttributionControl, Circle, MapContainer, Marker, TileLayer } from "react-leaflet";
import { MapClientGate } from "@/components/map/MapClientGate";
import { MapResize } from "@/components/map/MapResize";
import { TILE_LAYER } from "@/lib/map";
import "leaflet/dist/leaflet.css";

const listingMarker = L.divIcon({
  className: "border-0 bg-transparent",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  html: `<div style="width:40px;height:40px;border-radius:999px;background:#222222;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.25)"><svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true"><path d="M12 3 3 11h2v9h6v-6h2v6h6v-9h2L12 3z"/></svg></div>`,
});

export default function ListingMap({
  lat,
  lng,
  approximate = false,
}: {
  lat: number;
  lng: number;
  approximate?: boolean;
}) {
  return (
    <MapClientGate className="h-full w-full">
      <MapContainer center={[lat, lng]} zoom={13} scrollWheelZoom attributionControl={false} className="h-full w-full">
        <TileLayer {...TILE_LAYER} />
        <AttributionControl prefix={false} position="bottomright" />
        {approximate ? (
          <Circle
            center={[lat, lng]}
            radius={500}
            pathOptions={{ color: "#717171", fillColor: "#717171", fillOpacity: 0.18, weight: 1 }}
          />
        ) : (
          <Marker position={[lat, lng]} icon={listingMarker} />
        )}
        <MapResize />
      </MapContainer>
    </MapClientGate>
  );
}
