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
}

export const activityService = new ActivityService();
