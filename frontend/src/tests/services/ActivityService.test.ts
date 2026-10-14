import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityService, type CreateActivityParams } from '../../services/ActivityService';
import { supabase } from '../../lib/supabaseClient';

vi.mock('../../lib/supabaseClient', () => {
  const fromMock = vi.fn();
  const authMock = {
    getUser: vi.fn(),
  };
  const rpcMock = vi.fn();

  return {
    supabase: {
      auth: authMock,
      from: fromMock,
      rpc: rpcMock,
    },
  };
});

describe('ActivityService - Formatos HSE e Inyección de responsable_id', () => {
  let activityService: ActivityService;

  beforeEach(() => {
    vi.clearAllMocks();
    activityService = new ActivityService();
  });

  it('createActivity serializa datos_formato_json y asigna responsable_id = auth.uid()', async () => {
    const mockUser = { id: 'usr-inspector-888' };
    ((supabase.auth as any).getUser).mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    const mockParams: CreateActivityParams = {
      codigo_referencia: 'AMON-2026-001',
      tipo_actividad: 'AMONESTACION',
      fecha_operacion: '2026-10-14',
      responsable_nombre: 'Ing. Carlos Mendoza',
      ubicacion: 'Frente Mina Nivel 3',
      descripcion: 'Amonestación por no usar arnés de seguridad en altura',
      datos_formato_json: {
        tipo_formato: 'HSE_EL_F_128',
        datos_amonestado: {
          apellidos_nombres: 'Gómez Perez Juan',
          dni: '44556677',
          cargo: 'Andamiero',
          empresa: 'Contratista Minera SAC',
          ubicacion: 'Nivel 3',
          fecha_hora: '2026-10-14 10:30',
        },
        supervisores_responsables: {
          capataz_cuadrilla: 'Marcos Silva',
          ingeniero_responsable: 'Carlos Mendoza',
          actividad_en_ejecucion: 'Montaje de estructura',
        },
        motivo_amonestacion: {
          codigo_motivo: '02',
          descripcion_motivo: 'Acto Subestándar',
          detalle_motivo: 'Trabajo en altura sin línea de vida conectada',
        },
        nivel_riesgo: '01_INTOLERABLE',
        accion_inmediata_hechos: 'Paralización inmediata y retiro a zona segura',
        sancion_aplicada_risst: '02_SUSPENSION',
        dias_suspension: 3,
        validaciones_firmas: {
          realizado_por: 'Carlos Mendoza',
          aprobado_por: 'Ing. Jefe HSE',
          aceptado_por: 'Juan Gómez',
        },
      },
    };

    const mockCreatedActivity = {
      id: 'act-uuid-555',
      ...mockParams,
      responsable_id: 'usr-inspector-888',
      creado_en: '2026-10-14T10:35:00Z',
      actualizado_en: '2026-10-14T10:35:00Z',
    };

    const createSpy = vi.spyOn(activityService, 'create').mockResolvedValueOnce(mockCreatedActivity as any);

    const result = await activityService.createActivity(mockParams);

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo_referencia: 'AMON-2026-001',
        tipo_actividad: 'AMONESTACION',
        responsable_id: 'usr-inspector-888',
        datos_formato_json: expect.objectContaining({
          tipo_formato: 'HSE_EL_F_128',
        }),
      })
    );
    expect(result.id).toBe('act-uuid-555');
    expect(result.responsable_id).toBe('usr-inspector-888');
  });

  it('createActivity inyecta responsable_id antes de llamar a supabase.from(\'actividades\').insert()', async () => {
    const mockUser = { id: 'usr-inspector-999' };
    ((supabase.auth as any).getUser).mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    const singleMock = vi.fn().mockResolvedValueOnce({
      data: {
        id: 'act-uuid-created-999',
        codigo_referencia: 'AMON-2026-002',
        tipo_actividad: 'AMONESTACION',
        fecha_operacion: '2026-10-14',
        responsable_id: 'usr-inspector-999',
        responsable_nombre: 'Ing. Carlos Mendoza',
        ubicacion: 'Frente Mina Nivel 4',
        descripcion: 'Amonestación directa',
        estado_reporte: 'pendiente',
        datos_formato_json: null,
        creado_en: '2026-10-14T10:35:00Z',
        actualizado_en: '2026-10-14T10:35:00Z',
      },
      error: null,
    });

    const selectMock = vi.fn().mockReturnValue({ single: singleMock });
    const insertMock = vi.fn().mockReturnValue({ select: selectMock });

    (supabase.from as any).mockReturnValueOnce({
      insert: insertMock,
    });

    const result = await activityService.createActivity({
      codigo_referencia: 'AMON-2026-002',
      tipo_actividad: 'AMONESTACION',
      fecha_operacion: '2026-10-14',
      responsable_nombre: 'Ing. Carlos Mendoza',
      ubicacion: 'Frente Mina Nivel 4',
      descripcion: 'Amonestación directa',
    });

    expect(supabase.from).toHaveBeenCalledWith('actividades');
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo_referencia: 'AMON-2026-002',
        tipo_actividad: 'AMONESTACION',
        responsable_id: 'usr-inspector-999',
      })
    );
    expect(result.responsable_id).toBe('usr-inspector-999');
  });

  it('vincularEvidencia invoca el RPC vincular_evidencia_atomica con los parámetros correctos', async () => {
    ((supabase as any).rpc).mockResolvedValueOnce({
      data: true,
      error: null,
    });

    const res = await activityService.vincularEvidencia('evi-1', 'act-1', 'Evidencia fotográfica adjunta', 'hallazgo');

    expect(supabase.rpc).toHaveBeenCalledWith('vincular_evidencia_atomica', {
      p_evidencia_id: 'evi-1',
      p_actividad_id: 'act-1',
      p_notas: 'Evidencia fotográfica adjunta',
      p_rol_evidencia: 'hallazgo',
    });
    expect(res).toBe(true);
  });

  it('vincularMultiplesEvidencias invoca el RPC vincular_multiples_evidencias en lote de forma atómica', async () => {
    ((supabase as any).rpc).mockResolvedValueOnce({
      data: { success: true, vinculados_count: 2 },
      error: null,
    });

    const res = await activityService.vincularMultiplesEvidencias(['evi-1', 'evi-2'], 'act-1', 'correccion');

    expect(supabase.rpc).toHaveBeenCalledWith('vincular_multiples_evidencias', {
      p_evidencia_ids: ['evi-1', 'evi-2'],
      p_actividad_id: 'act-1',
      p_rol_evidencia: 'correccion',
    });
    expect(res.success).toBe(true);
    expect(res.vinculados_count).toBe(2);
  });
});

