import React, { lazy, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

// Carga perezosa (Code Splitting) para aislar el bundle de login del núcleo de la app
const LoginPageLazy = lazy(() => import('@/pages/LoginPage'));

export interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Estado de carga inicial mientras se resuelve la sesión JWT de Supabase
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground animate-pulse">
          Validando credenciales corporativas en Supabase Auth...
        </p>
      </div>
    );
  }

  // Si no está autenticado, renderizar la pantalla de login corporativo bajo Suspense
  if (!isAuthenticated) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground animate-pulse">
              Cargando portal de acceso...
            </p>
          </div>
        }
      >
        <LoginPageLazy />
      </Suspense>
    );
  }

  // Acceso concedido a las rutas operativas protegidas
  return <>{children}</>;
};

export default ProtectedRoute;
