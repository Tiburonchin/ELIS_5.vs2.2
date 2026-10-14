import { BaseSupabaseService } from './BaseSupabaseService';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/database.types';

export type IdentificacionRow = Database['public']['Tables']['identificaciones']['Row'];
export type IdentificacionInsert = Database['public']['Tables']['identificaciones']['Insert'];
export type IdentificacionUpdate = Database['public']['Tables']['identificaciones']['Update'];

export interface SaveHumanValidationParams {
  evidencia_id: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  cargo?: string | null;
  nivel_confianza?: number | null;
  texto_crudo_ocr?: string | null;
}

export class OcrService extends BaseSupabaseService<
  IdentificacionRow,
  IdentificacionInsert,
  IdentificacionUpdate
> {
  constructor() {
    super('identificaciones');
  }

  /**
   * Obtiene la identificación asociada a una evidencia por su evidencia_id
   */
  async getByEvidenciaId(evidenciaId: string): Promise<IdentificacionRow | null> {
    return this.getById(evidenciaId, 'evidencia_id');
  }

  /**
   * Guarda o actualiza la validación humana del fotocheck.
   * Asocia explícitamente confirmado_por = auth.uid() y confirmador_email con la sesión de auth actual.
   */
  async saveHumanValidation(params: SaveHumanValidationParams): Promise<IdentificacionRow> {
    try {
      // 1. Obtener datos del usuario logueado mediante supabase.auth.getUser()
      const { data: authData } = await (supabase.auth as any).getUser();
      const user = authData?.user;

      const recordToInsert: IdentificacionInsert = {
        evidencia_id: params.evidencia_id,
        nombres: params.nombres.trim(),
        apellido_paterno: params.apellido_paterno.trim(),
        apellido_materno: params.apellido_materno.trim(),
        cargo: params.cargo ? params.cargo.trim() : null,
        nivel_confianza: params.nivel_confianza ?? null,
        texto_crudo_ocr: params.texto_crudo_ocr ?? null,
        confirmado_por: user?.id ?? null,
        confirmador_email: user?.email ?? (user?.id ? `user-${user.id.slice(0, 8)}` : 'operario_local@elis.app'),
        confirmado_en: new Date().toISOString(),
      };

      // 2. Verificar si ya existe un registro para esta evidencia (evidencia_id es 1:1)
      const existing = await this.getByEvidenciaId(params.evidencia_id);

      if (existing) {
        const { data, error } = await supabase
          .from('identificaciones')
          .update(recordToInsert)
          .eq('evidencia_id', params.evidencia_id)
          .select()
          .single();

        if (error) {
          this.handleDatabaseError(error, `update identificacion (${params.evidencia_id})`);
        }
        return data as IdentificacionRow;
      }

      return await this.create(recordToInsert);
    } catch (error) {
      console.error('[OcrService] Error en saveHumanValidation:', error);
      throw error;
    }
  }
}

export const ocrService = new OcrService();
