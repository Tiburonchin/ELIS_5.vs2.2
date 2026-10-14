import React, { lazy, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-6 space-y-6">
        <div className="w-full max-w-md p-6 rounded-2xl border border-border/60 bg-card shadow-lg space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground animate-pulse">
                Validando credenciales corporativas en Supabase Auth...
              </span>
            </div>
            <Skeleton className="h-7 w-20 rounded-md" />
          </div>
        </div>
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
