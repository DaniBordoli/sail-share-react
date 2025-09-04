import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getBoatsByOwner } from "@/stores/slices/basicSlice";

interface BoatItem {
  _id?: string;
  id?: string | number;
  name?: string;
  title?: string;
  imageUrl?: string;
  image?: string;
  photos?: string[];
  city?: string;
  country?: string;
  price?: number;
  ownerId?: string;
  ownerName?: string;
  ownerAvatar?: string;
}

export default function OwnerProfile() {
  const { ownerId } = useParams<{ ownerId: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["boats-by-owner", ownerId],
    queryFn: () => (ownerId ? getBoatsByOwner(ownerId, { limit: 24 }) : Promise.resolve({ data: [] })),
    enabled: !!ownerId,
  });

  const items: BoatItem[] = useMemo(() => (data as any)?.data || [], [data]);
  const ownerName = useMemo(() => items[0]?.ownerName || "Propietario", [items]);
  const ownerAvatar = useMemo(() => items[0]?.ownerAvatar, [items]);

  const getId = (b: BoatItem) => String(b._id || b.id);
  const getImg = (b: BoatItem) => b.imageUrl || b.image || b.photos?.[0];
  const getName = (b: BoatItem) => b.name || b.title || "Embarcación";
  const getLoc = (b: BoatItem) => [b.city, b.country].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      <Header />
      {/* Hero con gradiente (mismo estilo que AdminPanel) */}
      <div className="pt-20 pb-8 bg-gradient-ocean">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {ownerAvatar ? (
              <img src={ownerAvatar} alt={ownerName} className="h-14 w-14 rounded-full object-cover ring-2 ring-white/60" />
            ) : (
              <div className="h-14 w-14 rounded-full bg-white/30" />)
            }
            <div>
              <h1 className="text-3xl font-bold text-white">{ownerName}</h1>
              <p className="text-white/90 text-sm">Otras publicaciones del propietario</p>
            </div>
          </div>
        </div>
      </div>
      <main className="pt-6 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Cabecera propietario (secundaria) */}
          <section>
            <div className="flex items-center gap-4">
              {ownerAvatar ? (
                <img src={ownerAvatar} alt={ownerName} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted" />
              )}
              <div>
                <h2 className="text-xl font-semibold">{ownerName}</h2>
                <p className="text-muted-foreground">Publicaciones</p>
              </div>
            </div>
          </section>

          {/* Grid de publicaciones */}
          <section>
            {isLoading ? (
              <div className="text-muted-foreground">Cargando publicaciones…</div>
            ) : isError ? (
              <div className="text-destructive">No se pudieron cargar las publicaciones.</div>
            ) : items.length === 0 ? (
              <div className="text-muted-foreground">Este propietario aún no tiene publicaciones visibles.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((b) => (
                  <Card key={getId(b)} variant="floating" className="overflow-hidden group">
                    <div className="aspect-video w-full overflow-hidden">
                      <Link to={`/barcos/${getId(b)}`}>
                        {getImg(b) ? (
                          <img src={getImg(b)} alt={getName(b)} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
                        ) : (
                          <div className="w-full h-full bg-muted" />
                        )}
                      </Link>
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{getName(b)}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <div className="line-clamp-1">{getLoc(b)}</div>
                    </CardContent>
                    <CardFooter>
                      <Button asChild variant="ocean" size="sm">
                        <Link to={`/barcos/${getId(b)}`}>Ver detalles</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
