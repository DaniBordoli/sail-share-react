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
export const loginUser = async (credentials: LoginCredentials): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
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
    console.log('Mensaje recibido:', event.data);
    
    if (event.origin !== window.location.origin) {
      console.log('Origen no válido:', event.origin);
      return;
    }
    
    if (event.data.type === 'GOOGLE_AUTH_SUCCESS' && event.data.token) {
      console.log('Token recibido:', event.data.token);
      

      localStorage.setItem('authToken', event.data.token);
      
  
      popup?.close();
      
   
      window.location.href = '/';
      

      window.removeEventListener('message', handleMessage);
    }
  };

  window.addEventListener('message', handleMessage);

  const checkClosed = setInterval(() => {
    if (popup?.closed) {
      console.log('Popup cerrado manualmente');
      window.removeEventListener('message', handleMessage);
      clearInterval(checkClosed);
    }
  }, 1000);
};


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
    console.log('Mensaje de Facebook recibido:', event.data);
    
    if (event.origin !== window.location.origin) {
      console.log('Origen no válido:', event.origin);
      return;
    }
    
    if (event.data.type === 'FACEBOOK_AUTH_SUCCESS' && event.data.token) {
      console.log('Token de Facebook recibido:', event.data.token);
      

      localStorage.setItem('authToken', event.data.token);
      
 
      popup?.close();
      
  
      window.location.href = '/';
      
 
      window.removeEventListener('message', handleMessage);
    }
  };

  window.addEventListener('message', handleMessage);


  const checkClosed = setInterval(() => {
    if (popup?.closed) {
      console.log('Popup de Facebook cerrado manualmente');
      window.removeEventListener('message', handleMessage);
      clearInterval(checkClosed);
    }
  }, 1000);
};
