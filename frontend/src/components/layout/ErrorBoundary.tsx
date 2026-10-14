import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Capturado error no manejado de renderizado:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-muted/40 antialiased">
          <Card className="w-full max-w-lg shadow-xl border-destructive/30 bg-card rounded-2xl overflow-hidden">
            <CardHeader className="text-center space-y-2 pb-4 border-b border-border/50">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-xs">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                Interrupción de Interfaz Prevenida
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground max-w-sm mx-auto">
                El sistema de seguridad de ELIS ha interceptado un error de renderizado para evitar que la aplicación quede en blanco.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1.5 font-mono break-all">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{this.state.error?.name || 'Error de Renderizado'}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {this.state.error?.message || 'Se produjo una excepción inesperada durante el renderizado del componente.'}
                </p>
              </div>

              {this.state.errorInfo?.componentStack && (
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Pila de Componentes Afectados
                  </span>
                  <pre className="max-h-32 overflow-auto text-[9.5px] p-2.5 rounded-lg bg-muted text-muted-foreground font-mono leading-tight border border-border">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-border/50 bg-muted/20">
              <Button
                variant="default"
                size="sm"
                onClick={this.handleReset}
                className="w-full sm:w-auto flex-1 text-xs h-9 cursor-pointer gap-2"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reintentar Vista</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReload}
                className="w-full sm:w-auto flex-1 text-xs h-9 cursor-pointer gap-2"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Recargar Sistema</span>
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
