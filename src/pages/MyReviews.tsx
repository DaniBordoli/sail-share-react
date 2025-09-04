import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { listMyReviews } from "@/stores/slices/basicSlice";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const MyReviews = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["my-reviews"],
    queryFn: listMyReviews,
  });

  const items = (data as any)?.items ?? [];

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      {/* Hero con gradiente */}
      <div className="pt-20 pb-8 bg-gradient-ocean">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Mis Reseñas</h1>
          <p className="text-white/90 text-sm">Consulta y gestiona tus reseñas y calificaciones.</p>
        </div>
      </div>

      <main className="pt-6 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reseñas</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="text-sm text-muted-foreground">Cargando reseñas…</div>
              )}
              {isError && (
                <div className="text-sm">
                  {((error as any)?.message || '').includes('No autenticado') ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Inicia sesión para ver tus reseñas.</span>
                      <Link to={`/login?returnUrl=${encodeURIComponent('/my-reviews')}`} className="underline text-primary text-sm">Iniciar sesión</Link>
                    </div>
                  ) : (
                    <span className="text-red-500">No se pudieron cargar tus reseñas.</span>
                  )}
                </div>
              )}
              {!isLoading && !items.length && (
                <div className="text-sm text-muted-foreground">
                  Aún no hay reseñas para mostrar.
                </div>
              )}

              {!!items.length && (
                <div className="divide-y">
                  {items.map((r: any) => {
                    const id = String(r?._id ?? r?.id);
                    const boatId = String(r?.boatId?._id ?? r?.boatId?.id ?? r?.boatId ?? "");
                    const boatName = r?.boatId?.name || r?.boatName || "Embarcación";
                    const userName = r?.userName || "Yo";
                    const userAvatar = r?.userAvatar as string | undefined;
                    const dateStr = r?.date || r?.createdAt;
                    return (
                      <div key={id} className="py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              {userAvatar ? (
                                <AvatarImage src={userAvatar} alt={userName} />
                              ) : (
                                <AvatarFallback>{(userName || 'Y').slice(0,1).toUpperCase()}</AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium leading-none">{userName}</div>
                              <div className="text-xs text-muted-foreground">
                                {boatId ? (
                                  <Link to={`/barcos/${boatId}`} className="hover:underline">{boatName}</Link>
                                ) : (
                                  <span>{boatName}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500" /> {Number(r?.rating ?? 0).toFixed(1)}</span>
                            {dateStr && (
                              <span className="text-xs">{new Date(dateStr).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        {r?.comment && (
                          <p className="mt-2 text-muted-foreground text-sm">{r.comment}</p>
                        )}
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

export default MyReviews;
