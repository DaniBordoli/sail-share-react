import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getLicenseRequests, approveLicenseRequest, rejectLicenseRequest, type LicenseRequest, adminListBoats, adminApproveBoat, adminRejectBoat, type AdminBoat } from "@/stores/slices/basicSlice";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { toast } from "sonner";

const AdminPanel = () => {
  const { user, loading } = useCurrentUser();
  const [requests, setRequests] = useState<LicenseRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  // Boats moderation
  const [boats, setBoats] = useState<AdminBoat[]>([]);
  const [ownerQuery, setOwnerQuery] = useState("");
  const [boatsRefreshing, setBoatsRefreshing] = useState(false);
  const [boatActingId, setBoatActingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending_review');
  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading] = useState(false);
  const [previewBoat, setPreviewBoat] = useState<AdminBoat | null>(null);
  // Reject modal state
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const refresh = async () => {
    try {
      setRefreshing(true);
      console.groupCollapsed('[admin][front] refresh license requests');
      const data = await getLicenseRequests();
      console.debug('[admin][front] fetched count:', Array.isArray(data) ? data.length : 'n/a');
      console.debug('[admin][front] sample item:', Array.isArray(data) && data[0] ? data[0] : null);
      setRequests(data);
    } catch (e: any) {
      console.error('[admin][front] fetch error:', e);
      toast.error(e?.message || "No se pudieron cargar las solicitudes");
    } finally {
      console.groupEnd();
      setRefreshing(false);
    }
  };

  const openPreview = (boat: AdminBoat) => {
    setPreviewBoat(boat);
    setPreviewOpen(true);
  };

  const refreshBoats = async () => {
    try {
      setBoatsRefreshing(true);
      console.groupCollapsed('[admin][front] refresh boats');
      const res = await adminListBoats({ status: statusFilter, limit: 50 });
      console.debug('[admin][front] boats count:', Array.isArray(res?.data) ? res.data.length : 'n/a');
      setBoats(res?.data || []);
    } catch (e:any) {
      console.error('[admin][front] boats fetch error:', e);
      toast.error(e?.message || 'No se pudieron cargar los barcos');
    } finally {
      console.groupEnd();
      setBoatsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      refresh();
      refreshBoats();
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      refreshBoats();
    }
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <div className="text-xl font-semibold">No autorizado</div>
          <div className="text-sm text-muted-foreground">Debes ser administrador para ver este panel.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      {/* Hero con gradiente */}
      <div className="pt-20 pb-8 bg-gradient-ocean">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Panel de Administración</h1>
          <p className="text-white/90 text-sm">Revisa y modera las solicitudes de validación de licencias.</p>
        </div>
      </div>
      <main className="pt-6 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="licenses" className="space-y-6">
            <TabsList>
              <TabsTrigger value="licenses" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Solicitudes de licencias</TabsTrigger>
              <TabsTrigger value="boats" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Revisión de barcos</TabsTrigger>
            </TabsList>

            <TabsContent value="licenses" className="space-y-6">
              <div className="flex items-center justify-end">
                <Button variant="outline" onClick={refresh} disabled={refreshing}>{refreshing ? 'Actualizando...' : 'Actualizar'}</Button>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Solicitudes de validación de licencias</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {requests.length === 0 && (
                    <div className="text-sm text-muted-foreground">No hay solicitudes pendientes.</div>
                  )}
                  {requests.map((r) => (
                    <div key={r._id} className="flex flex-col md:flex-row md:items-center gap-3 justify-between border rounded-lg p-3">
                      <div className="space-y-1">
                        <div className="font-medium">{[r.firstName, r.lastName].filter(Boolean).join(' ') || r.email || r._id}</div>
                        <div className="text-sm text-muted-foreground">Estado: {r.licenseStatus}</div>
                        {(() => {
                          const url = r.licenseUrl || '';
                          const isPdfExt = /\.pdf(\?|$)/i.test(url);
                          const safeUrl = isPdfExt ? url.replace('/image/upload/', '/raw/upload/') : url;
                          return safeUrl ? (
                            <Button variant="secondary" size="sm" asChild>
                              <a href={safeUrl} target="_blank" rel="noreferrer" download>
                                <Download className="h-4 w-4 mr-1" /> Descargar documento
                              </a>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin documento</span>
                          );
                        })()}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          disabled={actingId === r._id}
                          onClick={async ()=>{
                            try {
                              setActingId(r._id);
                              console.groupCollapsed('[admin][front] approve request');
                              const res = await approveLicenseRequest(r._id);
                              console.debug('[admin][front] approve result:', res);
                              toast.success('Aprobado');
                              await refresh();
                            } catch (e:any) {
                              console.error('[admin][front] approve error:', e);
                              toast.error(e?.message || 'Error aprobando');
                            } finally {
                              console.groupEnd();
                              setActingId(null);
                            }
                          }}
                        >Aprobar</Button>
                        <Button
                          variant="destructive"
                          disabled={actingId === r._id}
                          onClick={async ()=>{
                            try {
                              setActingId(r._id);
                              console.groupCollapsed('[admin][front] reject request');
                              const res = await rejectLicenseRequest(r._id);
                              console.debug('[admin][front] reject result:', res);
                              toast.success('Rechazado');
                              await refresh();
                            } catch (e:any) {
                              console.error('[admin][front] reject error:', e);
                              toast.error(e?.message || 'Error rechazando');
                            } finally {
                              console.groupEnd();
                              setActingId(null);
                            }
                          }}
                        >Rechazar</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="boats" className="space-y-6">
              <div className="flex items-center justify-end">
                <Button variant="outline" onClick={refreshBoats} disabled={boatsRefreshing}>{boatsRefreshing ? 'Actualizando...' : 'Actualizar'}</Button>
              </div>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <CardTitle>Revisión de barcos</CardTitle>
                    <div className="flex items-center gap-2">
                      <select
                        className="border rounded px-2 py-1 text-sm bg-background"
                        value={statusFilter}
                        onChange={(e)=> setStatusFilter(e.target.value)}
                      >
                        <option value="pending_review">En revisión</option>
                        <option value="draft">Borrador</option>
                        <option value="approved">Aprobado</option>
                        <option value="rejected">Rechazado</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Filtrar por propietario (nombre/email)"
                        className="border rounded px-2 py-1 text-sm bg-background"
                        value={ownerQuery}
                        onChange={(e)=> setOwnerQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {boats.length === 0 && (
                    <div className="text-sm text-muted-foreground">No hay barcos para el filtro seleccionado.</div>
                  )}
                  {(boats.filter(b=>{
                      if (!ownerQuery.trim()) return true;
                      const q = ownerQuery.toLowerCase();
                      return (
                        (b.ownerName && b.ownerName.toLowerCase().includes(q)) ||
                        (b.ownerEmail && b.ownerEmail.toLowerCase().includes(q)) ||
                        String(b.ownerId || '').toLowerCase().includes(q)
                      );
                    })).map((b)=> (
                    <div key={b._id} className="flex flex-col md:flex-row md:items-center gap-3 justify-between border rounded-lg p-3">
                      <div className="space-y-1 min-w-0">
                        <div className="font-medium truncate">{b.name} <span className="text-xs text-muted-foreground">({b._id})</span></div>
                        {(b.ownerName || b.ownerEmail || b.ownerId) && (
                          <div className="text-xs text-muted-foreground truncate">
                            Propietario: {b.ownerName || b.ownerEmail || b.ownerId}
                            {b.ownerEmail && b.ownerName ? (
                              <span> ({b.ownerEmail})</span>
                            ) : null}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground truncate">Estado: {b.status} • Activo: {b.isActive ? 'sí' : 'no'}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openPreview(b)}>Ver</Button>
                        <Button
                          variant="secondary"
                          disabled={boatActingId === b._id}
                          onClick={async ()=>{
                            try {
                              setBoatActingId(b._id);
                              console.groupCollapsed('[admin][front] approve boat');
                              const res = await adminApproveBoat(b._id);
                              console.debug('[admin][front] approve result:', res);
                              toast.success('Barco aprobado');
                              await refreshBoats();
                            } catch (e:any) {
                              console.error('[admin][front] approve error:', e);
                              toast.error(e?.message || 'Error aprobando barco');
                            } finally {
                              console.groupEnd();
                              setBoatActingId(null);
                            }
                          }}
                        >Aprobar</Button>
                        <Button
                          variant="destructive"
                          onClick={()=>{ setRejectTargetId(b._id); setRejectNotes(""); setRejectOpen(true); }}
                        >Rechazar</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto my-6">
          <DialogHeader>
            <DialogTitle>Vista previa del barco</DialogTitle>
          </DialogHeader>
          {previewLoading && (
            <div className="p-6 text-sm text-muted-foreground">Cargando...</div>
          )}
          {!previewLoading && previewBoat && (
            <div className="space-y-4">
              {/* Fotos */}
              {Array.isArray(previewBoat.photos) && previewBoat.photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {previewBoat.photos.slice(0,6).map((url: string, idx: number) => (
                    <img key={idx} src={url} alt={`foto-${idx}`} className="w-full h-32 object-cover rounded" />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Sin fotos</div>
              )}
              {/* Datos principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Nombre:</span> {previewBoat.name}</div>
                <div><span className="text-muted-foreground">Estado:</span> {previewBoat.status}</div>
                {(previewBoat.ownerName || previewBoat.ownerEmail || previewBoat.ownerId) && (
                  <div>
                    <span className="text-muted-foreground">Propietario:</span>{' '}
                    {previewBoat.ownerName || previewBoat.ownerEmail || previewBoat.ownerId}
                    {previewBoat.ownerEmail && previewBoat.ownerName ? (
                      <span> ({previewBoat.ownerEmail})</span>
                    ) : null}
                  </div>
                )}
                <div><span className="text-muted-foreground">Tipo:</span> {previewBoat.boatType}</div>
                <div><span className="text-muted-foreground">Marca/Modelo:</span> {previewBoat.brand} {previewBoat.model}</div>
                <div><span className="text-muted-foreground">Zona:</span> {previewBoat.area}</div>
                <div><span className="text-muted-foreground">Precio:</span> €{previewBoat.price} / {previewBoat.priceUnit === 'day' ? 'día' : 'semana'}</div>
                <div><span className="text-muted-foreground">Capacidad:</span> {previewBoat.capacity || '-'}</div>
                <div><span className="text-muted-foreground">Eslora:</span> {previewBoat.length || '-'}</div>
              </div>
              {previewBoat.description && (
                <div className="text-sm whitespace-pre-wrap"><span className="text-muted-foreground">Descripción:</span> {previewBoat.description}</div>
              )}
              {previewBoat.status === 'rejected' && previewBoat.reviewNotes && (
                <div className="text-sm whitespace-pre-wrap border rounded-md p-3 bg-destructive/5 border-destructive">
                  <div className="font-medium text-destructive mb-1">Motivo de rechazo</div>
                  <div>{previewBoat.reviewNotes}</div>
                  {previewBoat.reviewedAt && (
                    <div className="text-xs text-muted-foreground mt-1">Revisado: {new Date(previewBoat.reviewedAt).toLocaleString()}</div>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  onClick={async ()=>{
                    try {
                      setBoatActingId(previewBoat._id);
                      const res = await adminApproveBoat(previewBoat._id);
                      console.debug('[admin][front] approve (from preview) result:', res);
                      toast.success('Barco aprobado');
                      await refreshBoats();
                      setPreviewOpen(false);
                    } catch(e:any) {
                      toast.error(e?.message || 'Error aprobando barco');
                    } finally {
                      setBoatActingId(null);
                    }
                  }}
                >Aprobar</Button>
                <Button
                  variant="destructive"
                  onClick={()=>{ setRejectTargetId(previewBoat._id); setRejectNotes(""); setRejectOpen(true); }}
                >Rechazar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject dialog with notes */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rechazar barco</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Opcional: indica el motivo del rechazo para el propietario.</p>
            <Textarea
              placeholder="Motivo del rechazo..."
              value={rejectNotes}
              onChange={(e)=> setRejectNotes(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=> setRejectOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={rejecting || !rejectTargetId}
              onClick={async ()=>{
                if (!rejectTargetId) return;
                try {
                  setRejecting(true);
                  const res = await adminRejectBoat(rejectTargetId, rejectNotes || undefined);
                  console.debug('[admin][front] reject with notes result:', res);
                  toast.success('Barco rechazado');
                  setRejectOpen(false);
                  setPreviewOpen(false);
                  await refreshBoats();
                } catch(e:any) {
                  toast.error(e?.message || 'Error rechazando barco');
                } finally {
                  setRejecting(false);
                  setRejectTargetId(null);
                }
              }}
            >Confirmar rechazo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default AdminPanel;
