import React, { useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvent } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { Link } from "react-router-dom";

export interface ResultsMapBoat {
  _id?: string;
  id?: string | number;
  name?: string;
  title?: string;
  price?: number;
  photos?: string[];
  imageUrl?: string;
  image?: string;
  city?: string;
  country?: string;
  boatType?: string;
  type?: string;
  rating?: number;
  latitude?: number | string;
  longitude?: number | string;
}

const priceIcon = (price?: number) =>
  L.divIcon({
    className: "price-marker",
    html: `<div style="background:#2563eb;color:white;padding:4px 8px;border-radius:999px;border:2px solid white;box-shadow:0 8px 20px rgba(37,99,235,.35);font-weight:600;font-size:12px;">${
      typeof price === "number" ? `$${price}` : "$?"
    }</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

function MoveEnd({ onMoveEnd }: { onMoveEnd: (bounds: L.LatLngBounds) => void }) {
  useMapEvent("moveend", (e) => {
    onMoveEnd(e.target.getBounds());
  });
  return null;
}

export default function ResultsMapAside({
  boats,
  onAskSearchInArea,
  defaultCenter = { lat: 40.4168, lon: -3.7038 }, // Madrid as default
}: {
  boats: ResultsMapBoat[];
  onAskSearchInArea?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  defaultCenter?: { lat: number; lon: number };
}) {
  // Loosen types locally to avoid noisy react-leaflet TS generics
  const AnyMapContainer = MapContainer as any;
  const AnyTileLayer = TileLayer as any;
  const AnyMarker = Marker as any;
  const AnyPopup = Popup as any;
  const toNum = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const validBoats = useMemo(() => {
    return boats
      .map((b) => ({
        ...b,
        latitude: toNum((b as any).latitude),
        longitude: toNum((b as any).longitude),
      }))
      .filter((b) => typeof (b as any).latitude === "number" && typeof (b as any).longitude === "number") as any[];
  }, [boats]);

  const center = useMemo(() => {
    if (validBoats.length) {
      const b = validBoats[0] as any;
      return { lat: b.latitude as number, lon: b.longitude as number };
    }
    return defaultCenter;
  }, [validBoats, defaultCenter]);

  const [showSearchArea, setShowSearchArea] = useState(false);
  const [lastBounds, setLastBounds] = useState<null | { north: number; south: number; east: number; west: number }>(null);
  const timerRef = useRef<number | null>(null);

  const handleMoveEnd = (bounds: L.LatLngBounds) => {
    // Debounce showing the button and store bounds
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      setLastBounds({ north: ne.lat, east: ne.lng, south: sw.lat, west: sw.lng });
      setShowSearchArea(true);
    }, 150);
  };

  const getImg = (b: ResultsMapBoat) => b.imageUrl || b.image || b.photos?.[0];
  const getName = (b: ResultsMapBoat) => b.name || b.title || "Embarcación";
  const getId = (b: ResultsMapBoat) => (b._id || b.id || Math.random().toString());
  const getType = (b: ResultsMapBoat) => (b.type || (b as any).boatType || "");
  const getLoc = (b: ResultsMapBoat) => [b.city, b.country].filter(Boolean).join(", ");

  return (
    <div className="w-full h-full relative">
      <AnyMapContainer center={[center.lat, center.lon]} zoom={6} className="w-full h-full rounded-lg overflow-hidden">
        <AnyTileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MoveEnd onMoveEnd={handleMoveEnd} />
        <MarkerClusterGroup chunkedLoading>
          {validBoats.map((b) => (
            <AnyMarker
              key={String(getId(b))}
              position={[Number((b as any).latitude), Number((b as any).longitude)]}
              icon={priceIcon(b.price)}
            >
              <AnyPopup maxWidth={320} className="!p-0">
                <div className="p-2 space-y-2">
                  {getImg(b) ? (
                    <img src={getImg(b)} alt={getName(b)} className="w-full h-40 object-cover rounded" />
                  ) : null}
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm truncate mr-2">{getName(b)}</div>
                    <div className="text-sm font-semibold">{typeof b.price === "number" ? `$${b.price}` : "Consultar"}</div>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>{getType(b)}</span>
                    <span>{getLoc(b)}</span>
                  </div>
                  <Link to={`/barcos/${getId(b)}`} className="block w-full text-center text-sm font-medium bg-primary text-primary-foreground rounded px-3 py-2">
                    Ver más
                  </Link>
                </div>
              </AnyPopup>
            </AnyMarker>
          ))}
        </MarkerClusterGroup>
      </AnyMapContainer>

      {showSearchArea && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
          <button
            type="button"
            className="bg-white shadow-lg border px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50"
            onClick={() => {
              setShowSearchArea(false);
              if (onAskSearchInArea && lastBounds) onAskSearchInArea(lastBounds);
            }}
            title="Buscar en esta área (preparado para backend)"
          >
            Buscar en esta área
          </button>
        </div>
      )}
    </div>
  );
}
