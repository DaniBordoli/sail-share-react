import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Users, Ship, Share2, Link as LinkIcon, User, BadgeCheck, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import heroImage from "@/assets/hero-yacht.jpg";
import { contactOwner, getBoatById, toggleFavorite, listMyFavorites } from "@/stores/slices/basicSlice";
import { API_BASE_URL } from "@/lib/api";
import { mockBoats } from "@/data/mockBoats";
import { useToast } from "@/components/ui/use-toast";
 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "@/hooks/use-current-user";

interface Boat {
  _id?: string;
  id?: string | number;
  name?: string;
  title?: string;
  description?: string;
  addressFormatted?: string;
  location?: any;
  city?: string;
  country?: string;
  price?: number;
  rating?: number;
  capacity?: number;
  imageUrl?: string;
  image?: string;
  photos?: string[];
  boatType?: string;
  brand?: string;
  model?: string;
  length?: number;
  priceUnit?: string;
  amenities?: string[];
  equipment?: string[];
  features?: string[];
  ownerId?: string;
  ownerName?: string;
  ownerRating?: number;
  ownerAvatar?: string;
  allowsFlexibleCancellation?: boolean;
}

const BoatDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [openContact, setOpenContact] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [openLightbox, setOpenLightbox] = useState(false);
  const isValidEmail = useMemo(() => /^(?:[a-zA-Z0-9_'^&\/+{}!#$%*?`|~.-]+)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(formEmail.trim()), [formEmail]);
  const isValidName = useMemo(() => formName.trim().length >= 2, [formName]);
  const isValidMessage = useMemo(() => formMessage.trim().length >= 10, [formMessage]);


  const { data, isLoading, isError } = useQuery({
    queryKey: ["boat", id],
    queryFn: () => (id ? getBoatById(id) : Promise.resolve(undefined as any)),
    enabled: !!id,
  });

  

  const apiBoat = (data as any)?.data || (Array.isArray(data) ? data?.[0] : data);

  const boat: Boat | undefined = useMemo(() => {
    if (!id) return undefined;
    const idOf = (o: any) => o?._id ?? o?.id;
    const byApi = apiBoat as any;
    if (byApi && idOf(byApi)) return byApi as Boat;
    return mockBoats.find((b: any) => String(idOf(b)) === String(id)) as unknown as Boat | undefined;
  }, [apiBoat, id]);

  const getImg = (b?: Boat) => b?.imageUrl || b?.image || b?.photos?.[0] || heroImage;
  const getName = (b?: Boat) => b?.name || b?.title || "Embarcación";
  const getLocation = (b?: Boat) => {
    const loc: any = b?.location as any;
    if (typeof loc === 'string') return loc;
    if (loc && typeof loc === 'object') {
      if (typeof loc.addressFormatted === 'string' && loc.addressFormatted.trim()) return loc.addressFormatted;
      if (typeof loc.formatted === 'string' && loc.formatted.trim()) return loc.formatted;
      // Si fuera GeoJSON { type, coordinates }, no lo renderizamos directamente
    }
    const cc = [b?.city, b?.country].filter(Boolean).join(', ');
    return cc || '-';
  };

  // Determinar un id válido para reviews (usar el _id real del API si está disponible)
  const reviewsId = useMemo(() => {
    const realId = String(((apiBoat as any)?._id) || id || '');
    return realId;
  }, [apiBoat, id]);

  const isValidObjectId = (v: string) => /^[a-fA-F0-9]{24}$/.test(v || '');

  // Reseñas: obtener desde API pública (solo si el id es ObjectId válido)
  const { data: reviewsResp } = useQuery({
    queryKey: ['boat-reviews', reviewsId],
    queryFn: async () => {
      if (!reviewsId || !isValidObjectId(reviewsId)) return null as any;
      const res = await fetch(`${API_BASE_URL}/api/boats/${reviewsId}/reviews?page=1&limit=5`);
      return res.json();
    },
    enabled: !!reviewsId && isValidObjectId(reviewsId),
  });

  // Condiciones de alquiler: obtener desde API pública
  const { data: conditionsResp } = useQuery({
    queryKey: ['boat-conditions', id],
    queryFn: async () => {
      if (!id) return null as any;
      const res = await fetch(`${API_BASE_URL}/api/boats/${id}/conditions`);
      return res.json();
    },
    enabled: !!id,
  });

  // Lista de tipos de rental permitidos desde condiciones (si viene)
  const allowedRentalTypes = useMemo(() => {
    const raw = (conditionsResp as any)?.data?.allowedRentalTypes;
    const valid: ("boat_only"|"with_captain"|"owner_onboard")[] = ['boat_only','with_captain','owner_onboard'];
    if (Array.isArray(raw)) {
      const filtered = raw.filter((r: any) => valid.includes(r));
      return filtered.length ? filtered : undefined;
    }
    return undefined;
  }, [conditionsResp]);

  const handleShare = async () => {
    const title = getName(boat);
    const text = `${title} en ${getLocation(boat)} · Mira esta embarcación en boatbnb`;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
    } catch (_) {
      // si falla navigator.share, hacemos fallback
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Enlace copiado', description: 'Se copió el enlace para compartir.' });
    } catch (e) {
      toast({ title: 'No se pudo copiar el enlace', variant: 'destructive' });
    }
  };

  // Condiciones mapeadas desde API con fallbacks legibles
  const rentalConditions = useMemo(() => {
    const c = (conditionsResp as any)?.data || {};
    const checkIn = c?.checkInTime || '';
    const checkOut = c?.checkOutTime || '';
    const checkin = [checkIn && `Check-in ${checkIn}`, checkOut && `Check-out ${checkOut}`].filter(Boolean).join(' • ');
    return {
      cancellationPolicy: c?.cancellationPolicy || '—',
      deposit: typeof c?.deposit === 'number' ? `$${c.deposit}` : '—',
      checkin: checkin || '—',
      license: c?.licenseRequired ? 'Se requiere licencia náutica válida o contratación de capitán.' : 'No requiere licencia o patrón obligatorio.',
      included: Array.isArray(c?.includes) ? c.includes : [],
      notIncluded: Array.isArray(c?.notIncluded) ? c.notIncluded : [],
    };
  }, [conditionsResp]);

  // Favoritos del usuario (para estado del botón)
  const { data: favsData } = useQuery({
    queryKey: ['my-favorites'],
    queryFn: listMyFavorites,
    enabled: !!user?._id,
    staleTime: 30_000,
  });

  const isFavorited = useMemo(() => {
    const list: any[] = Array.isArray((favsData as any)?.items) ? (favsData as any).items : [];
    const idOf = (o: any) => o?._id ?? o?.id;
    const thisId = String(boat?._id || boat?.id || '');
    if (!thisId) return false;
    return list.some(b => String(idOf(b)) === thisId);
  }, [favsData, boat]);

  const favMutation = useMutation({
    mutationFn: async () => {
      const thisId = String(boat?._id || boat?.id || '');
      if (!thisId) throw new Error('Barco inválido');
      return toggleFavorite(thisId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['my-favorites'] });
      const prev = queryClient.getQueryData(['my-favorites']);
      const thisId = String(boat?._id || boat?.id || '');
      queryClient.setQueryData(['my-favorites'], (old: any) => {
        const items: any[] = Array.isArray(old?.items) ? old.items : [];
        const exists = items.some((b: any) => String(b?._id ?? b?.id) === thisId);
        return exists
          ? { items: items.filter((b: any) => String(b?._id ?? b?.id) !== thisId) }
          : { items: [{ ...(boat as any) }, ...items] };
      });
      return { prev };
    },
    onSuccess: (res) => {
      const thisId = String(boat?._id || boat?.id || '');
      queryClient.setQueryData(['my-favorites'], (old: any) => {
        const items: any[] = Array.isArray(old?.items) ? old.items : [];
        const exists = items.some((b: any) => String(b?._id ?? b?.id) === thisId);
        if (res?.favorited) {
          return exists ? { items } : { items: [{ ...(boat as any) }, ...items] };
        }
        // not favorited
        return exists ? { items: items.filter((b: any) => String(b?._id ?? b?.id) !== thisId) } : { items };
      });
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['my-favorites'], ctx.prev as any);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['my-favorites'] });
    }
  });

  // Pre-cargar datos de usuario en el formulario al abrir
  useEffect(() => {
    if (openContact && user) {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
      setFormName(fullName || formName);
      setFormEmail(user.email || formEmail);
    }
  }, [openContact, user]);

  const sendContact = useMutation({
    mutationFn: async () => {
      if (!boat?._id && !boat?.id) throw new Error('Barco inválido');
      if (!isValidName) throw new Error('Por favor, ingresa un nombre válido (mín. 2 caracteres).');
      if (!isValidEmail) throw new Error('Por favor, ingresa un email válido.');
      if (!isValidMessage) throw new Error('El mensaje debe tener al menos 10 caracteres.');
      return contactOwner({
        boatId: String(boat?._id || boat?.id),
        name: formName.trim(),
        email: formEmail.trim(),
        message: formMessage.trim(),
      });
    },
    onSuccess: () => {
      toast({ title: 'Mensaje enviado', description: 'El propietario recibirá tu consulta por email.' });
      setOpenContact(false);
      setFormMessage('');
    },
    onError: (e: any) => {
      toast({ title: 'No se pudo enviar el mensaje', description: e?.message || 'Intenta nuevamente', variant: 'destructive' });
    }
  });

  // Reseñas desde API; si no hay, usar 0/0
  type Review = { id: string; user: string; rating: number; date: string; comment: string };
  const reviews = useMemo<Review[]>(() => {
    const arr = (reviewsResp as any)?.data;
    return Array.isArray(arr) ? arr as Review[] : [];
  }, [reviewsResp]);
  const avgRating = useMemo(() => {
    const avg = (reviewsResp as any)?.summary?.average;
    if (typeof avg === 'number') return avg;
    if (reviews.length) {
      const sum = reviews.reduce((a, r) => a + (r.rating || 0), 0);
      return Number((sum / reviews.length).toFixed(1));
    }
    return boat?.rating || 0;
  }, [reviewsResp, reviews, boat?.rating]);
  const reviewsCount = (reviewsResp as any)?.summary?.count ?? reviews.length;

  // Fotos del barco para la galería (asegurar al menos 1)
  const photos: string[] = useMemo(() => {
    const list = Array.isArray(boat?.photos) ? boat!.photos.filter(Boolean) as string[] : [];
    const primary = getImg(boat);
    if (!list.length) return [primary];
    // Asegurar que la principal esté incluida al inicio sin duplicados
    const unique = Array.from(new Set([primary, ...list]));
    return unique;
  }, [boat]);

  // Reset al cambiar de barco
  useEffect(() => { setActiveIndex(0); }, [boat?._id, boat?.id]);

  useEffect(() => {
    const name = getName(boat);
    document.title = `${name} | Detalles del barco | boatbnb`;
    const desc = `${name} en ${getLocation(boat)}: detalles, capacidad y precio. Reserva en boatbnb.`;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);

    // Structured data
    const ld: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: name,
      image: [getImg(boat)],
      description: desc,
      aggregateRating: boat?.rating ? {
        '@type': 'AggregateRating',
        ratingValue: boat.rating,
        reviewCount: 1
      } : undefined,
      offers: boat?.price ? {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: boat.price,
        availability: 'https://schema.org/InStock'
      } : undefined
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(ld);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [boat]);

  return (
    <div className="relative min-h-screen isolate">
      {/* Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none select-none"
        style={{
          backgroundImage: `url(${getImg(boat)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-hero opacity-70 pointer-events-none"></div>
        <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>
      </div>

      <div className="relative z-50 pointer-events-auto">
        <Header />
      </div>

      <main className="relative z-10 pt-24 pb-16">
        <header className="max-w-7xl mx-auto px-4 mb-6">
          <nav className="text-white/80 text-sm mb-2">
            <Link to="/explorar-barcos" className="hover:underline">← Volver a la búsqueda</Link>
          </nav>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl md:text-4xl font-bold text-white">{getName(boat)}</h1>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Button variant="secondary" className="bg-white/90 hover:bg-white" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" /> Compartir
              </Button>
              {user?._id && (
                <Button
                  variant="secondary"
                  className="bg-white/90 hover:bg-white"
                  onClick={() => favMutation.mutate()}
                  disabled={favMutation.isPending}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                  {isFavorited ? 'Quitar' : 'Favorito'}
                </Button>
              )}
            </div>
          </div>
          <p className="text-white/80 mt-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" /> {getLocation(boat)}
          </p>
        </header>

        <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <article className="lg:col-span-2">
            <Card variant="floating" className="overflow-hidden">
              {/* Imagen principal clickeable */}
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={photos[activeIndex]}
                  alt={`${getName(boat)} en ${getLocation(boat)} - foto ${activeIndex + 1}`}
                  className="h-full w-full object-cover cursor-pointer"
                  loading="eager"
                  onClick={() => setOpenLightbox(true)}
                />
              </div>
              {/* Miniaturas */}
              {photos.length > 1 && (
                <div className="px-4 py-3">
                  <div className="flex gap-2 overflow-x-auto">
                    {photos.map((src, i) => (
                      <button
                        key={`${src}-${i}`}
                        type="button"
                        className={`h-16 w-24 rounded overflow-hidden`}
                        onClick={() => setActiveIndex(i)}
                        aria-label={`Ver imagen ${i + 1}`}
                      >
                        <img src={src} alt={`miniatura ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>{boat?.description || "Explora los detalles de esta embarcación. Ideal para salidas con amigos o familia."}</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-foreground">
                  <span className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500" /> {typeof avgRating === 'number' ? avgRating.toFixed(1) : 'N/D'}</span>
                  <span className="text-muted-foreground">({reviewsCount} reseñas)</span>
                </div>
              </CardContent>
            </Card>

            {/* Lightbox */}
            <Dialog open={openLightbox} onOpenChange={setOpenLightbox}>
              <DialogContent className="max-w-5xl">
                <div className="relative">
                  <img src={photos[activeIndex]} alt={`imagen ${activeIndex + 1}`} className="w-full h-auto object-contain" />
                  {photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 shadow hover:bg-background"
                        onClick={() => setActiveIndex((idx) => (idx - 1 + photos.length) % photos.length)}
                        aria-label="Anterior"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 shadow hover:bg-background"
                        onClick={() => setActiveIndex((idx) => (idx + 1) % photos.length)}
                        aria-label="Siguiente"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
                {photos.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {photos.map((src, i) => (
                      <button
                        key={`lb-${src}-${i}`}
                        type="button"
                        className={`h-14 w-20 rounded overflow-hidden ${i === activeIndex ? 'ring-2 ring-primary' : 'border border-border'}`}
                        onClick={() => setActiveIndex(i)}
                        aria-label={`Ver imagen ${i + 1}`}
                      >
                        <img src={src} alt={`miniatura ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Características y equipamiento */}
            <Card variant="floating" className="mt-6">
              <CardHeader>
                <CardTitle>Características y equipamiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tipo</span>
                    <span className="flex items-center gap-1"><Ship className="h-4 w-4" /> {boat?.boatType || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Capacidad</span>
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {boat?.capacity ?? '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Marca</span>
                    <span>{boat?.brand || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Modelo</span>
                    <span>{boat?.model || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Eslora</span>
                    <span>{boat?.length ? `${boat.length} m` : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Precio</span>
                    <span>{boat?.price ? `$${boat.price} / ${boat?.priceUnit || 'día'}` : 'Consultar'}</span>
                  </div>
                </div>
                {/* Equipamiento */}
                {(() => {
                  const eq = (boat?.amenities || boat?.equipment || boat?.features || []) as string[];
                  if (!eq?.length) return null;
                  return (
                    <div className="mt-4">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Equipamiento</div>
                      <div className="flex flex-wrap gap-2">
                        {eq.map((item, idx) => (
                          <span key={`${item}-${idx}`} className="px-2 py-1 rounded-full bg-muted text-foreground/90 text-xs">{item}</span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Propietario */}
            <Card variant="floating" className="mt-6">
              <CardHeader>
                <CardTitle>Propietario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-3">
                  <Link to={boat?.ownerId ? `/propietario/${boat.ownerId}` : '#'} className="flex items-center gap-3 group/owner">
                    {boat?.ownerAvatar ? (
                      <img
                        src={boat.ownerAvatar}
                        alt={boat?.ownerName || 'Propietario'}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted" />
                    )}
                    <div>
                      <div className="font-semibold flex items-center gap-1 group-hover/owner:underline">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{boat?.ownerName || 'Propietario'}</span>
                        {boat?.ownerRating ? (
                          <span className="ml-2 inline-flex items-center text-amber-500 text-sm"><Star className="h-4 w-4 mr-1 fill-amber-500" /> {boat.ownerRating.toFixed(1)}</span>
                        ) : null}
                      </div>
                      <div className="text-muted-foreground text-sm">Anfitrión verificado <BadgeCheck className="inline h-4 w-4 text-emerald-500" /></div>
                    </div>
                  </Link>
                  {boat?.ownerId ? (
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/propietario/${boat.ownerId}`}>Ver perfil</Link>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {/* Condiciones de alquiler */}
            <Card variant="floating" className="mt-6">
              <CardHeader>
                <CardTitle>Condiciones de alquiler</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide">Política de cancelación</div>
                    <div className="text-foreground/90">{rentalConditions.cancellationPolicy}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide">Depósito</div>
                    <div className="text-foreground/90">{rentalConditions.deposit}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide">Check-in / Check-out</div>
                    <div className="text-foreground/90">{rentalConditions.checkin}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide">Licencia</div>
                    <div className="text-foreground/90">{rentalConditions.license}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide">Incluye</div>
                    <ul className="list-disc list-inside">
                      {rentalConditions.included.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide">No incluye</div>
                    <ul className="list-disc list-inside">
                      {rentalConditions.notIncluded.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reseñas */}
            <Card variant="floating" className="mt-6">
              <CardHeader>
                <CardTitle>Reseñas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex items-center gap-1 text-foreground"><Star className="h-4 w-4 text-yellow-500" /> {avgRating?.toFixed?.(1) || 'N/D'}</span>
                  <span className="text-muted-foreground">({reviewsCount} reseñas)</span>
                </div>
                <div className="divide-y">
                  {reviews.map(r => (
                    <div key={r.id} className="py-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{r.user}</div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500" /> {r.rating.toFixed(1)}</span>
                          <span className="text-xs">{new Date(r.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <p className="mt-1 text-muted-foreground">{r.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </article>

          <aside>
            <Card variant="floating">
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Capacidad</span>
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {boat?.capacity ?? '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Valoración</span>
                  <span className="flex items-center gap-2"><span className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500" /> {avgRating ? avgRating.toFixed(1) : 'N/D'}</span><span className="text-xs text-muted-foreground">({reviewsCount})</span></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="flex items-center gap-1"><Ship className="h-4 w-4" /> {boat?.boatType || '—'}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-base">
                    <span className="text-muted-foreground">Desde</span>{' '}
                    <span className="font-semibold">{boat?.price ? `$${boat.price}` : 'Consultar'}</span>{' '}
                    <span className="text-muted-foreground">/ día</span>
                  </div>
                  <div className="mt-3">
                    <Button variant="ocean" size="lg" asChild>
                      <Link to={user?._id ? `/barcos/${id}/reservar` : `/login?redirect=${encodeURIComponent(`/barcos/${id}/reservar`)}`}>Solicitar reserva</Link>
                    </Button>
                  </div>
                  <div className="mt-3">
                    <Dialog open={openContact} onOpenChange={setOpenContact}>
                      <DialogTrigger asChild>
                        <Button variant="secondary" size="lg">Contactar al dueño</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Contactar al dueño</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label htmlFor="contact-name">Nombre</Label>
                            <Input id="contact-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Tu nombre" />
                            {!isValidName && formName.length > 0 && (
                              <span className="text-xs text-red-500">Mínimo 2 caracteres.</span>
                            )}
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="contact-email">Email</Label>
                            <Input id="contact-email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="tu@email.com" />
                            {!isValidEmail && formEmail.length > 0 && (
                              <span className="text-xs text-red-500">Ingresa un email válido.</span>
                            )}
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="contact-message">Mensaje</Label>
                            <Textarea id="contact-message" value={formMessage} onChange={(e) => setFormMessage(e.target.value)} placeholder="Escribe tu consulta para el propietario" rows={5} />
                            {!isValidMessage && formMessage.length > 0 && (
                              <span className="text-xs text-red-500">Al menos 10 caracteres.</span>
                            )}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => sendContact.mutate()}
                            disabled={!isValidName || !isValidEmail || !isValidMessage || sendContact.isPending}
                          >{sendContact.isPending ? 'Enviando…' : 'Enviar mensaje'}</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            
          </aside>
        </section>

        {isLoading && (
          <p className="max-w-7xl mx-auto px-4 mt-4 text-white/90">Cargando detalles…</p>
        )}
        {!isLoading && !boat && (
          <p className="max-w-7xl mx-auto px-4 mt-4 text-red-100">No se encontró el barco solicitado.</p>
        )}
        {isError && (
          <p className="max-w-7xl mx-auto px-4 mt-2 text-yellow-100">No se pudo conectar con la API. Mostrando datos de demostración si están disponibles.</p>
        )}
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default BoatDetails;
