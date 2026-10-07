"use client";

import L from "leaflet";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { AttributionControl, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { MapClientGate } from "@/components/map/MapClientGate";
import { MapResize } from "@/components/map/MapResize";
import { listingPhotoUrl } from "@/lib/listingPhotoUrl";
import { TILE_LAYER } from "@/lib/map";
import { useAuth } from "@/lib/auth";
import { formatInr, formatRating, formatResultsStayRange, propertyLabel } from "@/lib/format";
import { useWishlist } from "@/hooks/useWishlist";
import type { SearchFilters } from "@/hooks/useSearchFilters";
import type { ListingCard as ListingCardData } from "@/types";
import "leaflet/dist/leaflet.css";

interface ListingsMapProps {
  listings: ListingCardData[];
  filters: SearchFilters;
  boundsKey: string;
  hoveredId: number | null;
  selectedId: number | null;
  expanded: boolean;
  onHover: (id: number | null) => void;
  onSelect: (id: number | null) => void;
  onExpand: () => void;
  onNeedAuth: () => void;
}

function placeName(listing: ListingCardData) {
  if (listing.room_type === "private_room") return `Room in ${listing.city}`;
  if (listing.room_type === "shared_room") return `Shared room in ${listing.city}`;
  if (listing.property_type === "apartment") return `Flat in ${listing.city}`;
  if (listing.property_type === "house") return `Home in ${listing.city}`;
  return `${propertyLabel(listing.property_type)} in ${listing.city}`;
}

function pinPrice(listing: ListingCardData) {
  return formatInr(listing.stay_total != null ? listing.stay_total : listing.price_per_night);
}

function priceIcon(listing: ListingCardData, active: boolean) {
  const heart = listing.is_wishlisted
    ? `<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" style="margin-left:4px;flex:none"><path fill="#FF385C" d="M12 21s-6.7-4.35-9.33-8.2C.8 10.2 1.5 6.4 4.7 5c2-.9 4.1-.3 5.5 1.3L12 8.2l1.8-2C15.2 4.7 17.3 4.1 19.3 5c3.2 1.4 3.9 5.2 2 7.8C18.7 16.65 12 21 12 21z"/></svg>`
    : "";
  const colors = active
    ? "background:#222222;color:#ffffff;border:1px solid #222222;"
    : "background:#ffffff;color:#222222;border:1px solid #222222;";
  return L.divIcon({
    className: "price-pin-icon",
    html: `<span class="t-price-pin price-pin" style="${colors}display:inline-flex;align-items:center;border-radius:999px;padding:4px 10px;box-shadow:var(--shadow-tertiary);white-space:nowrap;">${pinPrice(listing)}${heart}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function FitBounds({ listings, boundsKey }: { listings: ListingCardData[]; boundsKey: string }) {
  const map = useMap();
  const listingsRef = useRef(listings);
  listingsRef.current = listings;
  useEffect(() => {
    const current = listingsRef.current;
    if (!boundsKey || current.length === 0) return;
    const points = current
      .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
      .map((item) => [item.lat, item.lng] as [number, number]);
    if (points.length === 0) return;
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 13 });
  }, [boundsKey, map]);
  return null;
}

function MapClick({ onClear }: { onClear: () => void }) {
  useMapEvents({ click: () => onClear() });
  return null;
}

function MapChrome({ expanded, onExpand }: { expanded: boolean; onExpand: () => void }) {
  const map = useMap();
  const container = map.getContainer();
  return createPortal(
    <div className="pointer-events-none absolute right-3 top-3 z-[500] flex flex-col items-end gap-2">
      <button
        type="button"
        aria-label={expanded ? "Show list and map" : "Expand map"}
        onClick={onExpand}
        className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-[var(--r-ctrl)] bg-white text-ink shadow-tertiary"
      >
        {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
      <div className="pointer-events-auto flex flex-col overflow-hidden rounded-[var(--r-ctrl)] bg-white shadow-tertiary">
        <button type="button" aria-label="Zoom in" onClick={() => map.zoomIn()} className="flex h-8 w-8 items-center justify-center border-b border-hairline text-ink">
          <Plus size={16} />
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => map.zoomOut()} className="flex h-8 w-8 items-center justify-center text-ink">
          <Minus size={16} />
        </button>
      </div>
    </div>,
    container,
  );
}

function hrefFor(id: number, filters: SearchFilters) {
  const params = new URLSearchParams();
  if (filters.check_in) params.set("check_in", filters.check_in);
  if (filters.check_out) params.set("check_out", filters.check_out);
  if (filters.guests) params.set("guests", String(filters.guests));
  const query = params.toString();
  return `/listings/${id}${query ? `?${query}` : ""}`;
}

function PinCard({
  listing,
  filters,
  onClose,
  onNeedAuth,
}: {
  listing: ListingCardData;
  filters: SearchFilters;
  onClose: () => void;
  onNeedAuth: () => void;
}) {
  const map = useMap();
  const { user } = useAuth();
  const { onHeart } = useWishlist();
  const [index, setIndex] = useState(0);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const images = listing.images.length > 0 ? listing.images : [];
  const photo = images[index];
  const nights = listing.stay_total != null ? (listing.nights ?? 1) : 1;
  const amount = listing.stay_total != null ? listing.stay_total : listing.price_per_night;
  const original =
    listing.stay_original_total != null && listing.stay_total != null && listing.stay_original_total > listing.stay_total
      ? listing.stay_original_total
      : null;
  const href = hrefFor(listing.id, filters);

  useEffect(() => {
    const update = () => {
      const next = map.latLngToContainerPoint([listing.lat, listing.lng]);
      setPoint({ x: next.x, y: next.y });
    };
    update();
    map.on("move zoom resize", update);
    return () => {
      map.off("move zoom resize", update);
    };
  }, [listing.lat, listing.lng, map]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!point) return null;

  const save = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      onNeedAuth();
      return;
    }
    onHeart({ id: listing.id, is_wishlisted: listing.is_wishlisted, image: photo });
  };

  return createPortal(
    <div
      className="absolute z-[600] w-[327px] max-w-[calc(100%-24px)]"
      style={{
        left: point.x,
        top: point.y,
        transform: point.y > 300 ? "translate(-50%, calc(-100% - 16px))" : "translate(-50%, 16px)",
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="dropdown-pop overflow-hidden rounded-[var(--card-radius)] bg-white shadow-popover">
        <div className="relative aspect-[20/19] bg-[var(--image-placeholder)]">
          {photo ? (
            <Image src={listingPhotoUrl(photo)} alt="" fill className="object-cover" sizes="327px" loading="lazy" />
          ) : null}
          <a href={href} target="_blank" rel="noreferrer" className="absolute inset-0" aria-label={listing.title} />
          {images.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() => setIndex((current) => Math.max(0, current - 1))}
                className="absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-tertiary"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={() => setIndex((current) => Math.min(images.length - 1, current + 1))}
                className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-tertiary"
              >
                <ChevronRight size={16} />
              </button>
              <div className="pointer-events-none absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1">
                {images.map((image, dot) => (
                  <span key={`${listing.id}-${dot}`} className={`h-1.5 w-1.5 rounded-full ${dot === index ? "bg-white" : "bg-white/60"}`} />
                ))}
              </div>
            </>
          ) : null}
          <div className="absolute right-3 top-3 z-10 flex gap-2">
            <button
              type="button"
              aria-label={listing.is_wishlisted ? "Remove from wishlist" : "Save"}
              onClick={save}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-tertiary"
            >
              <Heart size={16} className={listing.is_wishlisted ? "fill-rausch text-white" : "fill-black/50 text-white"} strokeWidth={2} />
            </button>
            <button type="button" aria-label="Close" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-tertiary">
              <X size={16} />
            </button>
          </div>
        </div>
        <a href={href} target="_blank" rel="noreferrer" className="block p-3">
          <div className="flex items-start justify-between gap-3">
            <p className="t-results-title truncate">{placeName(listing)}</p>
            <p className="t-results-rating shrink-0">
              {listing.review_count > 0 ? `★ ${formatRating(listing.avg_rating)} (${listing.review_count})` : "★ New"}
            </p>
          </div>
          <p className="t-results-subtitle truncate">{listing.title}</p>
          {filters.check_in && filters.check_out ? (
            <p className="t-results-subtitle truncate">{formatResultsStayRange(filters.check_in, filters.check_out)}</p>
          ) : null}
          <p className="mt-0.5">
            <span className="t-results-price-line">
              {original ? (
                <span className="t-results-price-strong text-muted line-through">{formatInr(original)} </span>
              ) : null}
              <span className="t-results-price-strong">{formatInr(amount)}</span>{" "}
              <span className="t-results-price-tail">{nights === 1 ? "for 1 night" : `for ${nights} nights`}</span>
            </span>
          </p>
        </a>
      </div>
    </div>,
    map.getContainer(),
  );
}

export default function ListingsMap({
  listings,
  filters,
  boundsKey,
  hoveredId,
  selectedId,
  expanded,
  onHover,
  onSelect,
  onExpand,
  onNeedAuth,
}: ListingsMapProps) {
  const selected = listings.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="search-map h-full min-h-[280px] w-full overflow-hidden">
      <MapClientGate className="search-map h-full min-h-[280px] w-full">
        <MapContainer
          center={[20.6, 78.9]}
          zoom={5}
          zoomControl={false}
          attributionControl={false}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer {...TILE_LAYER} keepBuffer={4} />
          <AttributionControl prefix={false} position="bottomright" />
          <MapResize />
          <FitBounds listings={listings} boundsKey={boundsKey} />
        <MapClick onClear={() => onSelect(null)} />
        <MapChrome expanded={expanded} onExpand={onExpand} />
        {listings.map((listing) => {
          const active = hoveredId === listing.id || selectedId === listing.id;
          return (
            <Marker
              key={`${listing.id}-${active ? 1 : 0}-${listing.is_wishlisted ? 1 : 0}-${pinPrice(listing)}`}
              position={[listing.lat, listing.lng]}
              icon={priceIcon(listing, active)}
              zIndexOffset={active ? 1000 : listing.is_wishlisted ? 100 : 0}
              eventHandlers={{
                click: (event) => {
                  L.DomEvent.stopPropagation(event.originalEvent);
                  onSelect(listing.id);
                },
                mouseover: () => onHover(listing.id),
                mouseout: () => onHover(null),
              }}
            />
          );
        })}
        {selected ? (
          <PinCard listing={selected} filters={filters} onClose={() => onSelect(null)} onNeedAuth={onNeedAuth} />
        ) : null}
        </MapContainer>
      </MapClientGate>
    </div>
  );
}
