import { API_BASE_URL } from '@/lib/api';
import type { ApiResponse, UserData, LoginCredentials } from '@/types/api';

// Función básica para probar la conexión
export const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Connection test error:', error);
    throw error;
  }
};

// ===== Favorites =====
export const listMyFavorites = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');
  const res = await fetch(`${API_BASE_URL}/api/favorites`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  // Esperado: { items: Boat[] }
  return data as { items: any[] };
};

export const toggleFavorite = async (boatId: string) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');
  const res = await fetch(`${API_BASE_URL}/api/favorites/${boatId}/toggle`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  // Esperado: { favorited: boolean }
  return data as { favorited: boolean };
};

// ===== Reviews =====
export const listMyReviews = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');
  const res = await fetch(`${API_BASE_URL}/api/reviews/mine`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  // Esperado: { items: Review[] }
  return data as { items: any[] };
};

export const createReview = async (payload: { bookingId?: string; boatId: string; rating: number; comment?: string }) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');
  const res = await fetch(`${API_BASE_URL}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data as { success?: boolean; review?: any };
};

// Enviar barco a revisión (propietario)
export const submitBoatForReview = async (boatId: string) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');
  const res = await fetch(`${API_BASE_URL}/api/boats/${boatId}/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
};

// ===== Admin: boats moderation =====
export type AdminBoat = {
  _id: string;
  name: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  status: 'draft'|'pending_review'|'approved'|'rejected';
  isActive: boolean;
  brand?: string;
  model?: string;
  boatType?: string;
  city?: string;
  price?: number;
  priceUnit?: 'day'|'week';
  capacity?: number;
  length?: number;
  description?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt?: string;
  photos?: string[];
};

export const adminListBoats = async (params: { status?: string; q?: string; owner?: string; page?: number; limit?: number }) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.q) q.set('q', params.q);
  if (params?.owner) q.set('owner', params.owner);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const res = await fetch(`${API_BASE_URL}/api/admin/boats?${q.toString()}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data as { success: boolean; data: AdminBoat[]; meta?: any };
};

export const adminApproveBoat = async (boatId: string) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');
  const res = await fetch(`${API_BASE_URL}/api/admin/boats/${boatId}/approve`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
};

export const adminRejectBoat = async (boatId: string, notes?: string) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');
  const res = await fetch(`${API_BASE_URL}/api/admin/boats/${boatId}/reject`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
};

// ===== Profile validation: phone (SMS) =====
export const requestPhoneVerification = async (phone: string) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');
  const res = await fetch(`${API_BASE_URL}/api/verification/phone/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ phone }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
};

export const verifyPhoneCode = async (code: string) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');
  const res = await fetch(`${API_BASE_URL}/api/verification/phone/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
};

// ===== Profile validation: license =====
export const requestLicenseValidation = async (file: File) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE_URL}/api/validation/license`, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    } as any,
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
};

// ===== Admin: license requests moderation =====
export type LicenseRequest = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  licenseUrl: string;
  licenseStatus: 'pending' | 'approved' | 'rejected' | 'none';
  createdAt?: string;
};

export const getLicenseRequests = async (): Promise<LicenseRequest[]> => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');
  const res = await fetch(`${API_BASE_URL}/api/admin/license-requests`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data?.data ?? [];
};

export const approveLicenseRequest = async (requestId: string) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');
  const res = await fetch(`${API_BASE_URL}/api/admin/license-requests/${requestId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
};

export const rejectLicenseRequest = async (requestId: string) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');
  const res = await fetch(`${API_BASE_URL}/api/admin/license-requests/${requestId}/reject`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
};

// Actualizar embarcación (propietario)
export const updateBoat = async (boatId: string, updateData: Record<string, any>) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');
  const res = await fetch(`${API_BASE_URL}/api/boats/${boatId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
};

// Eliminar embarcación (propietario)
export const deleteBoat = async (boatId: string) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');
  const res = await fetch(`${API_BASE_URL}/api/boats/${boatId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
};

// Activar/Desactivar publicación
export const toggleBoatActive = async (boatId: string, isActive: boolean) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');
  const res = await fetch(`${API_BASE_URL}/api/boats/${boatId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ isActive }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
};

// ----- Nuevas funciones planas -----

// Cerrar sesión: limpia token local y opcionalmente notifica al backend
export const logout = async (): Promise<void> => {
  try {
    const token = localStorage.getItem('authToken');
    localStorage.removeItem('authToken');
    if (token) {
      // Mejor esfuerzo: notificar al backend (no requerido para JWT)
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).catch(() => {});
    }
  } catch {
    // No-op
  }
};

