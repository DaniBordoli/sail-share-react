import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const provider = searchParams.get('provider') || 'google'; 
    
    if (token) {
    
      if (window.opener) {
        
        const messageType = provider === 'facebook' ? 'FACEBOOK_AUTH_SUCCESS' : 'GOOGLE_AUTH_SUCCESS';
        
        const payload = { type: messageType, token, provider } as const;
        const defaultOrigin = window.location.origin;
        const altLocalhost = defaultOrigin.replace('127.0.0.1', 'localhost');
        const alt127 = defaultOrigin.replace('localhost', '127.0.0.1');
        const targets = import.meta.env.DEV
          ? Array.from(new Set([defaultOrigin, altLocalhost, alt127]))
          : [defaultOrigin];
        
        for (const target of targets) {
          try { window.opener.postMessage(payload, target); } catch (e) {}
        }
        
        window.close();
      } else {
        localStorage.setItem('authToken', token);
        window.location.href = '/';
      }
    } else {
      if (window.opener) {
        window.close();
      } else {
        window.location.href = '/login';
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Procesando autenticación...</h2>
        <p className="text-muted-foreground">Esta ventana se cerrará automáticamente.</p>
      </div>
    </div>
  );
};

export default AuthSuccess;
