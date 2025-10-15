import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Ship, Star, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Destinations = () => {
  const featuredDestinations = [
    {
      name: "Mallorca",
      country: "España",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
      boats: 450,
      rating: 4.8,
      description: "Calas cristalinas y puertos deportivos de lujo"
    },
    {
      name: "Ibiza",
      country: "España",
      image: "https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=800&q=80",
      boats: 380,
      rating: 4.9,
      description: "Playas paradisíacas y vida nocturna vibrante"
    },
    {
      name: "Costa Brava",
      country: "España",
      image: "https://images.unsplash.com/photo-1562155955-1cb2d73488d7?w=800&q=80",
      boats: 320,
      rating: 4.7,
      description: "Pueblos costeros con encanto mediterráneo"
    },
    {
      name: "Marbella",
      country: "España",
      image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80",
      boats: 290,
      rating: 4.8,
      description: "Lujo y glamour en la Costa del Sol"
    },
    {
      name: "Valencia",
      country: "España",
      image: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&q=80",
      boats: 260,
      rating: 4.6,
      description: "Ciudad moderna con puerto histórico"
    },
    {
      name: "Menorca",
      country: "España",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
      boats: 210,
      rating: 4.9,
      description: "Naturaleza virgen y aguas turquesas"
    },
    {
      name: "Santorini",
      country: "Grecia",
      image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80",
      boats: 180,
      rating: 4.9,
      description: "Atardeceres inolvidables en el Egeo"
    },
    {
      name: "Croacia",
      country: "Croacia",
      image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80",
      boats: 420,
      rating: 4.8,
      description: "Mil islas por descubrir en el Adriático"
    },
    {
      name: "Amalfi",
      country: "Italia",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
      boats: 240,
      rating: 4.9,
      description: "Costa espectacular con pueblos colgantes"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="pt-24 md:pt-28 pb-16 bg-gradient-ocean">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white/20 rounded-full">
              <MapPin className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Descubre Destinos Increíbles
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Explora los mejores destinos náuticos del mundo. Desde el Mediterráneo hasta el Caribe, 
            encuentra el lugar perfecto para tu próxima aventura.
          </p>
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
            <Link to="/explorar-barcos">Ver Todos los Barcos</Link>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Featured Destinations */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Destinos Destacados</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Los lugares más populares entre nuestra comunidad de navegantes
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredDestinations.map((destination, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={destination.image} 
                    alt={destination.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-bold text-white mb-1">{destination.name}</h3>
                    <p className="text-white/90 text-sm">{destination.country}</p>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-sm">{destination.rating}</span>
                  </div>
                </div>
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4">{destination.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Ship size={16} />
                      <span>{destination.boats} barcos disponibles</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-ocean rounded-2xl p-8 md:p-12 text-center text-white">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-white/20 rounded-full">
              <TrendingUp className="h-8 w-8" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para tu próxima aventura?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Más de 50,000 embarcaciones esperándote en los mejores destinos del mundo
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
              <Link to="/explorar-barcos">Explorar Barcos</Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary mb-2">150+</div>
            <div className="text-muted-foreground">Destinos</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">50K+</div>
            <div className="text-muted-foreground">Embarcaciones</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">180K+</div>
            <div className="text-muted-foreground">Clientes Felices</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">4.9★</div>
            <div className="text-muted-foreground">Valoración Media</div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Destinations;
