import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { simulatePayment } from "@/stores/slices/basicSlice";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Checkout = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = params.get("bookingId") || "";
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSimulatePayment = async () => {
    if (!bookingId) {
      toast({ title: "Error", description: "No hay ID de reserva", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await simulatePayment(bookingId);
      toast({ title: "Pago simulado exitoso", description: "La reserva ha sido confirmada" });
      navigate(`/checkout/success?bookingId=${encodeURIComponent(bookingId)}`);
    } catch (error: any) {
      toast({ title: "Error al simular pago", description: error?.message || "Intenta nuevamente", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <Header />

      {/* Hero con gradiente */}
      <div className="pt-20 pb-8 bg-gradient-ocean">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <nav className="text-white/80 text-sm mb-2">
            <Link to="/" className="underline-offset-4 hover:underline">← Inicio</Link>
          </nav>
          <h1 className="text-3xl font-bold mb-2 text-white">Checkout</h1>
          <p className="text-white/90 text-sm">
            {bookingId ? `Procesando pago para la reserva ${bookingId}` : "Procesa el pago de tu reserva"}
          </p>
        </div>
      </div>

      {/* Contenido */}
      <main className="pt-6 pb-12">
        <section className="max-w-4xl mx-auto px-4 grid grid-cols-1 gap-6">
          <Card variant="floating">
            <CardHeader>
              <CardTitle>Pago simulado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                Esta pantalla representa el flujo de pago. Mobbex prox.
              </p>
              {bookingId && (
                <div className="text-xs text-muted-foreground">
                  bookingId: <span className="font-mono">{bookingId}</span>
                </div>
              )}
              <Separator />
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleSimulatePayment}
                  disabled={loading || !bookingId}
                >
                  {loading ? "Procesando..." : "Simular pago exitoso"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => navigate(bookingId ? `/checkout/error?bookingId=${encodeURIComponent(bookingId)}` : "/checkout/error")}
                >
                  Simular pago fallido
                </Button>
                <Button className="bg-gradient-ocean" onClick={() => navigate("/mis-reservas")}>
                  Ir a Mis reservas
                </Button>
                <Button variant="secondary" onClick={() => navigate(-1)}>
                  Volver
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
