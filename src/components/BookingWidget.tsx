import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarIcon, Euro } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { useNavigate } from "react-router-dom";
import { getBoatBlockedDates } from "@/stores/slices/basicSlice";

export type RentalType = 'boat_only' | 'with_captain' | 'owner_onboard';

type Props = {
  boatId: string;
  pricePerDay?: number;
  capacity?: number;
  allowsFlexibleCancellation?: boolean;
  allowedRentalTypes?: RentalType[]; // si se provee, deshabilita los no permitidos
  priceUnit?: 'day' | 'week';
};

export const BookingWidget = ({ boatId, pricePerDay = 0, capacity = 50, allowsFlexibleCancellation = false, allowedRentalTypes, priceUnit = 'day' }: Props) => {
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [guests, setGuests] = useState(1);
  const [rentalType, setRentalType] = useState<RentalType>('boat_only');
  const [flexible, setFlexible] = useState<boolean>(false);

  // Asegurar que rentalType siempre sea uno permitido si se provee la lista
  useEffect(() => {
    if (!allowedRentalTypes || allowedRentalTypes.length === 0) return;
    if (!allowedRentalTypes.includes(rentalType)) {
      setRentalType(allowedRentalTypes[0]);
    }
  }, [allowedRentalTypes]);

  // Fechas bloqueadas para deshabilitar en el calendario
  const { data: blockedData } = useQuery({
    queryKey: ["boat-blocked", boatId],
    queryFn: () => getBoatBlockedDates(boatId),
  });

  const nights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [startDate, endDate]);
  // Configurar cargo de servicio desde env (por defecto 12%)
  const SERVICE_FEE_PCT = useMemo(() => {
    const raw = (import.meta as any)?.env?.VITE_SERVICE_FEE_PCT;
    const num = Number(raw);
    if (isFinite(num) && num >= 0 && num <= 1) return num;
    if (isFinite(num) && num > 1 && num < 100) return num / 100;
    return 0.12;
  }, []);

  const unit: 'day' | 'week' = priceUnit === 'week' ? 'week' : 'day';
  const weeks = useMemo(() => unit === 'week' ? Math.max(0, Math.ceil((nights || 0) / 7)) : 0, [unit, nights]);
  const base = unit === 'week'
    ? (pricePerDay || 0) * weeks
    : (pricePerDay || 0) * (nights || 0);
  const rentalSurcharge = rentalType === 'with_captain' ? 200 : rentalType === 'owner_onboard' ? 150 : 0;
  const flexibleSurcharge = flexible ? Math.round(base * 0.1) : 0; // 10% si flexible
  const serviceFee = Math.round((base + rentalSurcharge) * SERVICE_FEE_PCT);
  const total = base + rentalSurcharge + serviceFee + flexibleSurcharge;

  const canContinue = nights > 0 && guests >= 1 && guests <= capacity;

  // Sync text dates when range changes
  useEffect(() => {
    if (range?.from && range?.to) {
      const toISO = (d: Date) => d.toISOString().slice(0,10);
      setStartDate(toISO(range.from));
      setEndDate(toISO(range.to));
    }
  }, [range]);

  return (
    <Card variant="floating" className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarIcon className="h-5 w-5" /> Reserva</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={range}
            onSelect={setRange}
            fromDate={new Date()}
            disabled={useMemo(() => {
              const today = new Date();
              const past = { before: new Date(today.getFullYear(), today.getMonth(), today.getDate()) } as const;
              const blocked = (blockedData?.blocked || []).map((r: any) => ({ from: new Date(r.startDate), to: new Date(r.endDate) }));
              return [past, ...blocked];
            }, [blockedData]) as any}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Entrada</Label>
            <Input type="text" readOnly value={startDate} placeholder="YYYY-MM-DD" />
          </div>
          <div className="space-y-2">
            <Label>Salida</Label>
            <Input type="text" readOnly value={endDate} placeholder="YYYY-MM-DD" />
          </div>
          <div className="space-y-2">
            <Label>Huéspedes</Label>
            <Input type="number" min={1} max={capacity} value={guests} onChange={(e)=> setGuests(Number(e.target.value))} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tipo de rental</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <label className={`flex items-center gap-2 border rounded-md p-2 ${allowedRentalTypes && !allowedRentalTypes.includes('boat_only') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input type="radio" name="rentalType" disabled={!!allowedRentalTypes && !allowedRentalTypes.includes('boat_only')} checked={rentalType==='boat_only'} onChange={()=> setRentalType('boat_only')} />
              <span>Solo barco</span>
            </label>
            <label className={`flex items-center gap-2 border rounded-md p-2 ${allowedRentalTypes && !allowedRentalTypes.includes('with_captain') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input type="radio" name="rentalType" disabled={!!allowedRentalTypes && !allowedRentalTypes.includes('with_captain')} checked={rentalType==='with_captain'} onChange={()=> setRentalType('with_captain')} />
              <span>Con capitán</span>
            </label>
            <label className={`flex items-center gap-2 border rounded-md p-2 ${allowedRentalTypes && !allowedRentalTypes.includes('owner_onboard') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input type="radio" name="rentalType" disabled={!!allowedRentalTypes && !allowedRentalTypes.includes('owner_onboard')} checked={rentalType==='owner_onboard'} onChange={()=> setRentalType('owner_onboard')} />
              <span>Dueño a bordo</span>
            </label>
          </div>
        </div>

        {allowsFlexibleCancellation && (
          <label className="flex items-center justify-between border rounded-md p-2">
            <div>
              <div className="font-medium">Cancelación flexible</div>
              <div className="text-muted-foreground text-xs">Suplemento 10% del subtotal</div>
            </div>
            <input type="checkbox" checked={flexible} onChange={(e)=> setFlexible(e.target.checked)} />
          </label>
        )}

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Precio base</span>
            <span className="flex items-center gap-1"><Euro className="h-4 w-4" /> {pricePerDay ?? 0} / {unit === 'week' ? 'semana' : 'día'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{unit === 'week' ? 'Semanas facturadas' : 'Noches'}</span>
            <span>{unit === 'week' ? weeks : nights}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span className="font-medium">€{base.toFixed(2)}</span>
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
          <div className="flex items-center justify-between text-base">
            <span>Total</span>
            <span className="font-bold">€{total.toFixed(2)}</span>
          </div>
        </div>

        <Button className="w-full bg-gradient-ocean" disabled={!canContinue} onClick={()=> {
          const q = new URLSearchParams();
          if (startDate) q.set('start', startDate);
          if (endDate) q.set('end', endDate);
          q.set('guests', String(guests));
          q.set('rentalType', rentalType);
          if (allowsFlexibleCancellation && flexible) q.set('flexible', '1');
          navigate(`/barcos/${boatId}/reservar?${q.toString()}`);
        }}>Reservar</Button>
      </CardContent>
    </Card>
  );
};
