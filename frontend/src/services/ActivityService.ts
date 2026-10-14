import { BaseSupabaseService } from './BaseSupabaseService';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/database.types';

export type ActividadRow = Database['public']['Tables']['actividades']['Row'];
export type ActividadInsert = Database['public']['Tables']['actividades']['Insert'];
export type ActividadUpdate = Database['public']['Tables']['actividades']['Update'];

export class ActivityService extends BaseSupabaseService<
  ActividadRow,
  ActividadInsert,
  ActividadUpdate
> {
  constructor() {
    super('actividades');
  }

  /**
   * Obtiene una actividad por su código de referencia único
   */
  async getByCodigoReferencia(codigo: string): Promise<ActividadRow | null> {
    const { data, error } = await supabase
      .from('actividades')
      .select('*')
      .eq('codigo_referencia', codigo)
      .maybeSingle();

    if (error) {
      console.error('[ActivityService] Error buscando por código de referencia:', error);
      throw error;
    }

    return data;
  }

  /**
   * Vincula atómicamente una evidencia a esta actividad mediante el RPC de Supabase
   */
  async vincularEvidencia(evidenciaId: string, actividadId: string, notas?: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('vincular_evidencia_atomica', {
      p_evidencia_id: evidenciaId,
      p_actividad_id: actividadId,
      p_notas: notas,
    });

    if (error) {
      console.error('[ActivityService] Error en RPC vincular_evidencia_atomica:', error);
      throw error;
    }

    return Boolean(data);
  }

  /**
   * Obtiene todas las evidencias vinculadas a una actividad junto con sus identificaciones OCR
   */
  async getEvidenciasVinculadas(actividadId: string): Promise<Array<{
    vinculo: Database['public']['Tables']['vinculos']['Row'];
    evidencia: Database['public']['Tables']['evidencias']['Row'];
    identificacion: Database['public']['Tables']['identificaciones']['Row'] | null;
  }>> {
    // 1. Consultar los vínculos de la actividad
    const { data: vinculos, error: vinculosError } = await supabase
      .from('vinculos')
      .select('*')
      .eq('actividad_id', actividadId)
      .order('vinculado_en', { ascending: false });

    if (vinculosError) {
      console.error('[ActivityService] Error obteniendo vínculos de la actividad:', vinculosError);
      throw vinculosError;
    }

    if (!vinculos || vinculos.length === 0) {
      return [];
    }

    const evidenciaIds = vinculos.map((v) => v.evidencia_id);

    // 2. Consultar las evidencias correspondientes
    const { data: evidencias, error: evidenciasError } = await supabase
      .from('evidencias')
      .select('*')
      .in('id', evidenciaIds);

    if (evidenciasError) {
      console.error('[ActivityService] Error obteniendo evidencias vinculadas:', evidenciasError);
      throw evidenciasError;
    }

    // 3. Consultar las identificaciones OCR de estas evidencias
    const { data: identificaciones, error: ocrError } = await supabase
      .from('identificaciones')
      .select('*')
      .in('evidencia_id', evidenciaIds);

    if (ocrError) {
      console.warn('[ActivityService] Advertencia consultando identificaciones OCR:', ocrError);
    }

    const evidenciasMap = new Map((evidencias || []).map((e) => [e.id, e]));
    const identMap = new Map((identificaciones || []).map((i) => [i.evidencia_id, i]));

    return vinculos
      .map((v) => {
        const ev = evidenciasMap.get(v.evidencia_id);
        if (!ev) return null;
        return {
          vinculo: v,
          evidencia: ev,
          identificacion: identMap.get(v.evidencia_id) || null,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }
}

export const activityService = new ActivityService();
