import { API_BASE_URL } from '@/lib/api';

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
