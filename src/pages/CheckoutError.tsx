import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { XCircle } from "lucide-react";

const CheckoutError = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = params.get("bookingId") || "";

  return (
    <div className="min-h-screen bg-muted">
      <Header />

      {/* Hero con gradiente */}
      <div className="pt-20 pb-8 bg-gradient-ocean">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <nav className="text-white/80 text-sm mb-2">
            <Link to="/" className="underline-offset-4 hover:underline">← Inicio</Link>
          </nav>
          <h1 className="text-3xl font-bold mb-2 text-white">Pago fallido</h1>
          <p className="text-white/90 text-sm">Hubo un problema procesando el pago.</p>
        </div>
      </div>

      <main className="pt-6 pb-12">
        <section className="max-w-md mx-auto px-4 grid grid-cols-1 gap-6">
          <Card variant="floating">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="text-destructive" />
                No se pudo completar el pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>Por favor, vuelve a intentarlo. Si el problema persiste, contacta soporte.</p>
              {bookingId && (
                <div className="text-xs text-muted-foreground">
                  bookingId: <span className="font-mono">{bookingId}</span>
                </div>
              )}
              <Separator />
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate(bookingId ? `/checkout?bookingId=${encodeURIComponent(bookingId)}` : "/checkout")}>
                  Reintentar pago
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

export default CheckoutError;
