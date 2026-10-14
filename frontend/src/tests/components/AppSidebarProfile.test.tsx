import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import * as useAuthModule from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth');

describe('AppSidebar Profile & Navigation Component', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra la información del perfil del inspector (nombres y cargo) usando Avatar y labels de shadcn', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: { id: 'usr-999', email: 'supervisor@empresa.com' } as any,
      profile: {
        id: 'usr-999',
        nombres_completos: 'Inspector Prueba',
        cargo: 'Supervisor',
        rol: 'supervisor',
      } as any,
      session: {} as any,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: mockLogout,
      refreshProfile: vi.fn(),
    });

    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    );

    // Debe mostrar el nombre completo del mock
    expect(screen.getByText('Inspector Prueba')).toBeInTheDocument();
    // Debe mostrar el cargo del mock
    expect(screen.getByText('Supervisor')).toBeInTheDocument();
    // Avatar debe contener las iniciales calculadas ("IP")
    expect(screen.getByText('IP')).toBeInTheDocument();
  });

  it('muestra fallback con el correo o valores por defecto si el perfil no contiene nombres', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: { id: 'usr-001', email: 'carlos.ramirez@empresa.com' } as any,
      profile: null,
      session: {} as any,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: mockLogout,
      refreshProfile: vi.fn(),
    });

    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    );

    expect(screen.getByText('carlos.ramirez')).toBeInTheDocument();
    expect(screen.getByText('Supervisor HSE')).toBeInTheDocument();
  });
});
