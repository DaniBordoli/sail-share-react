import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Headphones, Mail, Phone, MessageCircle, Search, Ship, CreditCard, Shield, Users, FileText, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      icon: Ship,
      title: "Reservas",
      description: "Cómo reservar, cancelar y modificar",
      link: "#reservas"
    },
    {
      icon: CreditCard,
      title: "Pagos",
      description: "Métodos de pago y facturación",
      link: "#pagos"
    },
    {
      icon: Shield,
      title: "Seguridad",
      description: "Seguros y protección",
      link: "#seguridad"
    },
    {
      icon: Users,
      title: "Cuenta",
      description: "Gestión de perfil y configuración",
      link: "#cuenta"
    },
    {
      icon: FileText,
      title: "Propietarios",
      description: "Publicar y gestionar barcos",
      link: "#propietarios"
    },
    {
      icon: HelpCircle,
      title: "Otros",
      description: "Preguntas generales",
      link: "#otros"
    }
  ];

  const faqs = [
    {
      category: "reservas",
      question: "¿Cómo hago una reserva?",
      answer: "Para hacer una reserva, busca el barco que te interesa, selecciona las fechas, el número de pasajeros y haz clic en 'Reservar'. Completa los datos de pago y recibirás una confirmación por email."
    },
    {
      category: "reservas",
      question: "¿Puedo cancelar mi reserva?",
      answer: "Sí, puedes cancelar tu reserva hasta 24 horas antes de la fecha de inicio para recibir un reembolso completo. Las cancelaciones con menos de 24 horas de antelación no son reembolsables."
    },
    {
      category: "reservas",
      question: "¿Qué incluye el precio de la reserva?",
      answer: "El precio incluye el alquiler del barco, seguro completo, limpieza y mantenimiento básico. Los extras como capitán, combustible o catering se cobran aparte según lo que selecciones."
    },
    {
      category: "pagos",
      question: "¿Qué métodos de pago aceptan?",
      answer: "Aceptamos tarjetas de crédito/débito (Visa, Mastercard, American Express), PayPal y transferencias bancarias. Todos los pagos están protegidos con encriptación SSL."
    },
    {
      category: "pagos",
      question: "¿Cuándo se cobra el pago?",
      answer: "Se realiza un cargo completo en el momento de confirmar la reserva. Para reservas con más de 30 días de antelación, puedes optar por pagar un depósito del 30% y el resto 7 días antes del inicio."
    },
    {
      category: "pagos",
      question: "¿Puedo obtener una factura?",
      answer: "Sí, recibirás una factura automáticamente por email después de cada pago. También puedes descargarla desde tu perfil en la sección 'Mis Reservas'."
    },
    {
      category: "seguridad",
      question: "¿Qué cubre el seguro?",
      answer: "El seguro incluye cobertura completa de daños al barco, responsabilidad civil, asistencia médica y remolque en caso de avería. No cubre daños por negligencia grave o uso inadecuado."
    },
    {
      category: "seguridad",
      question: "¿Necesito licencia para navegar?",
      answer: "Depende del tipo de embarcación y destino. Para barcos a motor de más de 15CV o veleros de más de 6 metros, generalmente se requiere titulación náutica. Puedes contratar un capitán si no tienes licencia."
    },
    {
      category: "seguridad",
      question: "¿Qué hago en caso de emergencia?",
      answer: "Contacta inmediatamente a nuestro servicio de emergencias 24/7 al +34 900 123 456. También encontrarás instrucciones de seguridad y contactos de emergencia en el barco."
    },
    {
      category: "cuenta",
      question: "¿Cómo creo una cuenta?",
      answer: "Haz clic en 'Registrarse' en la parte superior, completa tus datos (nombre, email, contraseña) y verifica tu email. También puedes registrarte con Google o Facebook."
    },
    {
      category: "cuenta",
      question: "¿Cómo cambio mi contraseña?",
      answer: "Ve a tu perfil, haz clic en 'Configuración' y luego en 'Cambiar contraseña'. Introduce tu contraseña actual y la nueva. También puedes usar 'Olvidé mi contraseña' en el login."
    },
    {
      category: "cuenta",
      question: "¿Puedo eliminar mi cuenta?",
      answer: "Sí, puedes eliminar tu cuenta desde 'Configuración' > 'Eliminar cuenta'. Ten en cuenta que esta acción es irreversible y perderás todo tu historial de reservas."
    },
    {
      category: "propietarios",
      question: "¿Cómo publico mi barco?",
      answer: "Regístrate, ve a tu perfil y accede a 'Mis Barcos'. Haz clic en 'Añadir Barco', completa la información (tipo, ubicación, fotos, precios) y envía para revisión. La aprobación toma 24-48 horas."
    },
    {
      category: "propietarios",
      question: "¿Cuánto cobran de comisión?",
      answer: "Cobramos una comisión del 15% sobre cada reserva confirmada. No hay costos de publicación ni cuotas mensuales. Solo pagas cuando recibes una reserva."
    },
    {
      category: "propietarios",
      question: "¿Cuándo recibo el pago?",
      answer: "Recibes el pago 24-48 horas después de que finalice la reserva, directamente en tu cuenta bancaria. Puedes ver el estado de tus pagos en 'Mis Ganancias'."
    },
    {
      category: "otros",
      question: "¿En qué países operan?",
      answer: "Operamos en más de 150 destinos en Europa, Caribe, Mediterráneo, Pacífico y Océano Índico. Los principales países son España, Grecia, Italia, Croacia, Francia y Caribe."
    },
    {
      category: "otros",
      question: "¿Puedo alquilar con mascotas?",
      answer: "Depende del propietario. Algunos barcos permiten mascotas, otros no. Usa el filtro 'Se admiten mascotas' en la búsqueda para ver solo barcos que las aceptan."
    },
    {
      category: "otros",
      question: "¿Ofrecen experiencias con capitán?",
      answer: "Sí, muchos barcos ofrecen la opción de contratar un capitán profesional. Esto es ideal si no tienes licencia o prefieres relajarte mientras un experto navega."
    }
  ];

  const contactMethods = [
    {
      icon: Phone,
      title: "Teléfono",
      description: "+34 900 123 456",
      detail: "Lun-Dom 9:00 - 22:00",
      action: "tel:+34900123456"
    },
    {
      icon: Mail,
      title: "Email",
      description: "soporte@boatbnb.com",
      detail: "Respuesta en 24h",
      action: "mailto:soporte@boatbnb.com"
    },
    {
      icon: MessageCircle,
      title: "Chat en vivo",
      description: "Chatea con nosotros",
      detail: "Disponible ahora",
      action: "#"
    },
    {
      icon: Headphones,
      title: "Emergencias 24/7",
      description: "+34 900 999 999",
      detail: "Solo urgencias",
      action: "tel:+34900999999"
    }
  ];

  const filteredFaqs = searchQuery
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="pt-24 md:pt-28 pb-16 bg-gradient-ocean">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white/20 rounded-full">
              <Headphones className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            ¿Cómo podemos ayudarte?
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Encuentra respuestas rápidas o contacta con nuestro equipo de soporte
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Busca tu pregunta..."
                className="pl-12 h-14 text-lg bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* FAQs */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Preguntas Frecuentes</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {searchQuery ? `${filteredFaqs.length} resultados encontrados` : 'Las respuestas a las preguntas más comunes'}
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {filteredFaqs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No encontramos resultados para "{searchQuery}"</p>
                <Button onClick={() => setSearchQuery("")} variant="outline">
                  Limpiar búsqueda
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Contact Methods */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Contacta con Nosotros</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              ¿No encuentras lo que buscas? Estamos aquí para ayudarte
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <method.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-bold mb-2">{method.title}</h3>
                  <p className="text-sm text-muted-foreground mb-1">{method.description}</p>
                  <p className="text-xs text-muted-foreground mb-4">{method.detail}</p>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a href={method.action}>Contactar</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="mb-20">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Envíanos un Mensaje</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" placeholder="Tu nombre" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="tu@email.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Asunto</Label>
                  <Input id="subject" placeholder="¿En qué podemos ayudarte?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Describe tu consulta con el mayor detalle posible..."
                    className="min-h-[150px]"
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-ocean">
                  Enviar Mensaje
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="bg-gradient-ocean rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Todo listo para navegar?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Explora miles de barcos en los mejores destinos del mundo
          </p>
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
            <Link to="/explorar-barcos">Explorar Barcos</Link>
          </Button>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Help;
