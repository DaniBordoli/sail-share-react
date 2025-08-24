import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useEffect, useMemo, useState } from "react";
import { getMyBoats, createBoat, updateBoat, deleteBoat, toggleBoatActive } from "@/stores/slices/basicSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Images, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LocationAutocomplete, { LocationSuggestion } from "@/components/LocationAutocomplete";
import MyBoatMapPicker from "@/components/MyBoatMapPicker";

// Helper: upload multiple photos to Cloudinary (unsigned)
async function uploadPhotos(files: File[]): Promise<string[]> {
  const uploadUrl = import.meta.env.VITE_CLOUDINARY_UPLOAD_URL as string | undefined;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
  if (!uploadUrl || !uploadPreset) throw new Error('Cloudinary no configurado en el frontend');
  const urls: string[] = [];
  for (const file of files) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', uploadPreset);
    const res = await fetch(uploadUrl, { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || 'Error subiendo imagen');
    urls.push(data.secure_url as string);
  }
  return urls;
}

const areas = [
  'Andalucía', 'Cataluña', 'Valencia', 'Islas Baleares', 'Islas Canarias', 'Galicia', 'País Vasco', 'Murcia'
];

const boatTypes = [
  'Velero', 'Catamarán', 'Lancha', 'Yate', 'Neumática', 'Pesca-paseo'
];

const rentalTypeOptions = [
  { key: 'solo_barco', label: 'Solo barco' },
  { key: 'con_capitan', label: 'Con capitán' },
  { key: 'con_dueno', label: 'Con dueño en barco' },
];

