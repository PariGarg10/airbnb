"use client";

import L from "leaflet";
import { useEffect } from "react";
import { AttributionControl, MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { MapClientGate } from "@/components/map/MapClientGate";
import { MapResize } from "@/components/map/MapResize";
import { TILE_LAYER } from "@/lib/map";
import { TRIPS_SEED_CITIES } from "@/lib/trips/seedCities";
import type { Booking } from "@/types";
import "leaflet/dist/leaflet.css";

function cityIcon(label: string) {
  return L.divIcon({
    className: "trips-city-marker",
    html: `<span class="trips-city-marker__box"></span><span class="trips-city-marker__label">${label}</span>`,
    iconSize: [1, 1],
    iconAnchor: [0, 0],
  });
}

function tripIcon(active: boolean) {
  return L.divIcon({
    className: "trips-trip-marker",
    html: `<span class="trips-trip-marker__dot ${active ? "is-active" : ""}"></span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

function Fit({ trips, empty }: { trips: Booking[]; empty: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (empty) {
      map.setView([20, 0], 2);
      return;
    }
    const points = trips.map((t) => [t.listing.lat, t.listing.lng] as [number, number]);
    if (points.length === 1) {
      map.setView(points[0], 10);
      return;
    }
    map.fitBounds(points, { padding: [48, 48] });
  }, [empty, map, trips]);
  return null;
}

export function TripsMap({
  trips,
  empty,
  highlightId,
  onHover,
}: {
  trips: Booking[];
  empty: boolean;
  highlightId: number | null;
  onHover: (id: number | null) => void;
}) {
  return (
    <div className="h-full min-h-[400px] w-full overflow-hidden rounded-2xl bg-soft">
      <MapClientGate className="h-full w-full">
        <MapContainer center={[20, 0]} zoom={2} zoomControl attributionControl={false} className="h-full w-full" scrollWheelZoom>
          <TileLayer {...TILE_LAYER} />
          <AttributionControl prefix={false} position="bottomright" />
          <MapResize />
          <Fit trips={trips} empty={empty} />
          {empty
            ? TRIPS_SEED_CITIES.map((city) => (
                <Marker key={city.name} position={[city.lat, city.lng]} icon={cityIcon(city.name)} />
              ))
            : trips.map((trip) => (
                <Marker
                  key={trip.id}
                  position={[trip.listing.lat, trip.listing.lng]}
                  icon={tripIcon(highlightId === trip.id)}
                  eventHandlers={{
                    mouseover: () => onHover(trip.id),
                    mouseout: () => onHover(null),
                  }}
                />
              ))}
        </MapContainer>
      </MapClientGate>
    </div>
  );
}
