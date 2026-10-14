import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseSupabaseService, RlsSecurityError } from '../../services/BaseSupabaseService';
import { supabase } from '../../lib/supabaseClient';

vi.mock('../../lib/supabaseClient', () => {
  const fromMock = vi.fn();
  const authMock = {
    getUser: vi.fn(),
  };

  return {
    supabase: {
      auth: authMock,
      from: fromMock,
    },
  };
});

describe('BaseSupabaseService - Inyección de auth.uid() y Manejo RLS', () => {
  let baseService: BaseSupabaseService<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    baseService = new BaseSupabaseService('actividades');
  });

  it('getCurrentUserId retorna el id del usuario cuando existe sesión activa', async () => {
    ((supabase.auth as any).getUser).mockResolvedValueOnce({
      data: { user: { id: 'usr-active-777' } },
      error: null,
    });

    const uid = await baseService.getCurrentUserId();
    expect(uid).toBe('usr-active-777');
  });

  it('getCurrentUserId retorna null si no hay sesión activa', async () => {
    ((supabase.auth as any).getUser).mockResolvedValueOnce({
      data: { user: null },
      error: new Error('No session'),
    });

    const uid = await baseService.getCurrentUserId();
    expect(uid).toBeNull();
  });

  it('create inyecta automáticamente responsable_id con auth.uid() si el registro no lo define', async () => {
    ((supabase.auth as any).getUser).mockResolvedValueOnce({
      data: { user: { id: 'usr-active-777' } },
      error: null,
    });

    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValueOnce({
          data: {
            id: 'act-1',
            codigo_referencia: 'ACT-001',
            responsable_id: 'usr-active-777',
          },
          error: null,
        }),
      }),
    });

    (supabase.from as any).mockReturnValueOnce({ insert: insertMock });

    const result = await baseService.create({
      codigo_referencia: 'ACT-001',
      responsable_id: null,
    });

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo_referencia: 'ACT-001',
        responsable_id: 'usr-active-777',
      })
    );
    expect(result.responsable_id).toBe('usr-active-777');
  });

  it('transforma errores de postgres con código 42501 en RlsSecurityError', async () => {
    ((supabase.auth as any).getUser).mockResolvedValueOnce({
      data: { user: { id: 'usr-active-777' } },
      error: null,
    });

    const rlsDbError = {
      code: '42501',
      message: 'new row violates row-level security policy for table "actividades"',
      details: 'Failing row contains ...',
    };

    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValueOnce({
          data: null,
          error: rlsDbError,
        }),
      }),
    });

    (supabase.from as any).mockReturnValueOnce({ insert: insertMock });

    await expect(
      baseService.create({
        codigo_referencia: 'ACT-002',
      })
    ).rejects.toThrow(RlsSecurityError);
  });
});