export default function MyBoats() {
  const { user, loading } = useCurrentUser();

  // Gating
  const profileIncomplete = useMemo(() => {
    if (!user) return true;
    if (!user.firstName || !user.lastName || !user.phone) return true;
    return false;
  }, [user]);

  const cannotPublish = useMemo(() => {
    if (!user) return true;
    return !user.isVerified || profileIncomplete;
  }, [user, profileIncomplete]);

  // List state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc'|'desc'>('desc');
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [errorList, setErrorList] = useState<string|null>(null);

  const load = async () => {
    if (!user) return;
    setLoadingList(true);
    setErrorList(null);
    try {
      const res = await getMyBoats({ page, limit, sort, order });
      setItems(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch (e:any) {
      setErrorList(e?.message || 'Error cargando embarcaciones');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, sort, order]);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string[]|null>(null);
  const [photosFiles, setPhotosFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [addressFromMap, setAddressFromMap] = useState(false);
  const [prevLocBeforeMap, setPrevLocBeforeMap] = useState<null | { addressFormatted: string; latitude: string; longitude: string }>(null);
  const [form, setForm] = useState<any>({
    name: '',
    rentalTypes: [] as string[],
    area: '',
    boatType: '',
    brand: '',
    model: '',
    buildYear: '',
    capacity: '',
    enginePower: '',
    length: '',
    contactNumber: '',
    city: '',
    latitude: '',
    longitude: '',
    addressFormatted: '',
    description: '',
    price: '',
    priceUnit: 'day',
  });

  // Delete confirmation modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [boatToDelete, setBoatToDelete] = useState<any|null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Mapeo de etiquetas legibles por campo para mensajes de error
  const fieldLabels: Record<string, string> = {
    name: 'Nombre del barco',
    area: 'Área geográfica',
    boatType: 'Tipo de barco',
    brand: 'Marca',
    model: 'Modelo',
    buildYear: 'Año de construcción',
    capacity: 'Capacidad a bordo',
    enginePower: 'Potencia del motor',
    length: 'Largo (m)',
    contactNumber: 'Número de contacto de la publicación',
    city: 'Ciudad',
    description: 'Descripción',
    price: 'Precio',
    rentalTypes: 'Tipo de rental',
  };

  const validateForm = (): string[] | null => {
    const errs: string[] = [];
    const required = ['name','area','boatType','brand','model','buildYear','capacity','enginePower','length','contactNumber','city','description','price'];
    for (const k of required) {
      const v = (form as any)[k];
      if (v === undefined || v === null || String(v).trim() === '') errs.push(`Campo obligatorio faltante: ${fieldLabels[k] || k}`);
    }
    // Coordenadas obligatorias
    if (!form.latitude || String(form.latitude).trim() === '') errs.push('Ubicación: latitud es obligatoria (selecciona una sugerencia)');
    if (!form.longitude || String(form.longitude).trim() === '') errs.push('Ubicación: longitud es obligatoria (selecciona una sugerencia)');
    if (!Array.isArray(form.rentalTypes) || form.rentalTypes.length === 0) errs.push(`Selecciona al menos un ${fieldLabels['rentalTypes']}`);
    const year = Number(form.buildYear);
    const now = new Date().getFullYear();
    if (Number.isNaN(year) || year < 1900 || year > now) errs.push(`${fieldLabels['buildYear']}: inválido`);
    for (const nk of ['capacity','enginePower','length','price']) {
      const v = Number((form as any)[nk]);
      if (Number.isNaN(v) || v <= 0) errs.push(`${fieldLabels[nk] || nk}: valor inválido o no positivo`);
    }
    const phoneRegex = /^[+]?\d[\d\s()-]{6,}$/;
    if (!phoneRegex.test(String(form.contactNumber))) errs.push(`${fieldLabels['contactNumber']}: inválido`);
    if (photosFiles.length === 0 && existingPhotos.length === 0) errs.push('Debes subir al menos una foto');
    return errs.length ? errs : null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const v = validateForm();
    if (v) { setFormError(v); return; }
    try {
      setSaving(true);
      const newUrls = photosFiles.length ? await uploadPhotos(photosFiles) : [];
      const photos = [...existingPhotos, ...newUrls];
      const payload = { 
        ...form,
        // normalizar tipos
        buildYear: Number(form.buildYear),
        capacity: Number(form.capacity),
        enginePower: Number(form.enginePower),
        length: Number(form.length),
        price: Number(form.price),
        // incluir coords solo si están presentes
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        addressFormatted: form.addressFormatted || undefined,
        photos,
      };
      const res = editId ? await updateBoat(editId, payload) : await createBoat(payload);
      if (res?.success) {
        setFormOpen(false);
        setEditId(null);
        setForm({ name: '', rentalTypes: [], area: '', boatType: '', brand: '', model: '', buildYear: '', capacity: '', enginePower: '', length: '', contactNumber: '', city: '', latitude: '', longitude: '', addressFormatted: '', description: '', price: '', priceUnit: 'day' });
        setPhotosFiles([]);
        setExistingPhotos([]);
        await load();
      } else {
        setFormError([res?.message || 'No se pudo guardar la embarcación']);
      }
    } catch (e:any) {
      setFormError([e?.message || 'Error guardando embarcación']);
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (b: any) => {
    setFormOpen(true);
    setEditId(b._id);
    setForm({
      name: b.name || '',
      rentalTypes: Array.isArray(b.rentalTypes) ? b.rentalTypes : [],
      area: b.area || '',
      boatType: b.boatType || '',
      brand: b.brand || '',
      model: b.model || '',
      buildYear: String(b.buildYear ?? ''),
      capacity: String(b.capacity ?? ''),
      enginePower: String(b.enginePower ?? ''),
      length: String(b.length ?? ''),
      contactNumber: b.contactNumber || '',
      city: b.city || '',
      latitude: b.latitude ? String(b.latitude) : '',
      longitude: b.longitude ? String(b.longitude) : '',
      addressFormatted: b.addressFormatted || '',
      description: b.description || '',
      price: String(b.price ?? ''),
      priceUnit: b.priceUnit || 'day',
    });
    setExistingPhotos(Array.isArray(b.photos) ? b.photos : []);
    setPhotosFiles([]);
    setFormError(null);
  };

  const onDelete = (b: any) => {
    setBoatToDelete(b);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!boatToDelete) return;
    try {
      setDeleting(true);
      await deleteBoat(boatToDelete._id);
      await load();
      setConfirmOpen(false);
      setBoatToDelete(null);
    } catch (e:any) {
      alert(e?.message || 'No se pudo eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const onToggleActive = async (b: any) => {
    try {
      await toggleBoatActive(b._id, !b.isActive);
      await load();
    } catch (e:any) {
      alert(e?.message || 'No se pudo actualizar el estado');
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      {(loading || loadingList || saving) && (
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
          <h1 className="text-3xl font-bold mb-2 text-white">Mis embarcaciones</h1>
          <p className="text-white/90 text-sm">Gestiona tus publicaciones y agrega nuevas embarcaciones</p>
          
          {loading ? (
            <div>Cargando...</div>
          ) : !user ? (
            <div>Inicia sesión para continuar.</div>
          ) : cannotPublish ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-white">Completa tu perfil antes de publicar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!user.isVerified && <div className="text-sm">• Debes verificar tu correo electrónico.</div>}
                {profileIncomplete && <div className="text-sm">• Completa tu nombre, apellido y teléfono en tu perfil.</div>}
                <div className="pt-2">
                  <Button asChild>
                    <a href="/profile">Ir a mi perfil</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Contenido sobre fondo no blanco */}
      {!loading && user && !cannotPublish && (
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Select value={sort} onValueChange={(v) => setSort(v)}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Fecha de creación</SelectItem>
                      <SelectItem value="name">Nombre</SelectItem>
                      <SelectItem value="area">Área</SelectItem>
                      <SelectItem value="boatType">Tipo</SelectItem>
                      <SelectItem value="brand">Marca</SelectItem>
                      <SelectItem value="model">Modelo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={order} onValueChange={(v: 'asc'|'desc') => setOrder(v)}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Orden" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascendente</SelectItem>
                      <SelectItem value="desc">Descendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full sm:w-auto" onClick={() => { setFormOpen(true); setEditId(null); setExistingPhotos([]); setPhotosFiles([]); setForm({ name: '', rentalTypes: [], area: '', boatType: '', brand: '', model: '', buildYear: '', capacity: '', enginePower: '', length: '', contactNumber: '', city: '', description: '', price: '', priceUnit: 'day' }); }}>Agregar embarcación</Button>
              </div>

              <Card>
                <CardContent className="p-4">
                  {loadingList ? (
                    <div>Cargando listado...</div>
                  ) : errorList ? (
                    <div className="text-red-600 text-sm">{errorList}</div>
                  ) : items.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No tienes embarcaciones publicadas.</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {items.map((b) => (
                        <div key={b._id} className="border rounded-lg p-3 flex gap-3">
                          <div className="w-40 h-28 bg-muted rounded overflow-hidden flex items-center justify-center">
                            {Array.isArray(b.photos) && b.photos.length > 0 ? (
                              <img src={b.photos[0]} alt={b.name} className="w-full h-full object-cover" />
                            ) : (
                              <Images className="text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">{b.name}</h3>
                              {b.isActive ? <Badge>Activa</Badge> : <Badge variant="secondary">Inactiva</Badge>}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {b.boatType} • {b.brand} {b.model} • {b.area}
                            </div>
                            <div className="text-sm mt-1">Precio: €{b.price} / {b.priceUnit === 'day' ? 'día' : 'semana'}</div>
                            <div className="flex flex-col sm:flex-row gap-2 mt-2">
                              <Button className="w-full sm:w-auto" size="sm" variant="outline" onClick={() => onEdit(b)}>Editar</Button>
                              <Button className="w-full sm:w-auto" size="sm" variant="outline" onClick={() => onToggleActive(b)}>{b.isActive ? 'Desactivar' : 'Activar'}</Button>
                              <Button className="w-full sm:w-auto" size="sm" variant="destructive" onClick={() => onDelete(b)}>Eliminar</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  <div className="flex items-center justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p)=>p-1)}>
                      <ChevronLeft size={16} /> Prev
                    </Button>
                    <div className="text-sm">Página {page} de {totalPages}</div>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p)=>p+1)}>
                      Next <ChevronRight size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Create form drawer-like simple panel */}
              {formOpen && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>{editId ? 'Editar embarcación' : 'Nueva embarcación'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={submit}>
                      <div className="md:col-span-2">
                        <Label>Nombre del barco</Label>
                        <Input value={form.name} onChange={(e)=>setForm((f:any)=>({...f, name:e.target.value}))} />
                      </div>

                      <div>
                        <Label>Área geográfica</Label>
                        <Select value={form.area} onValueChange={(v)=>setForm((f:any)=>({...f, area:v}))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona área" />
                          </SelectTrigger>
                          <SelectContent>
                            {areas.map(a=> <SelectItem key={a} value={a}>{a}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Tipo de barco</Label>
                        <Select value={form.boatType} onValueChange={(v)=>setForm((f:any)=>({...f, boatType:v}))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {boatTypes.map(a=> <SelectItem key={a} value={a}>{a}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Marca</Label>
                        <Input value={form.brand} onChange={(e)=>setForm((f:any)=>({...f, brand:e.target.value}))} />
                      </div>
                      <div>
                        <Label>Modelo</Label>
                        <Input value={form.model} onChange={(e)=>setForm((f:any)=>({...f, model:e.target.value}))} />
                      </div>

                      <div>
                        <Label>Año de construcción</Label>
                        <Input type="number" value={form.buildYear} onChange={(e)=>setForm((f:any)=>({...f, buildYear:e.target.value}))} />
                      </div>
                      <div>
                        <Label>Capacidad a bordo</Label>
                        <Input type="number" value={form.capacity} onChange={(e)=>setForm((f:any)=>({...f, capacity:e.target.value}))} />
                      </div>
                      <div>
                        <Label>Potencia del motor</Label>
                        <Input type="number" value={form.enginePower} onChange={(e)=>setForm((f:any)=>({...f, enginePower:e.target.value}))} />
                      </div>
                      <div>
                        <Label>Largo (m)</Label>
                        <Input type="number" value={form.length} onChange={(e)=>setForm((f:any)=>({...f, length:e.target.value}))} />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Número de contacto de la publicación</Label>
                        <Input value={form.contactNumber} onChange={(e)=>setForm((f:any)=>({...f, contactNumber:e.target.value}))} placeholder="Ej: +34 600 000 000" />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Dirección (autocompletar)</Label>
                        <div className="mt-1">
                          <LocationAutocomplete
                            placeholder="Escribe una dirección, puerto o ciudad"
                            value={form.addressFormatted}
                            onChangeText={(text: string) => {
                              setForm((f:any)=>({
                                ...f,
                                addressFormatted: text,
                                // al editar texto manualmente, invalidar coords hasta nueva selección
                                latitude: '',
                                longitude: '',
                              }));
                              setAddressFromMap(false);
                              setPrevLocBeforeMap(null);
                            }}
                            onSelect={(loc: LocationSuggestion) => {
                              setForm((f:any)=>({
                                ...f,
                                city: loc.city || f.city,
                                latitude: String(loc.lat),
                                longitude: String(loc.lon),
                                addressFormatted: loc.formatted,
                              }));
                              setAddressFromMap(false);
                              setPrevLocBeforeMap(null);
                            }}
                          />
                        </div>
                        {form.addressFormatted && (
                          <div className="flex items-center gap-3 mt-1">
                            <div className="text-xs text-muted-foreground">Seleccionado: {form.addressFormatted}</div>
                            {addressFromMap && (
                              <>
                                <Badge variant="default" className="text-[10px] bg-blue-600 text-white">Dirección actualizada desde el mapa</Badge>
                                {prevLocBeforeMap && (
                                  <Button
                                    type="button"
                                    variant="link"
                                    className="h-auto p-0 text-xs"
                                    onClick={() => {
                                      setForm((f:any)=>({
                                        ...f,
                                        addressFormatted: prevLocBeforeMap.addressFormatted,
                                        latitude: prevLocBeforeMap.latitude,
                                        longitude: prevLocBeforeMap.longitude,
                                      }));
                                      setAddressFromMap(false);
                                      setPrevLocBeforeMap(null);
                                    }}
                                  >
                                    Revertir a dirección original
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        )}
                        {/* Mensaje de validación inline para coords */}
                        {Array.isArray(formError) && (formError.some(m => m.toLowerCase().includes('latitud')) || formError.some(m => m.toLowerCase().includes('longitud'))) && (
                          <div className="text-xs text-red-600 mt-1">Selecciona una dirección de la lista para completar latitud y longitud</div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                          <div>
                            <Label>Ciudad</Label>
                            <Input value={form.city} onChange={(e)=>setForm((f:any)=>({...f, city:e.target.value}))} />
                          </div>
                          <div>
                            <Label>Latitud</Label>
                            <Input value={form.latitude} readOnly placeholder="—" />
                          </div>
                          <div>
                            <Label>Longitud</Label>
                            <Input value={form.longitude} readOnly placeholder="—" />
                          </div>
                        </div>
                        {/* MapPicker para ajustar ubicación con marcador draggable */}
                        <div className="mt-3">
                          <MyBoatMapPicker
                            value={form.latitude && form.longitude ? { lat: Number(form.latitude), lng: Number(form.longitude) } : null}
                            onChange={(c)=>{
                              setForm((f:any)=>({ ...f, latitude: String(c.lat), longitude: String(c.lng) }));
                            }}
                            onAddressChange={(formatted)=>{
                              setPrevLocBeforeMap({ addressFormatted: String(form.addressFormatted || ''), latitude: String(form.latitude || ''), longitude: String(form.longitude || '') });
                              setForm((f:any)=>({ ...f, addressFormatted: formatted }));
                              setAddressFromMap(true);
                            }}
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Label>Descripción</Label>
                        <Textarea value={form.description} onChange={(e)=>setForm((f:any)=>({...f, description:e.target.value}))} rows={4} />
                      </div>

                      <div>
                        <Label>Precio</Label>
                        <Input type="number" value={form.price} onChange={(e)=>setForm((f:any)=>({...f, price:e.target.value}))} />
                      </div>
                      <div>
                        <Label>Unidad de precio</Label>
                        <Select value={form.priceUnit} onValueChange={(v)=>setForm((f:any)=>({...f, priceUnit:v}))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="day">Por día</SelectItem>
                            <SelectItem value="week">Por semana</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-2">
                        <Label>Tipo de rental (múltiple)</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {rentalTypeOptions.map(rt => (
                            <Badge
                              key={rt.key}
                              variant={form.rentalTypes.includes(rt.key) ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => {
                                setForm((f:any)=>{
                                  const has = f.rentalTypes.includes(rt.key);
                                  return { ...f, rentalTypes: has ? f.rentalTypes.filter((x:string)=>x!==rt.key) : [...f.rentalTypes, rt.key] };
                                });
                              }}
                            >
                              {rt.label}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Label>Fotos</Label>
                        <Input type="file" accept="image/*" multiple onChange={(e)=>{
                          const fl = Array.from(e.target.files || []);
                          setPhotosFiles(fl);
                        }} />
                        {existingPhotos.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {existingPhotos.map((url, i)=> (
                              <div key={i} className="w-20 h-20 rounded overflow-hidden bg-muted border">
                                <img src={url} alt={`foto-${i}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 mt-2">
                          {photosFiles.map((f, i)=> (
                            <div key={i} className="w-20 h-20 rounded overflow-hidden bg-muted">
                              <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-2 flex flex-col sm:flex-row sm:justify-end gap-2 mt-2">
                        <Button className="w-full sm:w-auto" type="button" variant="outline" onClick={()=>{ setFormOpen(false); setFormError(null); setEditId(null); setExistingPhotos([]); setPhotosFiles([]); }}>Cancelar</Button>
                        <Button className="w-full sm:w-auto" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
                      </div>
                    </form>
                    {formError && formError.length > 0 && (
                      <div className="mt-3 p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm">
                        <div className="font-medium mb-1">Por favor corrige los siguientes errores:</div>
                        <ul className="list-disc pl-5 space-y-1">
                          {formError.map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          </div>
        </div>
      )}
      <Footer />
      {/* Confirmación de eliminación */}
      <Dialog open={confirmOpen} onOpenChange={(o)=>{ if (!o) { setConfirmOpen(false); setBoatToDelete(null); } }}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Eliminar embarcación</DialogTitle>
            <DialogDescription>
              {boatToDelete ? (
                <>¿Seguro que quieres eliminar "{boatToDelete.name}"? Esta acción no se puede deshacer.</>
              ) : (
                <>¿Seguro que quieres eliminar esta embarcación? Esta acción no se puede deshacer.</>
              )}
            </DialogDescription>
          </DialogHeader>
          {boatToDelete && (
            <div className="flex items-center gap-3 py-2">
              <div className="w-20 h-14 sm:w-24 sm:h-16 rounded overflow-hidden bg-muted border flex items-center justify-center">
                {Array.isArray(boatToDelete.photos) && boatToDelete.photos[0] ? (
                  <img src={boatToDelete.photos[0]} alt={boatToDelete.name} className="w-full h-full object-cover" />
                ) : (
                  <Images className="text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <div className="font-medium truncate">{boatToDelete.name}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {boatToDelete.boatType} • {boatToDelete.brand} {boatToDelete.model} • {boatToDelete.area}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button className="w-full sm:w-auto" variant="outline" onClick={()=>{ setConfirmOpen(false); setBoatToDelete(null); }} disabled={deleting}>Cancelar</Button>
            <Button className="w-full sm:w-auto" variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
