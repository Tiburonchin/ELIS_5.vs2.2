import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ProfileSettingsModal } from '@/components/profile/ProfileSettingsModal';
import * as useAuthModule from '@/hooks/useAuth';
import { AuthService } from '@/services/AuthService';

vi.mock('@/hooks/useAuth');
vi.mock('@/services/AuthService');

describe('ProfileSettings and Sidebar Menu Integration', () => {
  const mockLogout = vi.fn();
  const mockRefreshProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: { id: 'usr-hse-1', email: 'carlos.mendoza@empresa.com' } as any,
      profile: {
        id: 'usr-hse-1',
        nombres_completos: 'Carlos Mendoza',
        cargo: 'Supervisor HSE',
        rol: 'supervisor',
        telefono: '+51 999888777',
        creado_en: '2026-10-14T00:00:00Z',
        actualizado_en: '2026-10-14T00:00:00Z',
      },
      session: {} as any,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: mockLogout,
      refreshProfile: mockRefreshProfile,
    });
  });

  it('abre el menú desplegable al hacer clic en el perfil de la barra lateral sin crashes', async () => {
    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    );

    // Debe mostrar nombre y cargo en el sidebar
    const profileTrigger = screen.getByText('Carlos Mendoza');
    expect(profileTrigger).toBeInTheDocument();

    // Simular clic en el perfil del Sidebar
    fireEvent.click(profileTrigger);

    // Debe abrir las opciones del DropdownMenu sin lanzar error
    await waitFor(() => {
      expect(screen.getByText('Mi Perfil y Firma HSE')).toBeInTheDocument();
      expect(screen.getByText('Preferencias de Interfaz')).toBeInTheDocument();
      expect(screen.getByText('Configuración de Voz (Orbe)')).toBeInTheDocument();
      expect(screen.getByText('Cerrar Sesión Segura')).toBeInTheDocument();
    });
  });

  it('permite abrir el modal de personalización y actualizar nombres y cargo en public.perfiles', async () => {
    vi.spyOn(AuthService, 'updateProfile').mockResolvedValueOnce({
      data: {
        id: 'usr-hse-1',
        nombres_completos: 'Ing. Carlos Mendoza Llerena',
        cargo: 'Gerente HSE Operaciones',
        rol: 'supervisor',
        telefono: '+51 987654321',
        creado_en: '2026-10-14T00:00:00Z',
        actualizado_en: '2026-10-14T01:00:00Z',
      },
      error: null,
    });

    const mockOnOpenChange = vi.fn();

    render(
      <ProfileSettingsModal
        open={true}
        onOpenChange={mockOnOpenChange}
        defaultTab="perfil"
      />
    );

    expect(screen.getByText('Centro de Personalización & Perfil')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Carlos Mendoza')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Supervisor HSE')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Nombres y Apellidos Completos/i);
    const cargoInput = screen.getByLabelText(/Cargo Operativo/i);
    const saveBtn = screen.getByRole('button', { name: /Guardar Perfil y Firma/i });

    fireEvent.change(nameInput, { target: { value: 'Ing. Carlos Mendoza Llerena' } });
    fireEvent.change(cargoInput, { target: { value: 'Gerente HSE Operaciones' } });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(AuthService.updateProfile).toHaveBeenCalledWith({
        nombres_completos: 'Ing. Carlos Mendoza Llerena',
        cargo: 'Gerente HSE Operaciones',
        telefono: '+51 999888777',
      });
      expect(screen.getByText(/Perfil y firma HSE actualizados exitosamente en la base de datos/i)).toBeInTheDocument();
      expect(mockRefreshProfile).toHaveBeenCalled();
    });
  });

  it('cambia entre pestañas de Personalización (Apariencia y Voz)', async () => {
    render(
      <ProfileSettingsModal
        open={true}
        onOpenChange={vi.fn()}
        defaultTab="perfil"
      />
    );

    // Clic en pestaña Apariencia
    const appearanceTab = screen.getByRole('tab', { name: /Apariencia/i });
    fireEvent.click(appearanceTab);

    await waitFor(() => {
      expect(screen.getByText(/Alto Contraste para Exteriores/i)).toBeInTheDocument();
      expect(screen.getByText('Esmeralda HSE')).toBeInTheDocument();
    });

    // Clic en pestaña Voz & Dispositivo
    const voiceTab = screen.getByRole('tab', { name: /Voz & Dispositivo/i });
    fireEvent.click(voiceTab);

    await waitFor(() => {
      expect(screen.getByText(/Respuesta Hablada por Voz/i)).toBeInTheDocument();
      expect(screen.getByText(/Calidad de Compresión WebP en Cliente/i)).toBeInTheDocument();
    });
  });
});
