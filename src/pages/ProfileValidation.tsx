import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { requestLicenseValidation, requestPhoneVerification, verifyPhoneCode } from "@/stores/slices/basicSlice";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ProfileValidation = () => {
  const { user, loading, refetch } = useCurrentUser();

  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // phone verification state
  const [phone, setPhone] = useState<string>(user?.phone || "");
  const [code, setCode] = useState<string>("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  // Generate/cleanup preview URL for selected file
  useEffect(() => {
    if (!licenseFile) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(licenseFile);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [licenseFile]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <div className="text-xl font-semibold">Inicia sesión para validar tu perfil</div>
          <Button asChild>
            <a href="/login">Ir a Iniciar sesión</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      {(loading || uploading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="flex items-center gap-3 bg-background/90 backdrop-blur px-4 py-3 rounded-md shadow">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-foreground">Cargando...</span>
          </div>
        </div>
      )}
      {/* Hero con gradiente */}
      <div className="pt-20 pb-8 bg-gradient-ocean">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Validación de perfil</h1>
          <p className="text-white/90 text-sm">Sube tu licencia de navegación y valida tu teléfono para completar tu perfil.</p>
        </div>
      </div>

      <main className="pt-6 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Validación de licencia de navegación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.licenseStatus === 'pending' ? (
                <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  Tu solicitud de validación de licencia está pendiente. No puedes subir un nuevo archivo hasta que un administrador la revise.
                </div>
              ) : user?.licenseStatus === 'approved' ? (
                <div className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                  Tu licencia ya fue aprobada. No es posible enviar una nueva carga.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Sube una imagen o PDF de tu licencia</Label>
                    <Input type="file" accept="image/*,.pdf" onChange={(e)=> setLicenseFile(e.target.files?.[0] || null)} />
                    <p className="text-xs text-muted-foreground">Formatos permitidos: imágenes (JPG/PNG/WebP) o PDF.</p>
                  </div>
                  {previewUrl && (
                    <div className="space-y-2">
                      <Label>Vista previa</Label>
                      {licenseFile?.type === 'application/pdf' || (licenseFile && /\.pdf$/i.test(licenseFile.name)) ? (
                        <object data={previewUrl} type="application/pdf" className="w-full h-[480px] border rounded-md" aria-label="Vista previa PDF">
                          <div className="text-sm text-muted-foreground p-3">No se pudo mostrar el PDF. <a href={previewUrl} target="_blank" rel="noreferrer" className="underline">Abrir en nueva pestaña</a></div>
                        </object>
                      ) : (
                        <img src={previewUrl} alt="Vista previa" className="max-h-96 rounded-md border" />
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      disabled={!licenseFile || uploading}
                      onClick={async ()=>{
                        if (!licenseFile) return;
                        try {
                          setUploading(true);
                          await requestLicenseValidation(licenseFile);
                          toast.success("Solicitud enviada. Un administrador revisará tu licencia.");
                          // Refrescar datos del usuario y limpiar selección para actualizar UI
                          await refetch();
                          setLicenseFile(null);
                          if (previewUrl) URL.revokeObjectURL(previewUrl);
                          setPreviewUrl(null);
                        } catch (e:any) {
                          toast.error(e?.message || "No se pudo enviar la solicitud");
                        } finally {
                          setUploading(false);
                        }
                      }}
                    >{uploading ? 'Enviando...' : 'Enviar para validación'}</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Validación de número de celular</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.phoneVerified ? (
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                  Tu teléfono está verificado.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Número de celular</Label>
                    <Input
                      id="phone"
                      placeholder="Ej: +54 9 11 1234-5678"
                      value={phone}
                      onChange={(e)=> setPhone(e.target.value)}
                      disabled={sendingCode || verifyingCode}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      disabled={!phone || sendingCode}
                      onClick={async ()=>{
                        try {
                          setSendingCode(true);
                          await requestPhoneVerification(phone);
                          setCodeSent(true);
                          toast.success("Código enviado por SMS");
                        } catch (e:any) {
                          toast.error(e?.message || "No se pudo enviar el código");
                        } finally {
                          setSendingCode(false);
                        }
                      }}
                    >
                      {sendingCode ? (
                        <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</span>
                      ) : (
                        'Enviar código'
                      )}
                    </Button>
                  </div>

                  {codeSent && (
                    <div className="space-y-2">
                      <Label htmlFor="code">Código de verificación</Label>
                      <div className="flex gap-2">
                        <Input
                          id="code"
                          placeholder="Ingresa el código SMS"
                          value={code}
                          onChange={(e)=> setCode(e.target.value)}
                          disabled={verifyingCode}
                        />
                        <Button
                          disabled={!code || verifyingCode}
                          onClick={async ()=>{
                            try {
                              setVerifyingCode(true);
                              await verifyPhoneCode(code);
                              toast.success('Teléfono verificado correctamente');
                              setCode("");
                              setCodeSent(false);
                              await refetch();
                            } catch (e:any) {
                              toast.error(e?.message || 'Código inválido');
                            } finally {
                              setVerifyingCode(false);
                            }
                          }}
                        >
                          {verifyingCode ? (
                            <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Verificando...</span>
                          ) : (
                            'Verificar código'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfileValidation;
