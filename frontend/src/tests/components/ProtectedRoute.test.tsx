import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import * as useAuthModule from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth');

describe('ProtectedRoute Component', () => {
  it('muestra estado de carga mientras se resuelve la sesión (isLoading: true)', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      profile: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Contenido Privado</div>
      </ProtectedRoute>
    );

    expect(screen.getByText(/Validando credenciales corporativas en Supabase Auth/i)).toBeInTheDocument();
    expect(screen.queryByText('Contenido Privado')).not.toBeInTheDocument();
  });

  it('renderiza la pantalla de LoginPage si el usuario NO está autenticado (isAuthenticated: false)', async () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      profile: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Contenido Privado</div>
      </ProtectedRoute>
    );

    // Debe resolver la carga de React.lazy y mostrar la tarjeta de Login
    expect(await screen.findByText('ELIS 5.0')).toBeInTheDocument();
    expect(screen.getByText(/Ingresar al Sistema/i)).toBeInTheDocument();
    expect(screen.getByText(/Continuar con Google/i)).toBeInTheDocument();
    expect(screen.queryByText('Contenido Privado')).not.toBeInTheDocument();
  });

  it('renderiza correctamente los children si el usuario ESTÁ autenticado (isAuthenticated: true)', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: { id: 'usr-123', email: 'inspector@elis.pe' } as any,
      profile: { id: 'usr-123', nombres_completos: 'Juan Pérez', cargo: 'Inspector HSE' } as any,
      session: {} as any,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <ProtectedRoute>
        <div data-testid="dashboard-content">Panel Principal de Inspecciones</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    expect(screen.getByText('Panel Principal de Inspecciones')).toBeInTheDocument();
  });
});
