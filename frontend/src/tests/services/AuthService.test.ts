import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../services/AuthService';
import { supabase } from '../../lib/supabaseClient';

vi.mock('../../lib/supabaseClient', () => {
  const fromMock = vi.fn();
  const authMock = {
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(),
  };

  return {
    supabase: {
      auth: authMock,
      from: fromMock,
    },
  };
});

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('inicia sesión exitosamente y retorna el usuario y la sesión', async () => {
      const mockUser = { id: 'usr-1234', email: 'inspector@elis-peru.com' };
      const mockSession = { access_token: 'jwt-token-123', user: mockUser };

      ((supabase.auth as any).signInWithPassword).mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const response = await AuthService.signIn('inspector@elis-peru.com', 'ClaveSegura123!');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'inspector@elis-peru.com',
        password: 'ClaveSegura123!',
      });
      expect(response.error).toBeNull();
      expect(response.data?.user.id).toBe('usr-1234');
      expect(response.data?.session.access_token).toBe('jwt-token-123');
    });

    it('retorna error cuando las credenciales son inválidas', async () => {
      const authError = new Error('Invalid login credentials');
      ((supabase.auth as any).signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: authError,
      });

      const response = await AuthService.signIn('err@elis.com', 'wrong');

      expect(response.data).toBeNull();
      expect(response.error).toBe(authError);
    });
  });

  describe('signOut', () => {
    it('cierra la sesión correctamente', async () => {
      ((supabase.auth as any).signOut).mockResolvedValueOnce({ error: null });

      const response = await AuthService.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(response.error).toBeNull();
    });

    it('maneja errores en signOut', async () => {
      const signOutErr = new Error('Network error');
      ((supabase.auth as any).signOut).mockResolvedValueOnce({ error: signOutErr });

      const response = await AuthService.signOut();

      expect(response.error).toBe(signOutErr);
    });
  });

  describe('getCurrentProfile', () => {
    it('obtiene el perfil desde public.perfiles para el usuario autenticado', async () => {
      const mockUser = { id: 'usr-supervisor-99', email: 'supervisor@elis-mina.com' };
      ((supabase.auth as any).getUser).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const mockProfile = {
        id: 'usr-supervisor-99',
        nombres_completos: 'Juan Pérez Alva',
        cargo: 'Supervisor General HSE',
        rol: 'supervisor',
        telefono: '+51 987654321',
        creado_en: '2026-10-14T00:00:00Z',
        actualizado_en: '2026-10-14T00:00:00Z',
      };

      const maybeSingleMock = vi.fn().mockResolvedValueOnce({
        data: mockProfile,
        error: null,
      });
      const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      (supabase.from as any).mockReturnValueOnce({ select: selectMock });

      const response = await AuthService.getCurrentProfile();

      expect(supabase.from).toHaveBeenCalledWith('perfiles');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(eqMock).toHaveBeenCalledWith('id', 'usr-supervisor-99');
      expect(response.data?.nombres_completos).toBe('Juan Pérez Alva');
      expect(response.data?.rol).toBe('supervisor');
    });

    it('retorna null si no hay usuario autenticado', async () => {
      ((supabase.auth as any).getUser).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const response = await AuthService.getCurrentProfile();

      expect(response.data).toBeNull();
      expect(response.error).toBeNull();
    });
  });
});
