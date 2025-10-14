import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Ship, MapPin, Euro, Users, Shield, TrendingUp, CheckCircle, Clock, Headphones, CreditCard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const ListYourBoat = () => {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState<boolean>(false);

  useEffect(() => {
    const check = () => setIsAuth(!!localStorage.getItem('authToken'));
    check();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'authToken') check();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', check);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', check);
    };
  }, []);

  const handleStartNow = () => {
    if (isAuth) {
      navigate('/my-boats');
    } else {
      navigate('/login');
    }
  };

  const steps = [
    { number: 1, title: "Regístrate", description: "Crea tu cuenta de propietario" },
    { number: 2, title: "Publica", description: "Añade tu embarcación desde tu perfil" },
    { number: 3, title: "Aprobación", description: "Revisamos tu publicación" },
    { number: 4, title: "¡Gana dinero!", description: "Empieza a recibir reservas" },
  ];


  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="pt-24 md:pt-28 pb-16 bg-gradient-ocean">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white/20 rounded-full">
              <Ship className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Alquila Tu Barco con <span className="brand-title">boatbnb</span>
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Convierte tu embarcación en una fuente de ingresos. Únete a miles de propietarios 
            que ya están ganando dinero mientras su barco no está en uso.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/90 mb-8">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Registro gratuito</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Seguro incluido</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Pagos seguros</span>
            </div>
          </div>
          <div className="flex justify-center">
            <Button onClick={handleStartNow} size="lg" className="bg-white text-primary hover:bg-white/90">
              Empezar Ahora
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* How it Works */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Cómo funciona?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Publicar tu barco es fácil y rápido. Sigue estos 4 simples pasos:
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-ocean flex items-center justify-center font-bold text-2xl text-white mb-4 shadow-lg">
                    {step.number}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>


        {/* Earnings Calculator */}
        <div className="mb-20 mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Calcula tus ganancias potenciales</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Los propietarios en boatbnb ganan un promedio de <strong className="text-primary">5,780€ al mes</strong> alquilando 
                su embarcación solo 10 días.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Tú decides el precio</div>
                    <div className="text-sm text-muted-foreground">Controla completamente tus tarifas y disponibilidad</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Sin costos ocultos</div>
                    <div className="text-sm text-muted-foreground">Solo pagas comisión cuando recibes una reserva</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Calendario flexible</div>
                    <div className="text-sm text-muted-foreground">Bloquea las fechas que quieras usar tu barco</div>
                  </div>
                </li>
              </ul>
            </div>
            <Card className="bg-gradient-ocean text-white mt-20">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Ejemplo de ingresos mensuales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-sm text-white/80 mb-2">Precio promedio por día</div>
                  <div className="text-4xl font-bold">800€</div>
                </div>
                <Separator className="bg-white/20" />
                <div className="space-y-3">
                  <div className="flex justify-between text-lg">
                    <span className="text-white/90">10 días alquilados</span>
                    <span className="font-semibold">8,000€</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-white/90">Comisión boatbnb (15%)</span>
                    <span className="font-semibold">-1,200€</span>
                  </div>
                  <Separator className="bg-white/20" />
                  <div className="flex justify-between text-2xl font-bold">
                    <span>Tus ganancias netas</span>
                    <span>6,800€</span>
                  </div>
                </div>
                <p className="text-sm text-white/70">
                  *Estimación basada en datos reales de propietarios activos en la plataforma
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-ocean rounded-2xl p-8 md:p-12 text-center text-white mt-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para empezar a ganar dinero?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Únete a miles de propietarios que ya están generando ingresos pasivos con sus embarcaciones
          </p>
          <div className="flex justify-center">
            <Button onClick={handleStartNow} size="lg" className="bg-white text-primary hover:bg-white/90">
              {isAuth ? 'Ir a Mis Barcos' : 'Crear Cuenta Gratis'}
            </Button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Preguntas frecuentes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Cuánto cuesta publicar mi barco?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Publicar tu barco es completamente gratis. Solo cobramos una comisión del 15% cuando recibes una reserva confirmada.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Qué incluye el seguro?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Todas las reservas incluyen seguro completo que cubre daños a la embarcación, responsabilidad civil y asistencia en navegación.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Cómo publico mi barco?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Una vez registrado, ve a tu perfil y accede a la sección "Mis Barcos". Desde ahí podrás añadir tu embarcación con fotos, descripción y precios.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Cuándo recibo el pago?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Recibes el pago 24-48 horas después de que finalice cada reserva, directamente en tu cuenta bancaria.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ListYourBoat;
