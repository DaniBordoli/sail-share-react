import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/api';

// Fix default marker icon paths for Leaflet when bundling
// @ts-ignore
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export type Coords = { lat: number; lng: number };

type Props = {
  value: Coords | null;
  onChange: (c: Coords) => void;
  onAddressChange?: (formatted: string) => void;
  className?: string;
  height?: number;
  // If true, attempt reverse geocoding against backend proxy on drag end
  geocodeOnDragEnd?: boolean;
};

export default function MyBoatMapPicker({ value, onChange, onAddressChange, className, height = 320, geocodeOnDragEnd = true }: Props) {
  const defaultCenter: Coords = useMemo(() => value || { lat: 40.4168, lng: -3.7038 }, [value]); // Madrid por defecto
  const [marker, setMarker] = useState<Coords | null>(value);
  const [busy, setBusy] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    setMarker(value);
  }, [value]);

  const position: LatLngExpression = marker ? [marker.lat, marker.lng] : [defaultCenter.lat, defaultCenter.lng];

  const tryReverseGeocode = async (c: Coords) => {
    if (!geocodeOnDragEnd || !onAddressChange) return;
    try {
      setBusy(true);
      const params = new URLSearchParams({ lat: String(c.lat), lon: String(c.lng) });
      const resp = await fetch(`${API_BASE_URL}/api/geoapify/reverse?${params.toString()}`);
      if (resp.ok) {
        const data = await resp.json();
        const formatted = data?.formatted || data?.result?.formatted || '';
        if (formatted) onAddressChange(formatted);
      }
    } catch (_) {
      // Silencio: backend proxy puede no estar aún. No interrumpir UX.
    } finally {
      setBusy(false);
    }
  };

  const MapClicker = () => {
    useMapEvents({
      click(e) {
        const c = { lat: e.latlng.lat, lng: e.latlng.lng };
        setMarker(c);
        onChange(c);
        // También obtener dirección cuando el usuario mueve el pin haciendo click en el mapa
        tryReverseGeocode(c);
      },
    });
    return null;
  };

  const onDragEnd = async (e: any) => {
    const m = e.target as L.Marker;
    const ll = m.getLatLng();
    const c = { lat: ll.lat, lng: ll.lng };
    setMarker(c);
    onChange(c);
    await tryReverseGeocode(c);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setMarker(c);
      onChange(c);
      const map = mapRef.current;
      if (map) map.setView([c.lat, c.lng], 13);
      tryReverseGeocode(c);
    });
  };

  return (
    <div className={`relative map-picker ${className || ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-muted-foreground">Arrastra el marcador o haz clic en el mapa para ajustar la ubicación.</div>
        <Button variant="outline" size="sm" onClick={useMyLocation}>Usar mi ubicación</Button>
      </div>
      <div style={{ height }} className="rounded overflow-hidden border">
        {(() => {
          // Loosen types like ResultsMapAside to avoid TS generic prop noise
          const AnyMap = MapContainer as any;
          const AnyTile = TileLayer as any;
          const AnyMarker = Marker as any;
          return (
            <AnyMap
              center={[defaultCenter.lat, defaultCenter.lng]}
              zoom={marker ? 13 : 5}
              className="w-full h-full"
              scrollWheelZoom
              style={{ height: '100%', width: '100%' }}
              whenCreated={(map: L.Map) => { mapRef.current = map; }}
            >
              <AnyTile
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClicker />
              {position && (
                <AnyMarker position={position} draggable eventHandlers={{ dragend: onDragEnd }} />
              )}
            </AnyMap>
          );
        })()}
      </div>
      {busy && (
        <div className="text-xs text-muted-foreground mt-1">Obteniendo dirección…</div>
      )}
    </div>
  );
}
