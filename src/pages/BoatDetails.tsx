import { useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Users, Ship } from "lucide-react";
import heroImage from "@/assets/hero-yacht.jpg";
import { getBoatById } from "@/stores/slices/basicSlice";
import { mockBoats } from "@/data/mockBoats";

interface Boat {
  _id?: string;
  id?: string | number;
  name?: string;
  title?: string;
  description?: string;
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

const BoatDetails = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["boat", id],
    queryFn: () => (id ? getBoatById(id) : Promise.resolve(undefined as any)),
    enabled: !!id,
  });

  const apiBoat = (data as any)?.data || (Array.isArray(data) ? data?.[0] : data);

  const boat: Boat | undefined = useMemo(() => {
    if (!id) return undefined;
    const idOf = (o: any) => o?._id ?? o?.id;
    const byApi = apiBoat as any;
    if (byApi && idOf(byApi)) return byApi as Boat;
    return mockBoats.find((b: any) => String(idOf(b)) === String(id)) as unknown as Boat | undefined;
  }, [apiBoat, id]);

  const getImg = (b?: Boat) => b?.imageUrl || b?.image || b?.photos?.[0] || heroImage;
  const getName = (b?: Boat) => b?.name || b?.title || "Embarcación";
  const getLocation = (b?: Boat) => b?.location || [b?.city, b?.country].filter(Boolean).join(", ") || "-";

  useEffect(() => {
    const name = getName(boat);
    document.title = `${name} | Detalles del barco | boatbnb`;
    const desc = `${name} en ${getLocation(boat)}: detalles, capacidad y precio. Reserva en boatbnb.`;

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
    canonical.setAttribute('href', window.location.href);

    // Structured data
    const ld: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: name,
      image: [getImg(boat)],
      description: desc,
      aggregateRating: boat?.rating ? {
        '@type': 'AggregateRating',
        ratingValue: boat.rating,
        reviewCount: 1
      } : undefined,
      offers: boat?.price ? {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: boat.price,
        availability: 'https://schema.org/InStock'
      } : undefined
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(ld);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [boat]);

  return (
    <div className="relative min-h-screen isolate">
      {/* Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none select-none"
        style={{
          backgroundImage: `url(${getImg(boat)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-hero opacity-70 pointer-events-none"></div>
        <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>
      </div>

      <div className="relative z-50 pointer-events-auto">
        <Header />
      </div>

      <main className="relative z-10 pt-24 pb-16">
        <header className="max-w-7xl mx-auto px-4 mb-6">
          <nav className="text-white/80 text-sm mb-2">
            <Link to="/buscar-barcos" className="hover:underline">← Volver a la búsqueda</Link>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-white">{getName(boat)}</h1>
          <p className="text-white/80 mt-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" /> {getLocation(boat)}
          </p>
        </header>

        <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <article className="lg:col-span-2">
            <Card variant="floating" className="overflow-hidden">
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={getImg(boat)}
                  alt={`${getName(boat)} en ${getLocation(boat)} - foto principal`}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              </div>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>{boat?.description || "Explora los detalles de esta embarcación. Ideal para salidas con amigos o familia."}</p>
              </CardContent>
            </Card>
          </article>

          <aside>
            <Card variant="floating">
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Capacidad</span>
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {boat?.capacity ?? '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Valoración</span>
                  <span className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500" /> {boat?.rating ? boat.rating.toFixed(1) : 'N/D'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="flex items-center gap-1"><Ship className="h-4 w-4" /> {boat?.type || '—'}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-base">
                    <span className="text-muted-foreground">Desde</span>{' '}
                    <span className="font-semibold">{boat?.price ? `$${boat.price}` : 'Consultar'}</span>{' '}
                    <span className="text-muted-foreground">/ día</span>
                  </div>
                  <div className="mt-3">
                    <Button variant="ocean" size="lg">Solicitar reserva</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </section>

        {isLoading && (
          <p className="max-w-7xl mx-auto px-4 mt-4 text-white/90">Cargando detalles…</p>
        )}
        {!isLoading && !boat && (
          <p className="max-w-7xl mx-auto px-4 mt-4 text-red-100">No se encontró el barco solicitado.</p>
        )}
        {isError && (
          <p className="max-w-7xl mx-auto px-4 mt-2 text-yellow-100">No se pudo conectar con la API. Mostrando datos de demostración si están disponibles.</p>
        )}
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default BoatDetails;
