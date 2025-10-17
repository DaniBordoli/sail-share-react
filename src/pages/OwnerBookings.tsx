import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listOwnerBookings, updateBookingStatus, getUserById } from "@/stores/slices/basicSlice";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

export default function OwnerBookings() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["ownerBookings"],
    queryFn: listOwnerBookings,
  });

  const items = data?.items ?? [];

  const mutation = useMutation({
    mutationFn: async (vars: { id: string; status: "confirmed" | "cancelled" }) => {
      return updateBookingStatus(vars.id, vars.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ownerBookings"] });
    },
  });

  const onAction = (id: string, status: "confirmed" | "cancelled") => {
    mutation.mutate({ id, status });
  };

  // Modal de detalle
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => items.find((i: any) => i._id === selectedId), [items, selectedId]);

  const [renter, setRenter] = useState<any | null>(null);
  const [renterLoading, setRenterLoading] = useState(false);
  const [renterErr, setRenterErr] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function loadRenter(uid: string) {
      try {
        setRenterLoading(true);
        setRenterErr(null);
        const data = await getUserById(uid);
        if (!cancelled) setRenter(data?.data || data);
      } catch (e: any) {
        if (!cancelled) setRenterErr(e?.message || 'No se pudo cargar el usuario');
      } finally {
        if (!cancelled) setRenterLoading(false);
      }
    }
    if (open && selected?.renterId) {
      loadRenter(selected.renterId);
    } else {
      setRenter(null);
      setRenterErr(null);
      setRenterLoading(false);
    }
    return () => { cancelled = true; };
  }, [open, selected?.renterId]);

  // Cargar/guardar notas internas en localStorage por reserva
  useEffect(() => {
    if (open && selected?._id) {
      const key = `ownerBookingNotes:${selected._id}`;
      const saved = localStorage.getItem(key);
      setNotes(saved || "");
    } else {
      setNotes("");
    }
  }, [open, selected?._id]);

  const saveNotes = () => {
    if (!selected?._id) return;
    const key = `ownerBookingNotes:${selected._id}`;
    localStorage.setItem(key, notes);
  };

  const copy = async (text?: string) => {
    if (!text) return;
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      {/* Hero con gradiente (mismo estilo que AdminPanel/MyBookings) */}
      <div className="pt-20 pb-8 bg-gradient-ocean">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Reservas de mis barcos</h1>
          <p className="text-white/90 text-sm">Gestiona y consulta las reservas de tus embarcaciones</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Listado</h2>
          <button onClick={() => refetch()} className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">
            Refrescar
          </button>
        </div>

        {isLoading && <div>Cargando reservas…</div>}
        {isError && (
          <div className="text-red-600">Error: {(error as Error)?.message || "No se pudieron cargar las reservas"}</div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <div className="text-sm text-muted-foreground">No hay reservas para tus barcos aún.</div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {items.map((bk: any) => (
            <div key={bk._id} className="rounded-md border bg-white p-4 shadow-sm">
              <div className="flex items-start gap-4">
                {/* Foto del barco */}
                <div className="w-24 h-24 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                  {bk?.boat?.photos?.[0] ? (
                    <img src={bk.boat.photos[0]} alt={bk?.boat?.name || "Barco"} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-500">Sin foto</span>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-semibold">{bk?.boat?.name || "Barco"}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(bk.startDate)} → {formatDate(bk.endDate)} • {bk.guests} huésped(es)
                      </div>
                      <div className="text-sm">
                        Estado: <span className="font-medium">{bk.status}</span>
                      </div>
                      {/* Contacto y CV náutico (resumen) */}
                      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                        <div>
                          Tel.: <span className="text-foreground">{bk.contactPhone || '—'}</span>
                          {" "}• Niños: <span className="text-foreground">{bk.hasChildren ? 'Sí' : 'No'}</span>
                        </div>
                        <div>
                          Vela: <span className="text-foreground">{bk.sailingExperience || '—'}</span>
                          {" "}• Motor: <span className="text-foreground">{bk.motorExperience || '—'}</span>
                          {" "}• Licencia: <span className="text-foreground">{bk.licenseType || '—'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Total</div>
                      <div className="text-lg font-bold">
                        {bk.totalAmount?.toFixed?.(2) ?? bk.totalAmount} {bk.currency || "EUR"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {bk?.boat?._id && (
                      <Link
                        to={`/barcos/${bk.boat._id}`}
                        className="px-3 py-1 rounded border text-sm hover:bg-gray-50"
                      >
                        Ver barco
                      </Link>
                    )}
                    <button
                      onClick={() => { setSelectedId(bk._id); setOpen(true); }}
                      className="px-3 py-1 rounded border text-sm hover:bg-gray-50"
                    >
                      Ver detalle
                    </button>
                    <Link
                      to={`/barcos/${bk.boat?._id || bk.boatId}/reservar`}
                      className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                    >
                      Reservar de nuevo
                    </Link>
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        disabled={mutation.isPending || bk.status === "confirmed"}
                        onClick={() => onAction(bk._id, "confirmed")}
                        className="px-3 py-1 rounded bg-emerald-600 text-white text-sm disabled:opacity-50 hover:bg-emerald-700"
                      >
                        {mutation.isPending ? "Guardando..." : "Confirmar"}
                      </button>
                      <button
                        disabled={mutation.isPending || bk.status === "cancelled"}
                        onClick={() => onAction(bk._id, "cancelled")}
                        className="px-3 py-1 rounded bg-rose-600 text-white text-sm disabled:opacity-50 hover:bg-rose-700"
                      >
                        {mutation.isPending ? "Guardando..." : "Cancelar"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de detalle de reserva */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); setSelectedId(null); } }}>
       
        <DialogContent className="max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Detalle de la reserva</DialogTitle>
            <DialogDescription>Información completa de la reserva seleccionada</DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                  {selected?.boat?.photos?.[0] ? (
                    <img src={selected.boat.photos[0]} alt={selected?.boat?.name || 'Barco'} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-500">Sin foto</span>
                  )}
                </div>
                <div>
                  <div className="font-semibold">{selected?.boat?.name || 'Barco'}</div>
                  <div className="text-sm text-muted-foreground">ID reserva: {selected._id}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground">Desde</div>
                  <div className="font-medium">{formatDate(selected.startDate)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Hasta</div>
                  <div className="font-medium">{formatDate(selected.endDate)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Huéspedes</div>
                  <div className="font-medium">{selected.guests}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Estado</div>
                  <div className="font-medium">{selected.status}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Extras</div>
                  <div className="font-medium">{selected?.extras?.captain ? 'Capitán' : 'Sin capitán'}{selected?.extras?.fuel ? ' + Combustible' : ''}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total</div>
                  <div className="font-medium">{selected.totalAmount?.toFixed?.(2) ?? selected.totalAmount} {selected.currency || 'EUR'}</div>
                </div>
                {/* Contacto y CV náutico */}
                <div className="col-span-2 border-t pt-2" />
                <div>
                  <div className="text-muted-foreground">Teléfono de contacto</div>
                  <div className="font-medium">{selected.contactPhone || '—'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Niños</div>
                  <div className="font-medium">{selected.hasChildren ? 'Sí' : 'No'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Experiencia en vela</div>
                  <div className="font-medium">{selected.sailingExperience || '—'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Experiencia en motor</div>
                  <div className="font-medium">{selected.motorExperience || '—'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Licencia</div>
                  <div className="font-medium">{selected.licenseType || '—'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Experiencia (renta/propio)</div>
                  <div className="font-medium">{selected.ownershipExperience || '—'}</div>
                </div>
                {selected.additionalDescription && (
                  <div className="col-span-2">
                    <div className="text-muted-foreground">Descripción adicional</div>
                    <div className="font-medium whitespace-pre-wrap">{selected.additionalDescription}</div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t">
                <div className="text-sm font-semibold mb-1">Arrendatario</div>
                {!selected.renterId && (
                  <div className="text-sm text-muted-foreground">Sin datos de arrendatario</div>
                )}
                {selected.renterId && renterLoading && (
                  <div className="text-sm text-muted-foreground">Cargando datos…</div>
                )}
                {selected.renterId && renterErr && (
                  <div className="text-sm text-red-600">{renterErr}</div>
                )}
                {selected.renterId && renter && (
                  <div className="text-sm space-y-1">
                    <div><span className="text-muted-foreground">Nombre:</span> {renter.firstName} {renter.lastName}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Email:</span>
                      <a className="underline" href={`mailto:${renter.email}`}>{renter.email}</a>
                      <button onClick={() => copy(renter.email)} className="px-2 py-0.5 text-xs border rounded">Copiar</button>
                    </div>
                    {renter.phone && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Teléfono:</span>
                        <a className="underline" href={`tel:${renter.phone}`}>{renter.phone}</a>
                        <button onClick={() => copy(renter.phone)} className="px-2 py-0.5 text-xs border rounded">Copiar</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Información de pago */}
              <div className="pt-2 border-t">
                <div className="text-sm font-semibold mb-1">Pago</div>
                <div className="text-sm grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-muted-foreground">Estado</div>
                    <div className="font-medium">{selected.status === 'pending_payment' ? 'Pendiente de pago' : selected.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-muted-foreground">Payment Intent ID</div>
                    <div className="font-mono text-xs break-all">{selected.paymentIntentId || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Notas internas (localStorage) */}
              <div className="pt-2 border-t space-y-2">
                <div className="text-sm font-semibold">Notas internas</div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Escribe notas visibles solo para ti (guardado local)"
                  className="w-full min-h-[80px] p-2 border rounded text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={saveNotes} className="px-3 py-1 rounded border text-sm hover:bg-gray-50">Guardar notas</button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  disabled={mutation.isPending || selected.status === 'confirmed'}
                  onClick={() => onAction(selected._id, 'confirmed')}
                  className="px-3 py-1 rounded bg-emerald-600 text-white text-sm disabled:opacity-50 hover:bg-emerald-700"
                >
                  Confirmar
                </button>
                <button
                  disabled={mutation.isPending || selected.status === 'cancelled'}
                  onClick={() => onAction(selected._id, 'cancelled')}
                  className="px-3 py-1 rounded bg-rose-600 text-white text-sm disabled:opacity-50 hover:bg-rose-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No hay reserva seleccionada</div>
          )}
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}
