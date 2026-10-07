"use client";

import L from "leaflet";
import { useEffect } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const listingMarker = L.divIcon({
  className: "border-0 bg-transparent",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  html: `<div style="width:40px;height:40px;border-radius:999px;background:#222222;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.25)"><svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true"><path d="M12 3 3 11h2v9h6v-6h2v6h6v-9h2L12 3z"/></svg></div>`,
});

function MapResize() {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize();
    fix();
    const id = window.setTimeout(fix, 120);
    window.addEventListener("resize", fix);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", fix);
    };
  }, [map]);
  return null;
}

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
    <MapContainer center={[lat, lng]} zoom={13} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
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
  );
}
