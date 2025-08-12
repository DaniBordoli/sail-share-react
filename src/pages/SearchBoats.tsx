import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getBoats } from "@/stores/slices/basicSlice";
import { MapPin, Star, Users, Ship } from "lucide-react";
import heroImage from "@/assets/hero-yacht.jpg";

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
  const [query, setQuery] = useState("");

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

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return boats;
    return boats.filter((b) => {
      const parts = [b.name, b.title, b.location, b.city, b.country, b.type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return parts.includes(q);
    });
  }, [boats, query]);

  const getImg = (b: Boat) => b.imageUrl || b.image || b.photos?.[0] || "/placeholder.svg";
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
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-hero opacity-70 pointer-events-none"></div>
        <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
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
          </section>
        </header>

        <section className="max-w-7xl mx-auto px-4">
          {isLoading && (
            <p className="text-white/90">Cargando embarcaciones…</p>
          )}
          {isError && (
            <p className="text-red-100">No se pudieron cargar los barcos. Intenta nuevamente.</p>
          )}

          {!isLoading && !isError && (
            <>
              <p className="text-white/90 mb-4">{filtered.length} resultados</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((boat) => (
                  <article key={getId(boat)} className="group">
                    <Card variant="floating" className="overflow-hidden">
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={getImg(boat)}
                          alt={`${getName(boat)} en ${getLocation(boat)} - alquiler de barcos`}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{getName(boat)}</span>
                          {boat.rating ? (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star className="h-4 w-4 text-yellow-500" /> {boat.rating.toFixed(1)}
                            </span>
                          ) : null}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{getLocation(boat)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Users className="h-4 w-4" />
                          <span>Capacidad {boat.capacity ?? "-"}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="justify-between">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Desde</span>{" "}
                          <span className="font-semibold">{boat.price ? `$${boat.price}` : "Consultar"}</span>{" "}
                          <span className="text-muted-foreground">/ día</span>
                        </div>
                        <Button variant="ocean" size="sm">Ver detalles</Button>
                      </CardFooter>
                    </Card>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default SearchBoats;
