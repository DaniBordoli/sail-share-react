import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2 } from "lucide-react";
import { updateBookingStatus } from "@/stores/slices/basicSlice";

const CheckoutSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = params.get("bookingId") || "";
  const queryClient = useQueryClient();

  useEffect(() => {
    // Si tenemos bookingId, marcamos como confirmada en el backend
    (async () => {
      try {
        if (bookingId) {
          await updateBookingStatus(bookingId, 'confirmed');
          // Reflejar confirmación en sessionStorage para UI optimista
          try {
            const raw = sessionStorage.getItem('lastBooking');
            if (raw) {
              const obj = JSON.parse(raw);
              const storedId = String(obj?._id || obj?.id || '');
              if (storedId && storedId === String(bookingId)) {
                obj.status = 'confirmed';
                sessionStorage.setItem('lastBooking', JSON.stringify(obj));
              }
            }
          } catch {}
        }
      } catch {}
      // En cualquier caso, invalidamos para que "Mis reservas" se actualice
      try { await queryClient.invalidateQueries({ queryKey: ["my-bookings"] }); } catch {}
    })();
  }, [bookingId, queryClient]);

  return (
    <div className="min-h-screen bg-muted">
      <Header />

      {/* Hero con gradiente */}
      <div className="pt-20 pb-8 bg-gradient-ocean">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <nav className="text-white/80 text-sm mb-2">
            <Link to="/" className="underline-offset-4 hover:underline">← Inicio</Link>
          </nav>
          <h1 className="text-3xl font-bold mb-2 text-white">Pago exitoso</h1>
          <p className="text-white/90 text-sm">Tu pago fue procesado correctamente.</p>
        </div>
      </div>

      <main className="pt-6 pb-12">
        <section className="max-w-md mx-auto px-4 grid grid-cols-1 gap-6">
          <Card variant="floating">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" />
                ¡Listo! Pago confirmado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>Gracias por tu reserva. Te enviamos un correo con los detalles.</p>
              {bookingId && (
                <div className="text-xs text-muted-foreground">
                  bookingId: <span className="font-mono">{bookingId}</span>
                </div>
              )}
              <Separator />
              <div className="flex flex-wrap gap-3">
                <Button
                  className="bg-gradient-ocean"
                  onClick={async () => {
                    try { await queryClient.invalidateQueries({ queryKey: ["my-bookings"] }); } catch {}
                    let lastBk: any = null;
                    try { const raw = sessionStorage.getItem('lastBooking'); if (raw) lastBk = JSON.parse(raw); } catch {}
                    if (lastBk && String(lastBk?._id || lastBk?.id || '') === String(bookingId)) {
                      lastBk = { ...lastBk, status: 'confirmed' };
                    }
                    navigate("/mis-reservas", { state: { lastBookingFromCheckout: lastBk } });
                  }}
                >
                  Ver mis reservas
                </Button>
                <Button variant="secondary" onClick={() => navigate("/")}>Ir al inicio</Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutSuccess;
