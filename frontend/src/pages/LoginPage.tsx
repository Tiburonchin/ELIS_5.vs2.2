import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthService } from '@/services/AuthService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

export interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor ingrese su correo electrónico corporativo y contraseña.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      if (!res.success) {
        setErrorMessage(
          res.error?.message.includes('Invalid login credentials')
            ? 'Credenciales incorrectas. Verifique su correo o contraseña.'
            : res.error?.message || 'Error al iniciar sesión. Inténtelo nuevamente.'
        );
      } else {
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error inesperado al conectar con el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setGoogleSubmitting(true);
    try {
      const { error } = await AuthService.signInWithGoogle();
      if (error) {
        setErrorMessage(error.message || 'Error al conectar con Google OAuth corporativo.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error inesperado con Google OAuth.');
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const isBusy = submitting || authLoading || googleSubmitting;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-4 sm:p-6 antialiased">
      {/* Tarjeta de Inicio de Sesión Corporativa */}
      <Card className="w-full max-w-md shadow-lg border-border/60 bg-card">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            ELIS 5.0
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground max-w-xs mx-auto">
            Entorno Local Inteligente y Seguro &bull; Control Forense &amp; Seguridad Operativa HSE
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-start gap-2 animate-in fade-in duration-200"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-xs font-medium text-foreground">
                Correo Electrónico Corporativo
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="inspector@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isBusy}
                  className="pl-9 text-xs h-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-xs font-medium text-foreground">
                  Contraseña
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isBusy}
                  className="pl-9 text-xs h-9"
                  required
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={isBusy}
              className="w-full text-xs font-medium h-9 cursor-pointer gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <span>Ingresar al Sistema</span>
              )}
            </Button>

            {/* Separador con texto */}
            <div className="relative my-2 w-full flex items-center justify-center">
              <Separator className="w-full" />
              <span className="absolute bg-card px-2 text-[11px] text-muted-foreground uppercase font-medium tracking-wider">
                O continuar con
              </span>
            </div>

            {/* Botón de Google OAuth */}
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={handleGoogleLogin}
              className="w-full text-xs font-medium h-9 cursor-pointer gap-2 border-border/80 hover:bg-muted/60"
            >
              {googleSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Conectando con Google...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Continuar con Google</span>
                </>
              )}
            </Button>

            <p className="text-[11px] text-center text-muted-foreground pt-1">
              Acceso restringido únicamente a inspectores y supervisores acreditados.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
