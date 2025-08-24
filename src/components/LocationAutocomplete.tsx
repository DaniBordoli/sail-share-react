import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

export type LocationSuggestion = {
  lat: number;
  lon: number;
  formatted: string;
  city?: string;
  country?: string;
  placeId?: string;
};

type Props = {
  value?: string;
  placeholder?: string;
  countryFilter?: string; // e.g. "es" or "ar"
  onSelect: (loc: LocationSuggestion) => void;
  onChangeText?: (text: string) => void;
  label?: string;
};

const PROXY_URL = "/api/geoapify/autocomplete";

export const LocationAutocomplete: React.FC<Props> = ({
  value = "",
  placeholder = "Escribe una dirección, puerto o ciudad",
  countryFilter,
  onSelect,
  onChangeText,
  label,
}) => {
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setText(value), [value]);

  // click outside to close
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const fetchSuggestions = useMemo(() => {
    let timer: number | undefined;
    return (q: string) => {
      if (timer) window.clearTimeout(timer);
      if (!q || !q.trim()) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      timer = window.setTimeout(async () => {
        try {
          setLoading(true);
          setError(null);
          const url = new URL(`${API_BASE_URL}${PROXY_URL}`);
          url.searchParams.set("text", q);
          url.searchParams.set("limit", "8");
          url.searchParams.set("lang", "es");
          if (countryFilter) url.searchParams.set("filter", `countrycode:${countryFilter}`);
          const res = await fetch(url.toString());
          const data = await res.json();
          const items: LocationSuggestion[] = (data?.features || []).map((f: any) => ({
            lat: Number(f?.properties?.lat),
            lon: Number(f?.properties?.lon),
            formatted: String(f?.properties?.formatted || f?.properties?.address_line1 || ""),
            city: f?.properties?.city || f?.properties?.state || undefined,
            country: f?.properties?.country,
            placeId: f?.properties?.place_id,
          }));
          setSuggestions(items);
          setOpen(true);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Error buscando sugerencias");
        } finally {
          setLoading(false);
        }
      }, 300);
    };
  }, [countryFilter]);

  useEffect(() => {
    fetchSuggestions(text);
  }, [text, fetchSuggestions]);

  return (
    <div ref={containerRef} className="relative">
      {label ? (
        <label className="text-sm font-medium text-muted-foreground mb-1 block">{label}</label>
      ) : null}
      <input
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChangeText?.(e.target.value);
        }}
        onFocus={() => text && suggestions.length > 0 && setOpen(true)}
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg max-h-72 overflow-auto">
          {loading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">Buscando…</div>
          )}
          {error && !loading && (
            <div className="px-3 py-2 text-sm text-red-600">{error}</div>
          )}
          {!loading && !error && suggestions.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>
          )}
          {!loading && !error && suggestions.map((sug, idx) => (
            <button
              key={`${sug.placeId || idx}-${sug.lat}-${sug.lon}`}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
              onClick={() => {
                setText(sug.formatted);
                setOpen(false);
                onSelect(sug);
              }}
            >
              <div className="font-medium">{sug.formatted}</div>
              <div className="text-xs text-muted-foreground">{sug.city || ""} {sug.country ? `• ${sug.country}` : ""}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
