import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';
import { AuthService } from '../../services/AuthService';
import { supabase } from '../../lib/supabaseClient';

vi.mock('../../services/AuthService', () => ({
  AuthService: {
    getSession: vi.fn(),
    getCurrentProfile: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  },
}));

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
    },
  },
}));

describe('useAuth Hook', () => {
  let authStateCallback: ((event: string, session: any) => void) | null = null;
  const unsubscribeMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (supabase.auth.onAuthStateChange as any).mockImplementation((callback: any) => {
      authStateCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: unsubscribeMock,
          },
        },
      };
    });
  });

  it('inicia cargando y resuelve el estado con usuario y perfil si existe sesión', async () => {
    const mockUser = { id: 'usr-123', email: 'inspector@elis.app' };
    const mockSession = { access_token: 'token-abc', user: mockUser };
    const mockProfile = {
      id: 'usr-123',
      nombres_completos: 'Carlos Rojas',
      cargo: 'Inspector HSE Mina',
      rol: 'inspector' as const,
      telefono: '999888777',
      creado_en: '2026-10-14T00:00:00Z',
      actualizado_en: '2026-10-14T00:00:00Z',
    };

    (AuthService.getSession as any).mockResolvedValueOnce({
      data: mockSession,
      error: null,
    });
    (AuthService.getCurrentProfile as any).mockResolvedValueOnce({
      data: mockProfile,
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    // 1. Validar que el estado inicial isLoading sea verdadero de inmediato
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();

    // 2. Esperar a que se completen los efectos de carga inicial
    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.id).toBe('usr-123');
    expect(result.current.profile?.nombres_completos).toBe('Carlos Rojas');
    expect(result.current.profile?.cargo).toBe('Inspector HSE Mina');
  });

  it('permite iniciar sesión y actualiza el estado reactivo', async () => {
    (AuthService.getSession as any).mockResolvedValueOnce({ data: null, error: null });
    (AuthService.getCurrentProfile as any).mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useAuth());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);

    const mockUser = { id: 'usr-456', email: 'test@elis.app' };
    const mockSession = { access_token: 'token-xyz', user: mockUser };
    const mockProfile = {
      id: 'usr-456',
      nombres_completos: 'Ana Valdivia',
      cargo: 'Supervisora SST',
      rol: 'supervisor' as const,
      telefono: null,
      creado_en: '2026-10-14T00:00:00Z',
      actualizado_en: '2026-10-14T00:00:00Z',
    };

    (AuthService.signIn as any).mockResolvedValueOnce({
      data: { user: mockUser, session: mockSession },
      error: null,
    });
    (AuthService.getCurrentProfile as any).mockResolvedValueOnce({
      data: mockProfile,
      error: null,
    });

    await act(async () => {
      const loginRes = await result.current.login('test@elis.app', 'Secret123!');
      expect(loginRes.success).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('test@elis.app');
    expect(result.current.profile?.nombres_completos).toBe('Ana Valdivia');
  });

  it('permite cerrar sesión y limpia el perfil y usuario', async () => {
    const mockUser = { id: 'usr-123', email: 'inspector@elis.app' };
    const mockSession = { access_token: 'token-abc', user: mockUser };

    (AuthService.getSession as any).mockResolvedValueOnce({
      data: mockSession,
      error: null,
    });
    (AuthService.getCurrentProfile as any).mockResolvedValueOnce({
      data: { id: 'usr-123', nombres_completos: 'Carlos Rojas' },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await vi.waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    (AuthService.signOut as any).mockResolvedValueOnce({ data: undefined, error: null });

    await act(async () => {
      const logoutRes = await result.current.logout();
      expect(logoutRes.success).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it('reacciona al evento SIGNED_IN de onAuthStateChange', async () => {
    (AuthService.getSession as any).mockResolvedValueOnce({ data: null, error: null });

    const { result } = renderHook(() => useAuth());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const externalUser = { id: 'usr-789', email: 'external@elis.app' };
    const externalSession = { access_token: 'ext-token', user: externalUser };
    const externalProfile = {
      id: 'usr-789',
      nombres_completos: 'Pedro Suárez',
      cargo: 'Auditor Externo',
      rol: 'supervisor' as const,
      telefono: null,
      creado_en: '2026-10-14T00:00:00Z',
      actualizado_en: '2026-10-14T00:00:00Z',
    };

    (AuthService.getCurrentProfile as any).mockResolvedValueOnce({
      data: externalProfile,
      error: null,
    });

    await act(async () => {
      if (authStateCallback) {
        await authStateCallback('SIGNED_IN', externalSession);
      }
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.id).toBe('usr-789');
    expect(result.current.profile?.nombres_completos).toBe('Pedro Suárez');
  });
});