// Obtener usuario por ID (público o protegido según backend)
export const getUserById = async (userId: string) => {
  const res = await fetch(`${API_BASE_URL}/api/users/${userId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
};

// Listar usuarios (idealmente protegido/solo admin)
export const listUsers = async () => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(`${API_BASE_URL}/api/users/`, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
};

// Actualizar usuario con autorización (lee token de localStorage)
export const updateUserAuthorized = async (userId: string, updateData: Partial<UserData>) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(updateData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
};

// Subir avatar del usuario (multipart/form-data)
export const uploadUserAvatar = async (userId: string, file: File) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');

  const formData = new FormData();
  formData.append('file', file);

  const url = `${API_BASE_URL}/api/users/${userId}/avatar`;
  console.groupCollapsed('[avatar][front] uploadUserAvatar');
  try {
    console.debug('[avatar][front] endpoint:', url);
    console.debug('[avatar][front] file:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });
    console.debug('[avatar][front] hasToken:', !!token);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        // Importante: no establecer Content-Type manualmente para FormData
      } as any,
      body: formData,
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch (_) {
      // no-op
    }
    console.debug('[avatar][front] status:', res.status);
    console.debug('[avatar][front] response:', data);
    if (!res.ok) throw new Error((data && (data.message || data.error)) || `Error ${res.status}`);
    return data as ApiResponse<{ avatarUrl: string; publicId?: string }>;
  } finally {
    console.groupEnd();
  }
};

// Boats: placeholders actuales en backend
export const getBoats = async () => {
  const res = await fetch(`${API_BASE_URL}/api/boats`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
};

export const getBoatById = async (boatId: string) => {
  const res = await fetch(`${API_BASE_URL}/api/boats/${boatId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
};

// Listado de barcos por propietario (para perfil de propietario)
export const getBoatsByOwner = async (ownerId: string, params?: { page?: number; limit?: number; sort?: string; order?: 'asc'|'desc' }) => {
  const q = new URLSearchParams();
  q.set('owner', ownerId);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.sort) q.set('sort', params.sort);
  if (params?.order) q.set('order', params.order);
  const res = await fetch(`${API_BASE_URL}/api/boats?${q.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data as { data: any[]; total?: number };
};

// Enviar mensaje al propietario (contacto previo a reserva)
export const contactOwner = async (payload: { boatId: string; name: string; email: string; message: string }) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(`${API_BASE_URL}/api/messages/contact-owner`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data as { message: string; data?: { id: string } };
};

export const createBoat = async (boatData: Record<string, any>) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(`${API_BASE_URL}/api/boats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(boatData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
};

// ===== Bookings =====
export const checkBoatAvailability = async (boatId: string, start: string, end: string) => {
  const q = new URLSearchParams({ start, end });
  const res = await fetch(`${API_BASE_URL}/api/bookings/availability/${boatId}?${q.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data as { available: boolean };
};

export const getBoatBlockedDates = async (boatId: string) => {
  const res = await fetch(`${API_BASE_URL}/api/bookings/availability/${boatId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data as { blocked: { startDate: string; endDate: string }[] };
};

export const createBooking = async (payload: {
  boatId: string;
  startDate: string;
  endDate: string;
  guests: number;
  extras?: { captain?: boolean; fuel?: boolean };
  rentalType?: 'boat_only' | 'with_captain' | 'owner_onboard';
  flexibleCancellation?: boolean;
  contactPhone?: string; // nuevo: teléfono de contacto
  hasChildren?: boolean; // nuevo: indica si hay niños entre los pasajeros
  // CV náutico (opcionales)
  sailingExperience?: 'none'|'basic'|'intermediate'|'advanced';
  motorExperience?: 'none'|'basic'|'intermediate'|'advanced';
  licenseType?: string;
  ownershipExperience?: 'none'|'rented_before'|'owned_before';
  additionalDescription?: string;
}) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(`${API_BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data as { message: string; booking: any };
};

export const listMyBookings = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');
  const res = await fetch(`${API_BASE_URL}/api/bookings/mine`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data as { items: any[] };
};

// Listar reservas de barcos del propietario autenticado
export const listOwnerBookings = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');
  const res = await fetch(`${API_BASE_URL}/api/bookings/owner`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data as { items: any[] };
};

// Actualizar estado de una reserva (propietario)
export const updateBookingStatus = async (bookingId: string, status: 'confirmed'|'cancelled') => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');
  const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data as { message: string; booking: any };
};

// Obtener mis embarcaciones con paginación y orden
export const getMyBoats = async (params: { page?: number; limit?: number; sort?: string; order?: 'asc'|'desc' } = {}) => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No autenticado');
  const q = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 10),
    sort: String(params.sort ?? 'createdAt'),
    order: String(params.order ?? 'desc'),
  });
  const res = await fetch(`${API_BASE_URL}/api/boats/mine?${q.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
};

// Función para crear un usuario
export const createUser = async (userData: UserData): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Función para actualizar un usuario con información adicional
export const updateUser = async (userId: string, updateData: Partial<UserData>): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Función para login
export const loginUser = async (credentials: LoginCredentials): Promise<ApiResponse<any> & { code?: string; status?: number }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    // Siempre devolver el payload del backend para que el caller maneje códigos como EMAIL_NOT_VERIFIED
    return { ...data, status: response.status };
  } catch (error) {
    console.error('Error logging in:', error);
    // Fallback consistente
    return { success: false, message: 'Error de red al iniciar sesión' } as any;
  }
};

// Reenviar email de verificación
export const resendVerificationEmail = async (email: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error resending verification email:', error);
    return { success: false, message: 'No se pudo reenviar el correo de verificación' } as any;
  }
};


export const loginWithGoogle = () => {
  // Try to read intended redirect stored by Login.tsx
  let redirect = '/';
  try {
    const r = sessionStorage.getItem('loginRedirect');
    if (r && r.startsWith('/')) redirect = r;
  } catch {}
  const popup = window.open(
    `${API_BASE_URL}/api/auth/google${redirect && redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`,
    'googleLogin',
    'width=500,height=600,scrollbars=yes,resizable=yes'
  );

  if (!popup) {
    alert('El popup fue bloqueado. Por favor, permite popups para este sitio.');
    return;
  }

  const handleMessage = (event: MessageEvent) => {
    const currentOrigin = window.location.origin;
    const altLocalhost = currentOrigin.replace('127.0.0.1', 'localhost');
    const alt127 = currentOrigin.replace('localhost', '127.0.0.1');
    const allowedOrigins = import.meta.env.DEV
      ? Array.from(new Set([currentOrigin, altLocalhost, alt127]))
      : [currentOrigin];
    const originAllowed = allowedOrigins.includes(event.origin);
    if (!originAllowed) return;
    
    if (event.data.type === 'GOOGLE_AUTH_SUCCESS' && event.data.token) {
      localStorage.setItem('authToken', event.data.token);
      
      popup?.close();
      // Navigate to stored redirect or fallback to home
      let target = '/';
      try {
        const stored = sessionStorage.getItem('loginRedirect');
        if (stored && stored.startsWith('/')) target = stored;
        sessionStorage.removeItem('loginRedirect');
      } catch {}
      window.location.href = target;
      
      window.removeEventListener('message', handleMessage);
    }
  };

  window.addEventListener('message', handleMessage);

  const checkClosed = setInterval(() => {
    if (popup?.closed) {
      window.removeEventListener('message', handleMessage);
      clearInterval(checkClosed);
    }
  }, 1000);
}
export const loginWithFacebook = () => {
  // Try to read intended redirect stored by Login.tsx
  let redirect = '/';
  try {
    const r = sessionStorage.getItem('loginRedirect');
    if (r && r.startsWith('/')) redirect = r;
  } catch {}
  const popup = window.open(
    `${API_BASE_URL}/api/auth/facebook${redirect && redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`,
    'facebookLogin',
    'width=500,height=600,scrollbars=yes,resizable=yes'
  );

  if (!popup) {
    alert('El popup fue bloqueado. Por favor, permite popups para este sitio.');
    return;
  }

  const handleMessage = (event: MessageEvent) => {
    const currentOrigin = window.location.origin;
    const altLocalhost = currentOrigin.replace('127.0.0.1', 'localhost');
    const alt127 = currentOrigin.replace('localhost', '127.0.0.1');
    const allowedOrigins = import.meta.env.DEV
      ? Array.from(new Set([currentOrigin, altLocalhost, alt127]))
      : [currentOrigin];
    const originAllowed = allowedOrigins.includes(event.origin);
    if (!originAllowed) {
      return;
    }
    
    if (event.data.type === 'FACEBOOK_AUTH_SUCCESS' && event.data.token) {
      localStorage.setItem('authToken', event.data.token);
      
      popup?.close();
      // Navigate to stored redirect or fallback to home
      let target = '/';
      try {
        const stored = sessionStorage.getItem('loginRedirect');
        if (stored && stored.startsWith('/')) target = stored;
        sessionStorage.removeItem('loginRedirect');
      } catch {}
      window.location.href = target;
      
      window.removeEventListener('message', handleMessage);
    }
  };

  window.addEventListener('message', handleMessage);

  const checkClosed = setInterval(() => {
    if (popup?.closed) {
      window.removeEventListener('message', handleMessage);
      clearInterval(checkClosed);
    }
  }, 1000);
};

