import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MyReviews = () => {
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reseñas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Aún no hay reseñas para mostrar.
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyReviews;
