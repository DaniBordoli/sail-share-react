import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Calendar, Euro, Ship } from "lucide-react";
import { createReview, listMyBookings } from "@/stores/slices/basicSlice";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const fmt = (d: string) => new Date(d).toLocaleDateString();

const MyBookings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedBk, setSelectedBk] = useState<any>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => listMyBookings(),
  });

  const items = useMemo(() => {
    const base = data?.items ?? [];
    try {
      const raw = sessionStorage.getItem('lastBooking');
      if (raw) {
        const lb = JSON.parse(raw);
        const id = lb?._id || lb?.id;
        if (id && !base.some((b: any) => (b?._id || b?.id) === id)) {
          return [lb, ...base];
        }
      }
    } catch {}
    return base;
  }, [data]);

  const createReviewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBk) throw new Error('Reserva no válida');
      const payload = {
        bookingId: selectedBk?._id,
        boatId: String(selectedBk?.boatId),
        rating: Math.max(1, Math.min(5, Number(rating) || 0)),
        comment: comment?.trim() || undefined,
      };
      return createReview(payload);
    },
    onSuccess: () => {
      toast({ title: 'Reseña enviada', description: 'Gracias por tu valoración.' });
      setReviewOpen(false);
      setSelectedBk(null);
      setRating(5);
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
      if (selectedBk?.boatId) {
        queryClient.invalidateQueries({ queryKey: ['boat-reviews', String(selectedBk.boatId)] });
      }
    },
    onError: (e: any) => {
      toast({ title: 'No se pudo enviar la reseña', description: e?.message || 'Intenta nuevamente', variant: 'destructive' });
    }
  });

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      {/* Hero con gradiente (mismo estilo que AdminPanel) */}
      <div className="pt-20 pb-8 bg-gradient-ocean">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Mis reservas</h1>
          <p className="text-white/90 text-sm">Consulta tus reservas creadas y su estado.</p>
        </div>
      </div>

      <main className="pt-6 pb-12">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading && <p>Cargando reservas…</p>}
            {isError && <p className="text-red-600">No se pudieron cargar las reservas. ¿Has iniciado sesión?</p>}
            {!isLoading && !isError && items.length === 0 && (
              <Card variant="floating">
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Aún no tienes reservas.</p>
                  <div className="mt-3">
                    <Button asChild variant="ocean">
                      <Link to="/explorar-barcos">Buscar barcos</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {items.map((bk: any) => (
              <Card key={bk._id} variant="floating" className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Ship className="h-4 w-4" /> Reserva
                  </CardTitle>
                  <Badge variant={bk.status === 'confirmed' ? 'default' : bk.status === 'pending_payment' ? 'secondary' : 'destructive'}>
                    {bk.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> Fechas</span>
                    <span className="mt-1">{fmt(bk.startDate)} - {fmt(bk.endDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Huéspedes</span>
                    <span>{bk.guests}</span>
                  </div>
                  {/* Contacto y CV náutico */}
                  <div className="grid grid-cols-1 gap-1">
                    <span className="text-muted-foreground">Contacto</span>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Teléfono</span>
                      <span>{bk.contactPhone || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Niños</span>
                      <span>{bk.hasChildren ? 'Sí' : 'No'}</span>
                    </div>
                    <Separator className="my-2" />
                    <span className="text-muted-foreground">CV náutico</span>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Vela</span>
                      <span>{bk.sailingExperience || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Motor</span>
                      <span>{bk.motorExperience || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Licencia</span>
                      <span>{bk.licenseType || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Experiencia</span>
                      <span>{bk.ownershipExperience || '—'}</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span>Total</span>
                    <span className="font-semibold flex items-center gap-1"><Euro className="h-4 w-4" /> {bk.totalAmount?.toFixed?.(2) ?? bk.totalAmount}</span>
                  </div>
                  <div className="pt-2 flex items-center justify-between">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/barcos/${bk.boatId}`}>Ver barco</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/barcos/${bk.boatId}/reservar`}>Reservar de nuevo</Link>
                    </Button>
                  </div>
                  {bk.status === 'confirmed' && (
                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="ocean"
                        size="sm"
                        onClick={() => {
                          setSelectedBk(bk);
                          setReviewOpen(true);
                        }}
                      >
                        Dejar reseña
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Dialogo para reseña */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dejar reseña</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="rating">Puntuación (1-5)</Label>
              <Input
                id="rating"
                type="number"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comment">Comentario (opcional)</Label>
              <Textarea
                id="comment"
                rows={4}
                placeholder="Cuéntanos tu experiencia"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => createReviewMutation.mutate()}
              disabled={createReviewMutation.isPending || !(Number(rating) >= 1 && Number(rating) <= 5)}
            >
              {createReviewMutation.isPending ? 'Enviando…' : 'Enviar reseña'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default MyBookings;
