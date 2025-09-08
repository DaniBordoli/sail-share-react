import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Anchor, MapPin, Heart } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBoats } from "@/stores/slices/basicSlice";
import { Link } from "react-router-dom";

import boat1 from "@/assets/boats/boat-1.jpg";
import boat2 from "@/assets/boats/boat-2.jpg";
import boat3 from "@/assets/boats/boat-3.jpg";
import boat4 from "@/assets/boats/boat-4.jpg";

interface BoatLike {
  _id?: string;
  id?: string | number;
  name?: string;
  title?: string;
  // Puede ser string o GeoJSON/objeto con campos formateados
  location?: any;
  addressFormatted?: string;
  city?: string;
  country?: string;
  price?: number;
  rating?: number;
  reviews?: number;
  capacity?: number;
  length?: string | number;
  type?: string;
  boatType?: string;
  image?: string;
  imageUrl?: string;
  photos?: string[];
}

// Datos dummy actuales (fallback visual)
const featuredBoats: Array<Required<Pick<BoatLike,
  'id' | 'name' | 'price' | 'rating' | 'capacity' | 'length' | 'type'
>> & { image: string; location: string; reviews: number; features: string[]; isNew?: boolean; discount?: number }> = [
  {
    id: 1,
    name: "Princess V65",
    location: "Ibiza, España",
    price: 2400,
    rating: 4.9,
    reviews: 127,
    capacity: 12,
    length: "20m",
    type: "Yate de lujo",
    image: boat1,
    features: ["Capitán incluido", "Aire acondicionado", "Wifi", "Cocina completa"],
    isNew: true
  },
  {
    id: 2,
    name: "Oceanis 46.1",
    location: "Palma de Mallorca",
    price: 450,
    rating: 4.8,
    reviews: 89,
    capacity: 8,
    length: "14.6m",
    type: "Velero",
    image: boat2,
    features: ["Sin licencia", "Velas nuevas", "GPS", "Nevera"],
    discount: 15
  },
  {
    id: 3,
    name: "Azimut 55",
    location: "Costa Brava",
    price: 1800,
    rating: 4.9,
    reviews: 203,
    capacity: 10,
    length: "17m",
    type: "Yate deportivo",
    image: boat3,
    features: ["Jet ski incluido", "Patrón profesional", "Bar", "Solarium"]
  },
  {
    id: 4,
    name: "Lagoon 450",
    location: "Canarias",
    price: 890,
    rating: 4.7,
    reviews: 156,
    capacity: 12,
    length: "13.96m",
    type: "Catamarán",
    image: boat4,
    features: ["Estable", "Amplios espacios", "Ducha exterior", "Snorkel"]
  }
];

export const FeaturedBoats = () => {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Traer barcos reales; si falla, usamos dummy
  const { data } = useQuery({
    queryKey: ["featured-boats"],
    queryFn: async () => getBoats(),
  });

  const realBoats: BoatLike[] = useMemo(() => {
    // API puede devolver { success, data } o array directo (mock/local)
    return (data?.data as any) || (Array.isArray(data) ? data : []) || [];
  }, [data]);

  const effectiveBoats: BoatLike[] = realBoats.length ? realBoats : featuredBoats as any;

  const getId = (b: BoatLike) => String(b._id || b.id || Math.random().toString());
  const getName = (b: BoatLike) => b.name || b.title || "Embarcación";
  const getImg = (b: BoatLike) => (b as any).imageUrl || (b as any).image || (b as any).photos?.[0] || boat1;
  const getType = (b: BoatLike) => (b as any).type || (b as any).boatType || 'Barco';
  const getLocation = (b: BoatLike) => {
    const loc: any = (b as any).location;
    if (typeof (b as any).location === 'string') return (b as any).location;
    if (typeof (b as any).addressFormatted === 'string' && (b as any).addressFormatted.trim()) return (b as any).addressFormatted;
    if (loc && typeof loc === 'object') {
      if (typeof loc.addressFormatted === 'string' && loc.addressFormatted.trim()) return loc.addressFormatted;
      if (typeof loc.formatted === 'string' && loc.formatted.trim()) return loc.formatted;
      if (Array.isArray(loc.coordinates)) return `${loc.coordinates[1]?.toFixed(2)}, ${loc.coordinates[0]?.toFixed(2)}`;
      if (loc.lat && loc.lng) return `${loc.lat.toFixed(2)}, ${loc.lng.toFixed(2)}`;
    }
    const cc = [b.city, b.country].filter(Boolean).join(', ');
    return cc || 'Ubicación';
  };

  const toggleFavorite = (boatId: string) => {
    setFavorites(prev => 
      prev.includes(boatId) 
        ? prev.filter(id => id !== boatId)
        : [...prev, boatId]
    );
  };

  return (
    <section className="py-20 bg-gradient-sky">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <Anchor size={24} />
            <span className="text-sm font-semibold uppercase tracking-wider">Destacados</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Embarcaciones Populares
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Descubre nuestra selección de barcos más reservados y mejor valorados por nuestros clientes
          </p>
        </div>

        {/* Boats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {effectiveBoats.slice(0, 8).map((boat) => {
            const id = getId(boat);
            const name = getName(boat);
            const img = getImg(boat);
            const type = getType(boat);
            const loc = getLocation(boat);
            const price = (boat as any).price as number | undefined;
            const rating = (boat as any).rating as number | undefined;
            const capacity = (boat as any).capacity as number | undefined;
            const length = (boat as any).length as string | number | undefined;
            return (
              <Card key={id} variant="ocean" className="group overflow-hidden">
                {/* Image Container */}
                <div className="relative overflow-hidden">
                  <Link to={`/barcos/${id}`}>
                    <img
                      src={img}
                      alt={`${name} en ${loc}`}
                      className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  </Link>

                  {/* Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {(boat as any).isNew && (
                      <Badge variant="default" className="bg-success text-success-foreground">
                        Nuevo
                      </Badge>
                    )}
                    {(boat as any).discount && (
                      <Badge variant="destructive">
                        -{(boat as any).discount}%
                      </Badge>
                    )}
                  </div>

                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300"
                  >
                    <Heart 
                      size={20} 
                      className={`transition-colors duration-300 ${
                        favorites.includes(id) ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                  </button>

                  {/* Rating */}
                  {typeof rating === 'number' && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                      <Star size={16} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-white text-sm font-medium">{rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <CardHeader className="pb-3 text-center">
                  <div className="flex flex-col items-center gap-1 min-w-0">
                    <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors truncate" title={String(name)}>
                      {name}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs w-fit">
                      {type}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1 w-full">
                      <MapPin size={14} className="shrink-0" />
                      <span className="truncate min-w-0" title={String(loc)}>{loc}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Boat Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>{capacity ?? '-'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Anchor size={14} />
                      <span>{length ?? '-'}</span>
                    </div>
                  </div>

                  {/* Price and CTA */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {price ? `$${Number(price).toLocaleString()}` : 'Consultar'}
                      </div>
                      <div className="text-xs text-muted-foreground">{((boat as any).priceUnit === 'week') ? 'por semana' : 'por día'}</div>
                    </div>
                    <Button variant="ocean" size="sm" className="shrink-0" asChild>
                      <Link to={`/barcos/${id}`}>Ver Detalles</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="hover:bg-primary hover:text-primary-foreground" asChild>
            <Link to="/explorar-barcos">Ver Todas las Embarcaciones</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};