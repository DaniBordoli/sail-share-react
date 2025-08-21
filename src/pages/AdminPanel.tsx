import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getLicenseRequests, approveLicenseRequest, rejectLicenseRequest, type LicenseRequest } from "@/stores/slices/basicSlice";
import { toast } from "sonner";

const AdminPanel = () => {
  const { user, loading } = useCurrentUser();
  const [requests, setRequests] = useState<LicenseRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  // Vista previa eliminada: solo descarga

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

  useEffect(() => {
    if (user && user.role === 'admin') {
      refresh();
    }
  }, [user]);

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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPanel;
