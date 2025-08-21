import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getBoats } from "@/stores/slices/basicSlice";
import { MapPin, Star, Users, Ship, Anchor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-yacht.jpg";
import { mockBoats } from "@/data/mockBoats";
import { Link, useSearchParams } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import boatPlaceholder from "@/assets/hero-yacht.jpg";

interface Boat {
  _id?: string;
  id?: string | number;
  name?: string;
  title?: string;
  location?: string;
  city?: string;
  country?: string;
  price?: number;
  rating?: number;
  capacity?: number;
  imageUrl?: string;
  image?: string;
  photos?: string[];
  type?: string;
}

const getCanonicalUrl = () => `${window.location.origin}/buscar-barcos`;

const SearchBoats = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const boatTypeParam = searchParams.get('boatType') || '';
  const guestsParam = searchParams.get('guests') || '';
  const startDateParam = searchParams.get('startDate') || '';
  const endDateParam = searchParams.get('endDate') || '';

  // Filters state
  const [filters, setFilters] = useState({
    boatType: "", // e.g., Lancha, Velero, ...
    priceMin: "",
    priceMax: "",
    rentalType: "", // 'day' | 'week'
    passengers: "",
    yearMin: "",
    yearMax: "",
    brand: "",
    model: "",
    ratingMin: "",
  });

  // UI state
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("");

  useEffect(() => {
    const qParam = searchParams.get('q') || searchParams.get('location') || '';
    if (qParam) setQuery(qParam);
    setFilters((prev) => ({
      ...prev,
      boatType: boatTypeParam || prev.boatType,
      passengers: guestsParam || prev.passengers,
      priceMin: searchParams.get('priceMin') || prev.priceMin,
      priceMax: searchParams.get('priceMax') || prev.priceMax,
      rentalType: searchParams.get('rentalType') || prev.rentalType,
      yearMin: searchParams.get('yearMin') || prev.yearMin,
      yearMax: searchParams.get('yearMax') || prev.yearMax,
      brand: searchParams.get('brand') || prev.brand,
      model: searchParams.get('model') || prev.model,
      ratingMin: searchParams.get('ratingMin') || prev.ratingMin,
    }));
    const sortParam = searchParams.get('sort') || '';
    if (sortParam) setSortBy(sortParam);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync filters + query to URL params in real time
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const setOrDel = (key: string, val?: string) => {
      const v = (val ?? '').toString();
      if (v && v.trim() !== '') next.set(key, v.trim()); else next.delete(key);
    };
    setOrDel('q', query);
    setOrDel('boatType', filters.boatType);
    setOrDel('priceMin', filters.priceMin);
    setOrDel('priceMax', filters.priceMax);
    setOrDel('rentalType', filters.rentalType);
    setOrDel('guests', filters.passengers || guestsParam);
    setOrDel('yearMin', filters.yearMin);
    setOrDel('yearMax', filters.yearMax);
    setOrDel('brand', filters.brand);
    setOrDel('model', filters.model);
    setOrDel('ratingMin', filters.ratingMin);
    setOrDel('sort', sortBy);
    // preserve dates if present
    setOrDel('startDate', startDateParam);
    setOrDel('endDate', endDateParam);
    setSearchParams(next, { replace: true });
  }, [query, filters, sortBy, setSearchParams, guestsParam, startDateParam, endDateParam, searchParams]);

  useEffect(() => {
    // Basic SEO
    document.title = "Buscar Barcos | boatbnb";
    const desc = "Busca y alquila barcos en boatbnb. Filtra por nombre, destino o tipo.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', getCanonicalUrl());
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["boats"],
    queryFn: getBoats,
  });

  const boats: Boat[] = (data?.data as any) || (Array.isArray(data) ? data : []) || [];
  const effectiveBoats: Boat[] = boats && boats.length ? boats : (mockBoats as Boat[]);

  const priceBounds = useMemo(() => {
    const prices = effectiveBoats
      .map(b => Number(b.price))
      .filter(p => !Number.isNaN(p) && p >= 0);
    if (!prices.length) return { min: 0, max: 100000 };
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min, max };
  }, [effectiveBoats]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const byText = (arr: typeof effectiveBoats) => {
      if (!q) return arr;
      return arr.filter((b) => {
        const parts = [b.name, b.title, b.location, b.city, b.country, (b as any).type, (b as any).boatType]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return parts.includes(q);
      });
    };
    const byType = (arr: typeof effectiveBoats) => {
      const t = (boatTypeParam || '').toLowerCase().trim();
      if (!t && !filters.boatType) return arr;
      return arr.filter((b) => {
        const bt = ((b as any).type || (b as any).boatType || '').toLowerCase();
        const filterT = (filters.boatType || '').toLowerCase();
        return (t ? bt.includes(t) : true) && (filterT ? bt.includes(filterT) : true);
      });
    };
    const byPrice = (arr: typeof effectiveBoats) => {
      const min = Number(filters.priceMin);
      const max = Number(filters.priceMax);
      const hasMin = !Number.isNaN(min) && filters.priceMin !== "";
      const hasMax = !Number.isNaN(max) && filters.priceMax !== "";
      if (!hasMin && !hasMax) return arr;
      return arr.filter((b) => {
        const p = Number(b.price);
        if (Number.isNaN(p)) return false;
        if (hasMin && p < min) return false;
        if (hasMax && p > max) return false;
        return true;
      });
    };
    const byRentalType = (arr: typeof effectiveBoats) => {
      const rt = filters.rentalType;
      if (!rt) return arr;
      return arr.filter((b) => {
        const priceUnit = ((b as any).priceUnit || '').toLowerCase();
        const rentalTypes = Array.isArray((b as any).rentalTypes) ? ((b as any).rentalTypes as string[]).map(x=>x.toLowerCase()) : [];
        return priceUnit === rt.toLowerCase() || rentalTypes.includes(rt.toLowerCase());
      });
    };
    const byPassengers = (arr: typeof effectiveBoats) => {
      const n = Number(filters.passengers || guestsParam);
      if (Number.isNaN(n) || (!filters.passengers && !guestsParam)) return arr;
      return arr.filter((b) => Number(b.capacity || (b as any).guests) >= n);
    };
    const byYear = (arr: typeof effectiveBoats) => {
      const ymin = Number(filters.yearMin);
      const ymax = Number(filters.yearMax);
      const hMin = !Number.isNaN(ymin) && filters.yearMin !== "";
      const hMax = !Number.isNaN(ymax) && filters.yearMax !== "";
      if (!hMin && !hMax) return arr;
      return arr.filter((b) => {
        const y = Number((b as any).buildYear);
        if (Number.isNaN(y)) return false;
        if (hMin && y < ymin) return false;
        if (hMax && y > ymax) return false;
        return true;
      });
    };
    const byBrandModel = (arr: typeof effectiveBoats) => {
      const brand = filters.brand.toLowerCase().trim();
      const model = filters.model.toLowerCase().trim();
      if (!brand && !model) return arr;
      return arr.filter((b) => {
        const br = String((b as any).brand || '').toLowerCase();
        const mo = String((b as any).model || '').toLowerCase();
        if (brand && !br.includes(brand)) return false;
        if (model && !mo.includes(model)) return false;
        return true;
      });
    };
    const byRating = (arr: typeof effectiveBoats) => {
      const r = Number(filters.ratingMin);
      if (Number.isNaN(r) || filters.ratingMin === "") return arr;
      return arr.filter((b) => Number(b.rating || 0) >= r);
    };

    return byRating(byBrandModel(byYear(byPassengers(byRentalType(byPrice(byType(byText(effectiveBoats))))))));
  }, [effectiveBoats, query, boatTypeParam, filters, guestsParam]);

  // Sorted results based on sortBy
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const num = (v: any) => {
      const n = Number(v);
      return Number.isNaN(n) ? 0 : n;
    };
    switch (sortBy) {
      case 'relevance':
        // keep current filtered order
        break;
      case 'price_asc':
        arr.sort((a, b) => num(a.price) - num(b.price));
        break;
      case 'price_desc':
        arr.sort((a, b) => num(b.price) - num(a.price));
        break;
      case 'rating_desc':
        arr.sort((a, b) => num(b.rating) - num(a.rating));
        break;
      case 'capacity_desc':
        arr.sort((a, b) => num(b.capacity) - num(a.capacity));
        break;
      case 'year_desc': {
        const by = (x: Boat) => num((x as any).buildYear);
        arr.sort((a, b) => by(b) - by(a));
        break;
      }
      default:
        // relevance (keep current filtered order)
        break;
    }
    return arr;
  }, [filtered, sortBy]);

  // Active filters count (excluding text query)
  const activeFilters = useMemo(() => {
    const entries: Array<[string, string]> = Object.entries(filters) as any;
    const active = entries.filter(([k, v]) => !!String(v || '').trim());
    return active.length;
  }, [filters]);

  

  const getImg = (b: Boat) => b.imageUrl || b.image || b.photos?.[0] || boatPlaceholder;
  const getId = (b: Boat) => (b._id || b.id || Math.random().toString());
  const getName = (b: Boat) => b.name || b.title || "Embarcación";
  const getLocation = (b: Boat) => b.location || [b.city, b.country].filter(Boolean).join(", ") || "-";

  return (
    <div className="relative min-h-screen isolate">
      {/* Background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none select-none"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-gradient-hero opacity-70 pointer-events-none" />
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      </div>

      <div className="relative z-50 pointer-events-auto">
        <Header />
      </div>

      <main className="relative z-10 pt-24 pb-16">
        <header className="max-w-7xl mx-auto px-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Buscar Barcos</h1>
          <p className="text-white/80 mt-2 max-w-2xl">Explora cientos de embarcaciones para alquilar. Filtra por nombre, destino o tipo.</p>

          <section className="mt-6">
            <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-floating p-3 md:p-4 flex items-center gap-3">
              <Ship className="text-primary" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, destino o tipo"
                aria-label="Barra de búsqueda de barcos"
                className="bg-background"
              />
              {query && (
                <Button variant="ghost" onClick={() => setQuery("")}>Limpiar</Button>
              )}
            </div>

            {/* Filtros colapsables */}
            <Collapsible
              open={filtersOpen || activeFilters > 0}
              onOpenChange={(open)=>{
                setFiltersOpen(open);
                if (!open) {
                  setQuery("");
                  setFilters({
                    boatType: "",
                    priceMin: "",
                    priceMax: "",
                    rentalType: "",
                    passengers: "",
                    yearMin: "",
                    yearMax: "",
                    brand: "",
                    model: "",
                    ratingMin: "",
                  });
                }
              }}
            >
              <div className="flex items-center justify-between mt-6 mb-3">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm">
                    {(filtersOpen || activeFilters > 0) ? 'Ocultar filtros' : 'Mostrar filtros'}
                  </Button>
                </CollapsibleTrigger>
                <div className="text-sm text-white/80">
                  {activeFilters > 0 ? `${activeFilters} filtros activos` : 'Sin filtros activos'}
                </div>
              </div>
              <CollapsibleContent>
                <Card className="mb-6 bg-white/95 backdrop-blur-lg">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Tipo de embarcación</label>
                        <Select value={filters.boatType || 'all'} onValueChange={(v)=>setFilters(f=>({...f, boatType: v === 'all' ? '' : v}))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="Lancha">Lancha</SelectItem>
                            <SelectItem value="Velero">Velero</SelectItem>
                            <SelectItem value="Yate">Yate</SelectItem>
                            <SelectItem value="Catamarán">Catamarán</SelectItem>
                            <SelectItem value="Neumática">Neumática</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 lg:col-span-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-muted-foreground">Precio (rango)</label>
                          <span className="text-xs text-muted-foreground">
                            ${Number(filters.priceMin || priceBounds.min).toLocaleString()} - ${Number(filters.priceMax || priceBounds.max).toLocaleString()}
                          </span>
                        </div>
                        <Slider
                          value={[Number(filters.priceMin || priceBounds.min), Number(filters.priceMax || priceBounds.max)]}
                          min={priceBounds.min}
                          max={priceBounds.max}
                          step={10}
                          onValueChange={(vals)=>{
                            const [min, max] = vals as number[];
                            setFilters(f=>({...f, priceMin: String(min), priceMax: String(max)}));
                          }}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Tipo de rental</label>
                        <Select value={filters.rentalType || 'all'} onValueChange={(v)=>setFilters(f=>({...f, rentalType: v === 'all' ? '' : v}))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Cualquiera" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Cualquiera</SelectItem>
                            <SelectItem value="day">Por día</SelectItem>
                            <SelectItem value="week">Por semana</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Pasajeros</label>
                        <Input type="number" min={1} placeholder="Ej: 6" value={filters.passengers} onChange={(e)=>setFilters(f=>({...f, passengers: e.target.value}))} />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Año mínimo</label>
                        <Input type="number" min={1900} max={new Date().getFullYear()} placeholder="2005" value={filters.yearMin} onChange={(e)=>setFilters(f=>({...f, yearMin: e.target.value}))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Año máximo</label>
                        <Input type="number" min={1900} max={new Date().getFullYear()} placeholder="2024" value={filters.yearMax} onChange={(e)=>setFilters(f=>({...f, yearMax: e.target.value}))} />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Marca</label>
                        <Input placeholder="Ej: Beneteau" value={filters.brand} onChange={(e)=>setFilters(f=>({...f, brand: e.target.value}))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Modelo</label>
                        <Input placeholder="Ej: Oceanis" value={filters.model} onChange={(e)=>setFilters(f=>({...f, model: e.target.value}))} />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Reputación mínima</label>
                        <Select value={filters.ratingMin || 'all'} onValueChange={(v)=>setFilters(f=>({...f, ratingMin: v === 'all' ? '' : v}))}>
                          <SelectTrigger>
                            <SelectValue placeholder=">= 0" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="3">≥ 3.0</SelectItem>
                            <SelectItem value="3.5">≥ 3.5</SelectItem>
                            <SelectItem value="4">≥ 4.0</SelectItem>
                            <SelectItem value="4.5">≥ 4.5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end mt-4">
                      <Button variant="outline" size="sm" onClick={()=>{ setFilters({ boatType:"", priceMin:"", priceMax:"", rentalType:"", passengers:"", yearMin:"", yearMax:"", brand:"", model:"", ratingMin:"" }); }}>Limpiar filtros</Button>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            {isLoading ? (
              <p className="text-white/90">Cargando embarcaciones…</p>
            ) : (
              <>
                {isError && (
                  <p className="mb-3 text-yellow-100">No se pudo conectar con la API. Mostrando barcos de demostración.</p>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <p className="text-white/90">{sorted.length} resultados</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/80">Ordenar por</span>
                    <Select value={sortBy} onValueChange={(v)=>setSortBy(v)}>
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Relevancia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevancia</SelectItem>
                        <SelectItem value="price_asc">Precio: menor a mayor</SelectItem>
                        <SelectItem value="price_desc">Precio: mayor a menor</SelectItem>
                        <SelectItem value="rating_desc">Rating: mayor a menor</SelectItem>
                        <SelectItem value="capacity_desc">Capacidad: mayor a menor</SelectItem>
                        <SelectItem value="year_desc">Año: más nuevo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sorted.map((boat) => (
                    <article key={getId(boat)} className="group">
                      <Card variant="floating" className="overflow-hidden">
                        <div className="aspect-video w-full overflow-hidden">
                          <Link to={`/barcos/${getId(boat)}`}>
                            <img
                              src={getImg(boat)}
                              alt={`${getName(boat)} en ${getLocation(boat)} - alquiler de barcos`}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          </Link>
                        </div>
                        <CardHeader>
                          <CardTitle className="flex items-start justify-between gap-3">
                            <span className="truncate">{getName(boat)}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              {(boat as any).type || (boat as any).boatType ? (
                                <Badge variant="outline" className="text-xs">
                                  {(boat as any).type || (boat as any).boatType}
                                </Badge>
                              ) : null}
                              {boat.rating ? (
                                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Star className="h-4 w-4 text-yellow-500" /> {boat.rating.toFixed(1)}
                                </span>
                              ) : null}
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{getLocation(boat)}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{boat.capacity ?? "-"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Anchor className="h-4 w-4" />
                              <span>{(boat as any).length ?? "-"}</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-sm w-full sm:w-auto">
                            <span className="text-muted-foreground">Desde</span>{" "}
                            <span className="font-semibold">{boat.price ? `$${boat.price}` : "Consultar"}</span>{" "}
                            <span className="text-muted-foreground">{((boat as any).priceUnit === 'week') ? '/ semana' : '/ día'}</span>
                          </div>
                          <Button className="w-full sm:w-auto" variant="ocean" size="sm" asChild>
                            <Link to={`/barcos/${getId(boat)}`}>Ver detalles</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        </header>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default SearchBoats;
