import { useState, useEffect } from 'react';

/**
 * Hook reactivo que rastrea el estado de conexión del navegador en tiempo real.
 * Se suscribe a los eventos `online` y `offline` de `window` y expone `navigator.onLine`.
 * Usado en el indicador "Modo PWA Offline" del sidebar.
 */
export function useOnlineStatus(): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
