import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMyFavorites, toggleFavorite } from "@/stores/slices/basicSlice";
import { Link } from "react-router-dom";
import { Heart, MapPin, Star } from "lucide-react";
import heroImage from "@/assets/hero-yacht.jpg";

const Favorites = () => {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["my-favorites"],
    queryFn: listMyFavorites,
  });

  const items = (data as any)?.items ?? [];

  const getImg = (b: any) => b?.imageUrl || b?.image || b?.photos?.[0] || heroImage;
  const getName = (b: any) => b?.name || b?.title || "Embarcación";
  const getLocation = (b: any) => b?.location?.formatted || b?.city || b?.country || "-";

  const unfavMutation = useMutation({
    mutationFn: async (boatId: string) => toggleFavorite(boatId),
    onMutate: async (boatId: string) => {
      await qc.cancelQueries({ queryKey: ["my-favorites"] });
      const prev = qc.getQueryData(["my-favorites"]);
      qc.setQueryData(["my-favorites"], (old: any) => {
        const list = Array.isArray(old?.items) ? old.items : [];
        return { items: list.filter((b: any) => String(b?._id ?? b?.id) !== String(boatId)) };
      });
      return { prev };
    },
    onError: (_err, _boatId, ctx) => {
      if (ctx?.prev) qc.setQueryData(["my-favorites"], ctx.prev as any);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["my-favorites"] });
    }
  });

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      {/* Hero con gradiente */}
      <div className="pt-20 pb-8 bg-gradient-ocean">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Mis Favoritos</h1>
          <p className="text-white/90 text-sm">Tus barcos guardados para ver más tarde.</p>
        </div>
      </div>

      <main className="pt-6 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Favoritos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="text-sm text-muted-foreground">Cargando favoritos…</div>
              )}
              {isError && (
                <div className="text-sm">
                  {((error as any)?.message || '').includes('No autenticado') ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Inicia sesión para ver tus favoritos.</span>
                      <Button asChild size="sm" variant="ocean">
                        <Link to={`/login?returnUrl=${encodeURIComponent('/favorites')}`}>Iniciar sesión</Link>
                      </Button>
                    </div>
                  ) : (
                    <span className="text-red-500">No se pudieron cargar tus favoritos.</span>
                  )}
                </div>
              )}
              {!isLoading && !items.length && (
                <div className="text-sm text-muted-foreground">
                  Aún no tienes favoritos. Explora y guarda tus barcos preferidos.
                </div>
              )}

              {!!items.length && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((b: any) => {
                    const id = String(b?._id ?? b?.id);
                    return (
                      <div key={id} className="group rounded-lg overflow-hidden border bg-card">
                        <Link to={`/barcos/${id}`} className="block">
                          <div className="aspect-video overflow-hidden">
                            <img src={getImg(b)} alt={getName(b)} className="h-full w-full object-cover group-hover:scale-105 transition" />
                          </div>
                          <div className="p-3">
                            <div className="font-semibold line-clamp-1">{getName(b)}</div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {getLocation(b)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" /> {b?.rating?.toFixed?.(1) ?? "N/D"}
                            </div>
                          </div>
                        </Link>
                        <div className="p-3 pt-0 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unfavMutation.mutate(id)}
                            disabled={unfavMutation.isPending}
                          >
                            <Heart className="h-4 w-4 mr-1 fill-red-500 text-red-500" /> Quitar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Favorites;
