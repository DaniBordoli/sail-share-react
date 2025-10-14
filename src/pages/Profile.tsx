import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Star, Calendar, Phone, Mail, Edit, Settings, Heart, Ship, Camera, BadgeCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { API_BASE_URL } from "@/lib/api";
import { updateUserAuthorized, uploadUserAvatar, listMyBookings, listMyReviews, listMyFavorites, getMyBoats } from "@/stores/slices/basicSlice";
import { useCurrentUser } from "@/hooks/use-current-user";

const Profile = () => {
  const { user, loading, error, refetch } = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [completedRentals, setCompletedRentals] = useState(0);
  const [favoriteBoats, setFavoriteBoats] = useState(0);
  const [ownedBoats, setOwnedBoats] = useState(0);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dniOrLicense: "",
    experienceDeclaration: "",
    timeZone: "",
    birthDate: "",
    nationality: "",
    languages: "",
    address: "",
  });

  const userProfile = {
    name: user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email : "Usuario",
    email: user?.email ?? "—",
    phone: user?.phone ?? "—",
    location: "—",
    memberSince: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long' 
    }) : "—",
    avatar: user?.avatar || "/placeholder.svg",
    rating: user?.rating ?? 0,
    reviews: user?.ratingCount ?? 0,
    completedRentals,
    favoriteBoats,
    ownedBoats,
  };

  // Subida opcional a Cloudinary si está configurado
  const uploadAvatarIfConfigured = async (file: File): Promise<string | null> => {
    const uploadUrl = import.meta.env.VITE_CLOUDINARY_UPLOAD_URL as string | undefined;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
    if (!uploadUrl || !uploadPreset) return null;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const res = await fetch(uploadUrl, { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "Error subiendo avatar");
    return data.secure_url as string;
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);
    // Previsualización inmediata
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);

    try {
      setAvatarUploading(true);
      let finalUrl: string | null = null;
      console.groupCollapsed('[avatar][front] handleAvatarChange');
      console.debug('[avatar][front] picked file:', { name: file.name, size: file.size, type: file.type });

      // 1) Intento preferente: backend POST /api/users/:id/avatar
      if (user?._id) {
        try {
          console.debug('[avatar][front] trying backend upload');
          const res = await uploadUserAvatar(user._id, file);
          console.debug('[avatar][front] backend upload result:', res);
          if (res?.success && res.data?.avatarUrl) {
            finalUrl = res.data.avatarUrl;
          }
        } catch (err) {
          console.warn('[avatar][front] backend upload failed, will fallback:', err);
          // Ignorar y pasar a fallback
        }
      }

      // 2) Fallback: subida directa a Cloudinary si hay configuración
      if (!finalUrl) {
        console.debug('[avatar][front] trying direct Cloudinary upload (if configured)');
        const uploadedUrl = await uploadAvatarIfConfigured(file);
        console.debug('[avatar][front] direct Cloudinary result url:', uploadedUrl);
        finalUrl = uploadedUrl ?? null;
      }

      // 3) Persistir en backend si solo tenemos URL (p.ej. por Cloudinary directo)
      if (user?._id && finalUrl) {
        try {
          console.debug('[avatar][front] updating user avatar URL via PUT');
          await updateUserAuthorized(user._id, { avatar: finalUrl } as any);
          console.debug('[avatar][front] updateUserAuthorized ok');
        } catch (_) {
          // Si el endpoint de avatar ya guardó, este PUT puede no ser necesario; ignoramos error suave
        }
        await refetch();
        setAvatarPreview(null);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo actualizar el avatar");
      console.error('[avatar][front] fatal error:', err);
    } finally {
      setAvatarUploading(false);
      console.groupEnd();
    }
  };

  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string | number;
    type: 'rental' | 'review' | 'favorite';
    title: string;
    description: string;
    date: string;
  }>>([]);

  useEffect(() => {
    let mounted = true;
    const fmt = (d?: string | number | Date) => {
      try {
        if (!d) return '—';
        const date = new Date(d);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: '2-digit' });
      } catch {
        return '—';
      }
    };

    const load = async () => {
      try {
        const [bookingsRes, reviewsRes, favoritesRes, myBoatsRes] = await Promise.allSettled([
          listMyBookings(),
          listMyReviews(),
          listMyFavorites(),
          getMyBoats({ limit: 100 }),
        ]);

        const out: Array<{ id: string | number; type: 'rental' | 'review' | 'favorite'; title: string; description: string; date: string; }> = [];

        // Bookings -> rental
        if (bookingsRes.status === 'fulfilled') {
          const items = (bookingsRes.value as any)?.items ?? [];
          for (const b of items.slice(0, 5)) {
            const boatName = b?.boat?.name || b?.boatName || 'Embarcación';
            const title = b?.status ? `Reserva ${b.status}` : 'Reserva';
            const period = (b?.startDate && b?.endDate) ? `${fmt(b.startDate)} – ${fmt(b.endDate)}` : (b?.createdAt ? fmt(b.createdAt) : '—');
            out.push({
              id: b?._id || b?.id || `rental-${Math.random()}`,
              type: 'rental',
              title,
              description: `${boatName}${period !== '—' ? ` · ${period}` : ''}`,
              date: fmt(b?.createdAt || b?.startDate),
            });
          }
        }

        // Reviews -> review
        if (reviewsRes.status === 'fulfilled') {
          const items = (reviewsRes.value as any)?.items ?? [];
          for (const r of items.slice(0, 5)) {
            const boatName = r?.boatName ? ` · ${r.boatName}` : '';
            const rating = typeof r?.rating === 'number' ? `⭐ ${r.rating.toFixed(1)}` : '';
            out.push({
              id: r?.id || r?._id || `review-${Math.random()}`,
              type: 'review',
              title: r?.rating ? `Nueva reseña recibida` : 'Reseña',
              description: `${rating}${boatName}${r?.comment ? ` · ${r.comment}` : ''}`.trim() || 'Reseña',
              date: fmt(r?.date || r?.createdAt),
            });
          }
        }

        // Favorites -> favorite
        if (favoritesRes.status === 'fulfilled') {
          const items = (favoritesRes.value as any)?.items ?? [];
          for (const f of items.slice(0, 5)) {
            const boatName = f?.name || f?.boat?.name || 'Embarcación';
            out.push({
              id: f?._id || f?.id || `favorite-${Math.random()}`,
              type: 'favorite',
              title: 'Barco añadido a favoritos',
              description: boatName,
              date: fmt(f?.createdAt),
            });
          }
        }

        // Actualizar contadores
        if (mounted) {
          // Contar reservas completadas
          if (bookingsRes.status === 'fulfilled') {
            const bookings = (bookingsRes.value as any)?.items ?? [];
            const completed = bookings.filter((b: any) => b?.status === 'confirmed' || b?.status === 'completed').length;
            setCompletedRentals(completed);
          }

          // Contar favoritos
          if (favoritesRes.status === 'fulfilled') {
            const favorites = (favoritesRes.value as any)?.items ?? [];
            setFavoriteBoats(favorites.length);
          }

          // Contar barcos propios
          if (myBoatsRes.status === 'fulfilled') {
            const boats = (myBoatsRes.value as any)?.data ?? [];
            setOwnedBoats(boats.length);
          }
        }

        // Ordenar por fecha desc si es posible
        out.sort((a, b) => {
          const da = new Date(a.date).getTime();
          const db = new Date(b.date).getTime();
          return (isNaN(db) ? 0 : db) - (isNaN(da) ? 0 : da);
        });

        if (mounted) {
          // Fallback: si no hay nada, dejar un conjunto breve por defecto
          if (!out.length) {
            setRecentActivity([
              { id: 1, type: 'rental', title: 'Alquiler completado', description: 'Embarcación', date: fmt(new Date()) },
            ]);
          } else {
            setRecentActivity(out.slice(0, 10));
          }
        }
      } catch {
        if (mounted) {
          setRecentActivity([
            { id: 1, type: 'rental', title: 'Alquiler completado', description: 'Embarcación', date: new Date().toLocaleDateString('es-ES') },
          ]);
        }
      }
    };

    // Solo cargar si el usuario está logueado
    if (user?._id) load();
    return () => { mounted = false; };
  }, [user?._id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Cargando perfil...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <div className="text-xl font-semibold">Inicia sesión para ver tu perfil</div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <Button asChild>
            <a href="/login">Ir a Iniciar sesión</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Profile Hero Section */}
      <div className="pt-20 pb-8 bg-gradient-ocean">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start gap-6 pt-8">
            <div className="relative">
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <div className="relative group cursor-pointer">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                    <AvatarImage src={avatarPreview ?? userProfile.avatar} alt={userProfile.name} />
                    <AvatarFallback className="text-2xl font-bold bg-white text-primary">
                      {userProfile.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-1 right-1 p-2 rounded-full bg-black/60 text-white shadow-md group-hover:bg-black/70 transition-colors">
                    <Camera size={16} />
                  </div>
                  {avatarUploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white text-sm">
                      Subiendo...
                    </div>
                  )}
                </div>
              </label>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {userProfile.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {user?.licenseStatus === 'approved' && (
                    <Badge className="bg-green-600 text-white border-green-600 flex items-center gap-1">
                      <BadgeCheck size={14} />
                      Usuario con licencia validada
                    </Badge>
                  )}
                  {user?.licenseStatus === 'pending' && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      Licencia pendiente
                    </Badge>
                  )}
                  {user?.licenseStatus === 'rejected' && (
                    <Badge className="bg-red-600 text-white border-red-600">
                      Licencia rechazada
                    </Badge>
                  )}
                  {user?.licenseStatus === 'none' && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      Licencia no cargada
                    </Badge>
                  )}
                  {user?.phoneVerified && (
                    <Badge className="bg-green-600 text-white border-green-600 flex items-center gap-1">
                      <Phone size={14} />
                      Teléfono verificado
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-white/90">
                  <div className="flex items-center gap-1">
                    <Star className="fill-yellow-400 text-yellow-400" size={20} />
                    <span className="text-white font-semibold">{userProfile.rating}</span>
                    <span className="text-white/80">({userProfile.reviews} reseñas)</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-white/90">
                <div className="flex items-center gap-1">
                  <MapPin size={16} />
                  <span>{userProfile.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>Miembro desde {userProfile.memberSince}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={() => {
                  if (user) {
                    setForm({
                      firstName: (user.firstName ?? ""),
                      lastName: (user.lastName ?? ""),
                      phone: (user.phone ?? ""),
                      dniOrLicense: (user.dniOrLicense ?? ""),
                      experienceDeclaration: (user.experienceDeclaration ?? ""),
                      timeZone: (user.timeZone ?? ""),
                      birthDate: (user.birthDate ?? ""),
                      nationality: (user.nationality ?? ""),
                      languages: (user.languages ?? ""),
                      address: (user.address ?? ""),
                    });
                  }
                  setIsEditing((v) => !v);
                }}
              >
                <Edit size={16} />
                {isEditing ? "Cancelar" : "Editar Perfil"}
              </Button>
              <Button variant="outline" size="sm" className="gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20">
                <Settings size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content wrapper with muted background (like Admin Panel) */}
      <div className="bg-muted">
      {/* Quick Actions - prominent bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="-mt-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className={"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"}>
                <Link to="/favorites" className="group rounded-xl border bg-card hover:bg-accent/50 transition-colors p-4 flex items-center gap-3 shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                    <Heart size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Ver Favoritos</div>
                    <div className="text-xs text-muted-foreground">Tus barcos guardados</div>
                  </div>
                </Link>
                <Link to="/my-boats" className="group rounded-xl border bg-card hover:bg-accent/50 transition-colors p-4 flex items-center gap-3 shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Ship size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Mis Barcos</div>
                    <div className="text-xs text-muted-foreground">Gestiona tus publicaciones</div>
                  </div>
                </Link>
                <Link to="/my-reviews" className="group rounded-xl border bg-card hover:bg-accent/50 transition-colors p-4 flex items-center gap-3 shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center">
                    <Star size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Mis Reseñas</div>
                    <div className="text-xs text-muted-foreground">Consulta tus calificaciones</div>
                  </div>
                </Link>
                <Link to="/mis-reservas" className="group rounded-xl border bg-card hover:bg-accent/50 transition-colors p-4 flex items-center gap-3 shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                    <Calendar size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Mis Reservas</div>
                    <div className="text-xs text-muted-foreground">Como arrendatario</div>
                  </div>
                </Link>
                <Link to="/owner/reservas" className="group rounded-xl border bg-card hover:bg-accent/50 transition-colors p-4 flex items-center gap-3 shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Settings size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Reservas de mis barcos</div>
                    <div className="text-xs text-muted-foreground">Como propietario</div>
                  </div>
                </Link>
                {user?.licenseStatus !== 'approved' && (
                  <Link to="/profile/validation" className="group rounded-xl border bg-card hover:bg-accent/50 transition-colors p-4 flex items-center gap-3 shadow-sm">
                    <div className="h-10 w-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
                      <Settings size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Validar Perfil</div>
                      <div className="text-xs text-muted-foreground">Sube tu licencia</div>
                    </div>
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <Link to="/admin" className="group rounded-xl border bg-card hover:bg-accent/50 transition-colors p-4 flex items-center gap-3 shadow-sm">
                    <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Settings size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Administración</div>
                      <div className="text-xs text-muted-foreground">Revisar validaciones</div>
                    </div>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Stats Cards */}
          <div className="lg:col-span-2 space-y-6">
            {isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle>Editar Perfil</CardTitle>
                </CardHeader>
                <CardContent>
                  {formError && (
                    <div className="mb-3 text-sm text-red-600">{formError}</div>
                  )}
                  <form
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setFormError(null);
                      if (!user?._id) return;
                      try {
                        setSaving(true);
                        const updateData = {
                          firstName: form.firstName,
                          lastName: form.lastName,
                          phone: form.phone,
                          dniOrLicense: form.dniOrLicense,
                          experienceDeclaration: form.experienceDeclaration,
                          timeZone: form.timeZone,
                          birthDate: form.birthDate,
                          nationality: form.nationality,
                          languages: form.languages,
                          address: form.address,
                        };
                        
                        await updateUserAuthorized(user._id, updateData);
                        await refetch();
                        setIsEditing(false);
                      } catch (err) {
                        setFormError(err instanceof Error ? err.message : "Error actualizando el perfil");
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    <div>
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input
                        id="firstName"
                        value={form.firstName}
                        onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Apellido</Label>
                      <Input
                        id="lastName"
                        value={form.lastName}
                        onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                        placeholder="Tu apellido"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="Ej: +34 600 000 000"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="dniOrLicense">DNI o Licencia de Navegación</Label>
                      <Input
                        id="dniOrLicense"
                        value={form.dniOrLicense}
                        onChange={(e) => setForm((f) => ({ ...f, dniOrLicense: e.target.value }))}
                        placeholder="Número de documento o licencia"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="experienceDeclaration">Declaración de experiencia</Label>
                      <textarea
                        id="experienceDeclaration"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Describe tu experiencia náutica, años navegando, tipos de embarcaciones, etc."
                        value={form.experienceDeclaration}
                        onChange={(e) => setForm((f) => ({ ...f, experienceDeclaration: e.target.value }))}
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="timeZone">Zona horaria</Label>
                      <Input
                        id="timeZone"
                        value={form.timeZone}
                        onChange={(e) => setForm((f) => ({ ...f, timeZone: e.target.value }))}
                        placeholder="Ej: GMT-3, UTC+1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="birthDate">Fecha de nacimiento</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={form.birthDate}
                        onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="nationality">Nacionalidad</Label>
                      <Input
                        id="nationality"
                        value={form.nationality}
                        onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))}
                        placeholder="Ej: Española, Argentina"
                      />
                    </div>
                    <div>
                      <Label htmlFor="languages">Idiomas que domina</Label>
                      <Input
                        id="languages"
                        value={form.languages}
                        onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))}
                        placeholder="Ej: Español, Inglés, Francés"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Domicilio de residencia</Label>
                      <Input
                        id="address"
                        value={form.address}
                        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                        placeholder="Dirección completa"
                      />
                    </div>
                    <div className="md:col-span-2 flex gap-2 justify-end mt-2">
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={saving}>
                        {saving ? "Guardando..." : "Guardar Cambios"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
            {/* Nautical Experience display */}
            {!isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle>Experiencia Náutica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">DNI o Licencia</div>
                    <div className="text-sm">{user?.dniOrLicense || "—"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Declaración de experiencia</div>
                    <div className="text-sm whitespace-pre-wrap">
                      {user?.experienceDeclaration?.trim() ? user.experienceDeclaration : "Aún no completado. Usa \"Editar Perfil\" para completarlo."}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {userProfile.completedRentals}
                  </div>
                  <p className="text-sm text-muted-foreground">Alquileres</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {userProfile.favoriteBoats}
                  </div>
                  <p className="text-sm text-muted-foreground">Favoritos</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {userProfile.ownedBoats}
                  </div>
                  <p className="text-sm text-muted-foreground">Mis Barcos</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {userProfile.reviews}
                  </div>
                  <p className="text-sm text-muted-foreground">Reseñas</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ship size={20} />
                  Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id}>
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {activity.type === 'rental' && <Ship size={16} className="text-blue-500" />}
                        {activity.type === 'review' && <Star size={16} className="text-yellow-500" />}
                        {activity.type === 'favorite' && <Heart size={16} className="text-red-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{activity.title}</h4>
                          <span className="text-sm text-muted-foreground">{activity.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      </div>
                    </div>
                    {index < recentActivity.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-muted-foreground" />
                  <span className="text-sm">{userProfile.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-muted-foreground" />
                  <span className="text-sm">{userProfile.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-muted-foreground" />
                  <span className="text-sm">{userProfile.location}</span>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Fecha de nacimiento</div>
                    <span className="text-sm">{user?.birthDate ? new Date(user.birthDate).toLocaleDateString('es-ES') : "—"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Nacionalidad</div>
                    <span className="text-sm">{user?.nationality || "—"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Settings size={16} className="text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Zona horaria</div>
                    <span className="text-sm">{user?.timeZone || "—"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Idiomas</div>
                    <span className="text-sm">{user?.languages || "—"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Domicilio</div>
                    <span className="text-sm">{user?.address || "—"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Preferencias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Notificaciones por email</span>
                  <Badge variant="secondary">Activado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Perfil público</span>
                  <Badge variant="secondary">Activado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Mostrar teléfono</span>
                  <Badge variant="outline">Desactivado</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions removed per request - actions moved to prominent bar */}
          </div>
        </div>
      </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Profile;
