import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MapPin, Users, Calendar as CalendarIcon, Euro } from "lucide-react";
import { getBoatById, checkBoatAvailability, createBooking, getBoatBlockedDates, updateUserAuthorized } from "@/stores/slices/basicSlice";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { useToast } from "@/components/ui/use-toast";
import heroImage from "@/assets/hero-yacht.jpg";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Boat {
  _id?: string;
  id?: string | number;
  name?: string;
  title?: string;
  description?: string;
  location?: any;
  city?: string;
  country?: string;
  price?: number;
  capacity?: number;
  photos?: string[];
  imageUrl?: string;
  image?: string;
  allowsFlexibleCancellation?: boolean;
  priceUnit?: 'day' | 'week';
}

type RentalType = 'boat_only' | 'with_captain' | 'owner_onboard';

const BookingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loading } = useCurrentUser();

  const { data } = useQuery({
    queryKey: ["boat", id],
    queryFn: () => (id ? getBoatById(id) : Promise.resolve(undefined as any)),
    enabled: !!id,
  });

  // Auth guard: if not logged in, send to login with redirect back here
  useEffect(() => {
    if (!loading && !user) {
      const redirect = `${location.pathname}${location.search}`;
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
    }
  }, [loading, user, location.pathname, location.search, navigate]);

  const { data: blockedData } = useQuery({
    queryKey: ["boat-blocked", id],
    queryFn: () => (id ? getBoatBlockedDates(id) : Promise.resolve({ blocked: [] } as any)),
    enabled: !!id,
    staleTime: 60_000,
  });

  // Condiciones de alquiler para conocer tipos de rental permitidos
  const { data: conditionsResp } = useQuery({
    queryKey: ["boat-conditions", id],
    queryFn: async () => {
      if (!id) return null as any;
      const res = await fetch(`/api/boats/${id}/conditions`);
      return res.json();
    },
    enabled: !!id,
  });

  const apiBoat = (data as any)?.data || (Array.isArray(data) ? data?.[0] : data);
  const boat: Boat | undefined = useMemo(() => {
    if (!id) return undefined;
    const idOf = (o: any) => o?._id ?? o?.id;
    const byApi = apiBoat as any;
    if (byApi && idOf(byApi)) return byApi as Boat;
    return undefined;
  }, [apiBoat, id]);

  const getImg = (b?: Boat) => b?.imageUrl || b?.image || b?.photos?.[0] || heroImage;
  const getName = (b?: Boat) => b?.name || b?.title || "Embarcación";
  const getLocation = (b?: Boat) => {
    const loc: any = b?.location as any;
    if (typeof loc === 'string') return loc;
    if (loc && typeof loc === 'object') {
      if (typeof loc.addressFormatted === 'string' && loc.addressFormatted.trim()) return loc.addressFormatted;
      if (typeof loc.formatted === 'string' && loc.formatted.trim()) return loc.formatted;
    }
    const cc = [b?.city, b?.country].filter(Boolean).join(', ');
    return cc || '-';
  };

  // Simple form state
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [guests, setGuests] = useState<number>(1);
  const [extras, setExtras] = useState<{ captain: boolean; fuel: boolean }>({ captain: false, fuel: false });
  const [rentalType, setRentalType] = useState<RentalType>('boat_only');
  const [flexible, setFlexible] = useState<boolean>(false);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [contactPhone, setContactPhone] = useState<string>("");
  // CV náutico
  const [sailingExperience, setSailingExperience] = useState<'none'|'basic'|'intermediate'|'advanced'>('none');
  const [motorExperience, setMotorExperience] = useState<'none'|'basic'|'intermediate'|'advanced'>('none');
  const [licenseType, setLicenseType] = useState<string>("");
  const [ownershipExperience, setOwnershipExperience] = useState<'none'|'rented_before'|'owned_before'>('none');
  const [additionalDescription, setAdditionalDescription] = useState<string>("");
  const [confirmAgree, setConfirmAgree] = useState<boolean>(false);
  const [saveCvToProfile, setSaveCvToProfile] = useState<boolean>(false);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const phoneValid = useMemo(() => {
    const v = contactPhone.trim();
    if (!v) return false;
    // validaciones simples: dígitos, espacios, + y guiones, mínimo 6 chars numéricos
    const basic = /^\+?[0-9\s-]{6,}$/;
    return basic.test(v);
  }, [contactPhone]);

  // Prefill teléfono si el usuario tiene phone verificado
  useEffect(() => {
    if (user?.phoneVerified && user?.phone && !contactPhone) {
      setContactPhone(user.phone);
    }
  }, [user]);

  // Prefill CV náutico desde el perfil
  useEffect(() => {
    if (user) {
      if (user.dniOrLicense && !licenseType) setLicenseType(user.dniOrLicense);
      if (user.experienceDeclaration && !additionalDescription) setAdditionalDescription(user.experienceDeclaration);
    }
    // no dependemos de licenseType/additionalDescription para evitar sobrescribir edición del usuario
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const hasChildren = useMemo(() => childrenCount > 0, [childrenCount]);

  // Mantener childrenCount dentro del límite cuando cambian los huéspedes
  useEffect(() => {
    if (childrenCount > guests) {
      setChildrenCount(guests);
    }
  }, [guests]);

  // Derivar tipos de rental permitidos desde condiciones (si existen y son válidos)
  const allowedRentalTypes = useMemo<undefined | RentalType[]>(() => {
    const raw = (conditionsResp as any)?.data?.allowedRentalTypes;
    const all: RentalType[] = ['boat_only', 'with_captain', 'owner_onboard'];
    if (Array.isArray(raw)) {
      const filtered = raw.filter((r: any) => all.includes(r)).slice(0, 3) as RentalType[];
      return filtered.length ? filtered : undefined;
    }
    return undefined;
  }, [conditionsResp]);

  // Asegurar que el rentalType actual esté permitido
  useEffect(() => {
    if (!allowedRentalTypes || allowedRentalTypes.length === 0) return;
    if (!allowedRentalTypes.includes(rentalType)) {
      setRentalType(allowedRentalTypes[0]);
    }
  }, [allowedRentalTypes]);

  // Prefill from URL params
  useEffect(() => {
    const s = searchParams.get('start');
    const e = searchParams.get('end');
    const g = searchParams.get('guests');
    const rt = searchParams.get('rentalType') as RentalType | null;
    const fx = searchParams.get('flexible');
    if (s) setStartDate(s);
    if (e) setEndDate(e);
    if (s && e) {
      const sd = new Date(s);
      const ed = new Date(e);
      if (!isNaN(sd as any) && !isNaN(ed as any)) setRange({ from: sd, to: ed });
    }
    if (g && !isNaN(Number(g))) setGuests(Math.max(1, Number(g)));
    if (rt && (rt === 'boat_only' || rt === 'with_captain' || rt === 'owner_onboard')) setRentalType(rt);
    if (fx === '1' || fx === 'true') setFlexible(true);
  }, [searchParams]);

  const nights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [startDate, endDate]);

  // Configurable service fee percentage via env (default 12%)
  const SERVICE_FEE_PCT = useMemo(() => {
    const raw = (import.meta as any)?.env?.VITE_SERVICE_FEE_PCT;
    const num = Number(raw);
    if (isFinite(num) && num >= 0 && num <= 1) return num;
    if (isFinite(num) && num > 1 && num < 100) return num / 100; // allow 12 -> 0.12
    return 0.12;
  }, []);

  const unit: 'day' | 'week' = (boat?.priceUnit === 'week') ? 'week' : 'day';
  const offersCaptain = !!((boat as any)?.extras?.captain?.enabled);
  const captainPrice = Number((boat as any)?.extras?.captain?.price ?? 0) || 0;
  const offersFuel = !!((boat as any)?.extras?.fuel?.enabled);
  const fuelPrice = Number((boat as any)?.extras?.fuel?.price ?? 0) || 0;
  const weeks = useMemo(() => unit === 'week' ? Math.max(0, Math.ceil((nights || 0) / 7)) : 0, [unit, nights]);
  const base = unit === 'week'
    ? (boat?.price || 0) * weeks
    : (boat?.price || 0) * (nights || 0);
  const extrasTotal = (offersCaptain && extras.captain ? captainPrice : 0) + (offersFuel && extras.fuel ? fuelPrice : 0);
  const rentalSurcharge = rentalType === 'with_captain' ? 200 : rentalType === 'owner_onboard' ? 150 : 0;
  const flexibleSurcharge = flexible ? Math.round(base * 0.1) : 0;
  const serviceFee = Math.round((base + extrasTotal + rentalSurcharge) * SERVICE_FEE_PCT);
  const total = base + extrasTotal + rentalSurcharge + serviceFee + flexibleSurcharge;

  const rentalTypeLabel = useMemo(() => {
    switch (rentalType) {
      case 'with_captain': return 'Con capitán';
      case 'owner_onboard': return 'Dueño a bordo';
      default: return 'Solo barco';
    }
  }, [rentalType]);

  const expLabel = useMemo(() => ({
    none: 'Ninguna',
    basic: 'Básica',
    intermediate: 'Intermedia',
    advanced: 'Avanzada',
  } as const), []);

  const ownershipLabel = useMemo(() => ({
    none: 'Sin experiencia',
    rented_before: 'He rentado antes',
    owned_before: 'He tenido barco propio',
  } as const), []);

  useEffect(() => {
    const name = getName(boat);
    document.title = `${name} | Reserva | boatbnb`;
  }, [boat]);

  // Check availability when dates change
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    const valid = id && nights > 0;
    if (!valid) {
      setIsAvailable(null);
      return;
    }
    (async () => {
      try {
        const res = await checkBoatAvailability(id!, startDate, endDate);
        if (active) setIsAvailable(res.available);
      } catch (e: any) {
        if (active) setIsAvailable(null);
      }
    })();
    return () => { active = false; };
  }, [id, startDate, endDate, nights]);

  // Calendar disabled days: past + blocked ranges
  const disabledDays = useMemo(() => {
    const today = new Date();
    const past = { before: new Date(today.getFullYear(), today.getMonth(), today.getDate()) } as const;
    const blocked = (blockedData?.blocked || []).map((r: any) => ({ from: new Date(r.startDate), to: new Date(r.endDate) }));
    return [past, ...blocked];
  }, [blockedData]);

  // When range changes, sync string dates
  useEffect(() => {
    if (range?.from && range?.to) {
      const sd = range.from;
      const ed = range.to;
      const toISO = (d: Date) => d.toISOString().slice(0,10);
      setStartDate(toISO(sd));
      setEndDate(toISO(ed));
    }
  }, [range]);

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Falta boatId');
      return createBooking({
        boatId: id,
        startDate,
        endDate,
        guests,
        extras,
        rentalType,
        flexibleCancellation: flexible,
        contactPhone,
        hasChildren,
        sailingExperience,
        motorExperience,
        licenseType,
        ownershipExperience,
        additionalDescription,
      });
    },
    onSuccess: (data: any) => {
      const booking = data?.booking || data?.data || data;
      const bookingId = booking?._id || booking?.id;
      const clientSecret = booking?.clientSecret || booking?.paymentIntentId;
      try { 
        if (booking) sessionStorage.setItem('lastBooking', JSON.stringify(booking)); 
      } catch {}
      toast({ title: 'Reserva creada', description: 'Redirigiendo al checkout…' });
      const q = new URLSearchParams();
      if (bookingId) q.set('bookingId', String(bookingId));
      if (clientSecret) q.set('clientSecret', String(clientSecret));
      navigate(`/checkout?${q.toString()}`);
    },
    onError: (err: any) => {
      const raw = (err?.message || '').toString();
      const l = raw.toLowerCase();
      if (l.includes('409') || l.includes('no disponibles') || l.includes('fechas no disponibles')) {
        toast({
          title: 'Fechas no disponibles',
          description: 'Parece que las fechas fueron tomadas recientemente. Elige otras fechas y vuelve a intentar.',
          variant: 'destructive'
        });
        // Marcar como no disponible y desplazar al calendario
        setIsAvailable(false);
        try { calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {}
        // Refrescar rangos bloqueados para que el calendario muestre la nueva indisponibilidad
        try { queryClient.invalidateQueries({ queryKey: ['boat-blocked', id] }); } catch {}
        return;
      }
      toast({ title: 'No se pudo crear la reserva', description: raw || 'Intenta nuevamente', variant: 'destructive' });
    }
  });

  const canSubmit = nights > 0 && isAvailable !== false && guests >= 1 && guests <= (boat?.capacity || Infinity) && phoneValid;

  return (
    <div className="relative min-h-screen isolate">
      {/* Background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none select-none bg-[#1d687f]"
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
            <Link to={`/barcos/${id}`} className="hover:underline">← Volver al barco</Link>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Reserva {getName(boat)}</h1>
          <p className="text-white/80 mt-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" /> {getLocation(boat)}
          </p>
        </header>

        <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-2 space-y-6">
            <Card variant="floating">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarIcon className="h-5 w-5" /> Fechas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div ref={calendarRef}>
                  <Calendar
                    mode="range"
                    numberOfMonths={2}
                    selected={range}
                    onSelect={setRange}
                    disabled={disabledDays as any}
                    fromDate={new Date()}
                    ISOWeek
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Entrada</Label>
                    <Input type="text" readOnly value={startDate || ''} placeholder="YYYY-MM-DD" />
                  </div>
                  <div className="space-y-2">
                    <Label>Salida</Label>
                    <Input type="text" readOnly value={endDate || ''} placeholder="YYYY-MM-DD" />
                  </div>
                  <div className="space-y-2">
                    <Label>Huéspedes</Label>
                    <Input type="number" min={1} max={boat?.capacity || 50} value={guests} onChange={(e)=> {
                      const cap = boat?.capacity || 50;
                      const val = Number(e.target.value);
                      if (isNaN(val)) return;
                      const clamped = Math.max(1, Math.min(val, cap));
                      setGuests(clamped);
                    }} />
                    <p className="text-xs text-muted-foreground">Capacidad máx.: {boat?.capacity || 50}</p>
                  </div>
                </div>
                {nights > 0 && (
                  <p className={`text-sm ${isAvailable === false ? 'text-red-500' : 'text-green-600'}`}>
                    {isAvailable === null && 'Comprobando disponibilidad…'}
                    {isAvailable === false && 'Las fechas seleccionadas no están disponibles.'}
                    {isAvailable === true && 'Fechas disponibles.'}
                  </p>
                )}
              </CardContent>
            </Card>
            {/* CV náutico */}
            <Card variant="floating">
              <CardHeader>
                <CardTitle>CV náutico</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <Label>Experiencia en vela</Label>
                  <Select value={sailingExperience} onValueChange={(v)=> setSailingExperience(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguna</SelectItem>
                      <SelectItem value="basic">Básica</SelectItem>
                      <SelectItem value="intermediate">Intermedia</SelectItem>
                      <SelectItem value="advanced">Avanzada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Experiencia en motor</Label>
                  <Select value={motorExperience} onValueChange={(v)=> setMotorExperience(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguna</SelectItem>
                      <SelectItem value="basic">Básica</SelectItem>
                      <SelectItem value="intermediate">Intermedia</SelectItem>
                      <SelectItem value="advanced">Avanzada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label>Tipo de licencia de navegación</Label>
                  <Input
                    type="text"
                    placeholder="Ej: PER, PNB, Yachtmaster..."
                    value={licenseType}
                    onChange={(e)=> setLicenseType(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Precargado desde tu perfil si informaste DNI/Licencia.</p>
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label>Experiencia rentando o con barco propio</Label>
                  <Select value={ownershipExperience} onValueChange={(v)=> setOwnershipExperience(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin experiencia</SelectItem>
                      <SelectItem value="rented_before">He rentado antes</SelectItem>
                      <SelectItem value="owned_before">He tenido barco propio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Descripción adicional</Label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Años navegando, zonas, condiciones, embarcaciones, títulos, etc."
                    rows={4}
                    value={additionalDescription}
                    onChange={(e)=> setAdditionalDescription(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            {/* Pasajeros y contacto */}
            <Card variant="floating">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Pasajeros y contacto</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2 md:col-span-1">
                  <Label>Cantidad de niños</Label>
                  <Input
                    type="number"
                    min={0}
                    max={guests}
                    value={childrenCount}
                    onChange={(e)=> {
                      const val = Number(e.target.value);
                      if (isNaN(val)) return;
                      const clamped = Math.max(0, Math.min(val, guests));
                      setChildrenCount(clamped);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Hasta {guests} según los pasajeros totales.</p>
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label>Teléfono de contacto *</Label>
                  <Input
                    type="tel"
                    placeholder="Ej: +34 600 123 456"
                    value={contactPhone}
                    onChange={(e)=> setContactPhone(e.target.value)}
                    required
                  />
                  {!phoneValid && contactPhone.length > 0 && (
                    <p className="text-xs text-red-500">Ingresa un teléfono válido (puede incluir +, espacios o guiones).</p>
                  )}
                  {(!contactPhone || !user?.phoneVerified) && (
                    <p className="text-xs text-muted-foreground">Si verificas tu teléfono en tu perfil se precargará automáticamente.</p>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* Tipo de rental y cancelación flexible (prefill desde URL) */}
            <Card variant="floating">
              <CardHeader>
                <CardTitle>Preferencias</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <Label>Tipo de rental</Label>
                  <Select value={rentalType} onValueChange={(v)=> setRentalType(v as RentalType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boat_only" disabled={!!allowedRentalTypes && !allowedRentalTypes.includes('boat_only')}>Solo barco</SelectItem>
                      <SelectItem value="with_captain" disabled={!!allowedRentalTypes && !allowedRentalTypes.includes('with_captain')}>Con capitán</SelectItem>
                      <SelectItem value="owner_onboard" disabled={!!allowedRentalTypes && !allowedRentalTypes.includes('owner_onboard')}>Dueño a bordo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {boat?.allowsFlexibleCancellation && (
                  <label className="flex items-center justify-between border rounded-md p-3">
                    <div className="text-sm">
                      <div className="font-medium">Cancelación flexible</div>
                      <div className="text-muted-foreground">Suplemento 10% del subtotal</div>
                    </div>
                    <input type="checkbox" checked={flexible} onChange={(e)=> setFlexible(e.target.checked)} />
                  </label>
                )}
              </CardContent>
            </Card>

            <Card variant="floating">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Servicios adicionales</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offersCaptain && (
                  <label className="flex items-center justify-between border rounded-lg p-3">
                    <div className="text-sm">
                      <div className="font-medium">Capitán incluido</div>
                      <div className="text-muted-foreground">+{captainPrice}€ por reserva</div>
                    </div>
                    <input type="checkbox" checked={extras.captain} onChange={(e)=> setExtras(s => ({...s, captain: e.target.checked}))} />
                  </label>
                )}
                {offersFuel && (
                  <label className="flex items-center justify-between border rounded-lg p-3">
                    <div className="text-sm">
                      <div className="font-medium">Combustible incluido</div>
                      <div className="text-muted-foreground">+{fuelPrice}€ por reserva</div>
                    </div>
                    <input type="checkbox" checked={extras.fuel} onChange={(e)=> setExtras(s => ({...s, fuel: e.target.checked}))} />
                  </label>
                )}
                {!offersCaptain && !offersFuel && (
                  <div className="text-sm text-muted-foreground">Este barco no ofrece servicios adicionales.</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resumen */}
          <aside>
            <Card variant="floating">
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {/* Detalles seleccionados */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-muted-foreground">Entrada</div>
                    <div className="font-medium">{startDate || '—'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Salida</div>
                    <div className="font-medium">{endDate || '—'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Tipo de rental</div>
                    <div className="font-medium">{rentalTypeLabel}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Cancelación flexible</div>
                    <div className="font-medium">{flexible ? 'Sí' : 'No'}</div>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Precio base</span>
                  <span className="flex items-center gap-1"><Euro className="h-4 w-4" /> {boat?.price ?? 0} / {unit === 'week' ? 'semana' : 'día'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{unit === 'week' ? 'Semanas facturadas' : 'Noches'}</span>
                  <span>{unit === 'week' ? weeks : nights}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pasajeros</span>
                  <span>{guests}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Niños</span>
                  <span>{hasChildren ? 'Sí' : 'No'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Teléfono</span>
                  <span>{contactPhone || '—'}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">€{base.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Extras</span>
                  <span className="font-medium">€{extrasTotal.toFixed(2)}</span>
                </div>
                {rentalSurcharge > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Tipo de rental</span>
                    <span className="font-medium">€{rentalSurcharge.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Cargos de servicio</span>
                  <span className="font-medium">€{serviceFee.toFixed(2)}</span>
                </div>
                {flexible && (
                  <div className="flex items-center justify-between">
                    <span>Cancelación flexible</span>
                    <span className="font-medium">€{flexibleSurcharge.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                {/* CV náutico */}
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">CV náutico</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-muted-foreground">Vela</div>
                      <div className="font-medium">{expLabel[sailingExperience]}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Motor</div>
                      <div className="font-medium">{expLabel[motorExperience]}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Licencia</div>
                      <div className="font-medium">{licenseType || '—'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Experiencia</div>
                      <div className="font-medium">{ownershipLabel[ownershipExperience]}</div>
                    </div>
                    {additionalDescription && (
                      <div className="col-span-2">
                        <div className="text-muted-foreground">Descripción</div>
                        <div className="font-medium whitespace-pre-wrap">{additionalDescription}</div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Guardar en perfil */}
                <div className="mt-2 flex items-start gap-2 border rounded-md p-3">
                  <input id="saveCv" type="checkbox" className="mt-1" checked={saveCvToProfile} onChange={(e)=> setSaveCvToProfile(e.target.checked)} />
                  <label htmlFor="saveCv" className="text-xs">
                    Guardar estos datos del CV en mi perfil (licencia y descripción) para futuras reservas.
                  </label>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-base">
                  <span>Total</span>
                  <span className="font-bold">€{total.toFixed(2)}</span>
                </div>
                <div className="text-xs text-muted-foreground">Incluye cargos y suplementos según selección.</div>
                {/* Confirmación final */}
                <div className="mt-3 flex items-start gap-2 border rounded-md p-3">
                  <input id="confirmAgree" type="checkbox" className="mt-1" checked={confirmAgree} onChange={(e)=> setConfirmAgree(e.target.checked)} />
                  <label htmlFor="confirmAgree" className="text-xs">
                    Confirmo que he leído y acepto la información de la reserva y deseo continuar al pago.
                  </label>
                </div>
                <div className="mt-4">
                  <Button className="w-full bg-gradient-ocean" disabled={!canSubmit || !confirmAgree || createBookingMutation.isPending}
                    onClick={()=> {
                      if (!startDate || !endDate) {
                        toast({ title: 'Completa las fechas', variant: 'destructive' });
                        return;
                      }
                      if (nights <= 0) {
                        toast({ title: 'Rango de fechas inválido', variant: 'destructive' });
                        return;
                      }
                      if (guests < 1 || guests > (boat?.capacity || 0)) {
                        toast({ title: 'Número de huéspedes inválido', variant: 'destructive' });
                        return;
                      }
                      if (!phoneValid) {
                        toast({ title: 'Teléfono de contacto inválido', description: 'Revisa el formato del teléfono', variant: 'destructive' });
                        return;
                      }
                      if (!confirmAgree) {
                        toast({ title: 'Confirma la información', description: 'Debes aceptar la revisión para continuar', variant: 'destructive' });
                        return;
                      }
                      // Requiere autenticación antes de crear la reserva
                      const isLoggedIn = !!user?._id;
                      if (!isLoggedIn) {
                        toast({ title: 'Inicia sesión para reservar', description: 'Necesitas una cuenta para continuar con el checkout.' });
                        const returnUrl = `${location.pathname}${location.search || ''}`;
                        navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
                        return;
                      }
                      // Guardar CV en el perfil (no bloquea la reserva)
                      try {
                        if (saveCvToProfile && user?._id) {
                          updateUserAuthorized(user._id, {
                            dniOrLicense: licenseType || undefined,
                            experienceDeclaration: additionalDescription || undefined,
                          })
                          .then(() => toast({ title: 'Perfil actualizado', description: 'CV guardado para futuras reservas' }))
                          .catch(() => toast({ title: 'No se pudo actualizar el perfil', description: 'Continuamos con la reserva', variant: 'default' }));
                        }
                      } catch {}
                      createBookingMutation.mutate();
                    }}
                  >{createBookingMutation.isPending ? 'Creando reserva…' : 'Confirmar y continuar al pago'}</Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </section>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default BookingPage;
