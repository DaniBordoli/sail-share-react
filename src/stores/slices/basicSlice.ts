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
  const popup = window.open(
    `${API_BASE_URL}/api/auth/google`,
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
      window.location.href = '/';
      
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
  const popup = window.open(
    `${API_BASE_URL}/api/auth/facebook`,
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
      window.location.href = '/';
      
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

