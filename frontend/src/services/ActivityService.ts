import { BaseSupabaseService } from './BaseSupabaseService';
import { supabase } from '../lib/supabaseClient';
import type { Database, Json } from '../types/database.types';

export type ActividadRow = Database['public']['Tables']['actividades']['Row'];
export type ActividadInsert = Database['public']['Tables']['actividades']['Insert'];
export type ActividadUpdate = Database['public']['Tables']['actividades']['Update'];
export type TipoActividad = 'INSPECCION' | 'CAPACITACION' | 'AUDITORIA' | 'AMONESTACION';

/**
 * Estructura de ítem para el Checklist de 15 Secciones HSE
 */
export interface HseChecklistItem {
  seccion_id: number;
  seccion_nombre: string;
  item_codigo: string;
  descripcion: string;
  calificacion: 'S' | 'ER' | 'PI' | 'NA'; // Seguro | En Riesgo | Peligro Inminente | No Aplica
  observacion?: string;
  medida_correctiva?: string;
}

/**
 * Estructura del formato de Inspección HSE (15 Secciones)
 */
export interface HseInspectionFormat {
  tipo_formato: 'CHECKLIST_15_SECCIONES';
  inspector_nombres: string;
  area_supervisada: string;
  items: HseChecklistItem[];
  conclusiones?: string;
  porcentaje_cumplimiento?: number;
}

/**
 * Estructura del Formato de Registro de Amonestación HSE-EL-F-128
 */
export interface HseAmonestacionFormat {
  tipo_formato: 'HSE_EL_F_128';
  datos_amonestado: {
    apellidos_nombres: string;
    dni: string;
    cargo: string;
    empresa: string;
    ubicacion: string;
    fecha_hora: string;
  };
  supervisores_responsables: {
    capataz_cuadrilla: string;
    ingeniero_responsable: string;
    actividad_en_ejecucion: string;
  };
  motivo_amonestacion: {
    codigo_motivo: '01' | '02' | '03' | '04'; // 01: Falta RIIST, 02: Acto Subestándar, 03: Obs HSE, 04: Condición Subestándar
    descripcion_motivo: string;
    detalle_motivo: string;
  };
  nivel_riesgo: '01_INTOLERABLE' | '02_BAJO' | '03_MODERADO' | '04_OTRO';
  accion_inmediata_hechos: string;
  sancion_aplicada_risst: '01_LLAMADA_ATENCION' | '02_SUSPENSION' | '03_RETIRO_INMEDIATO' | '04_OTRO';
  dias_suspension?: number;
  validaciones_firmas: {
    realizado_por: string; // Inspector HSE
    aprobado_por: string; // Ing. Residente / Jefe HSE
    aceptado_por: string; // Trabajador amonestado
  };
}

export type DatosFormatoHse = HseInspectionFormat | HseAmonestacionFormat | Record<string, unknown>;

export interface CreateActivityParams {
  codigo_referencia: string;
  tipo_actividad: TipoActividad;
  fecha_operacion: string;
  responsable_nombre: string;
  ubicacion: string;
  descripcion?: string | null;
  estado_reporte?: 'pendiente' | 'exportada' | 'publicada';
  datos_formato_json?: DatosFormatoHse | null;
  responsable_id?: string | null;
}

export class ActivityService extends BaseSupabaseService<
  ActividadRow,
  ActividadInsert,
  ActividadUpdate
> {
  constructor() {
    super('actividades');
  }

  /**
   * Crea una actividad asignando automáticamente el responsable_id = auth.uid()
   * y serializando los formatos corporativos en datos_formato_json.
   */
  async createActivity(params: CreateActivityParams): Promise<ActividadRow> {
    const currentUserId = await this.getCurrentUserId();

    const recordToInsert: ActividadInsert = {
      codigo_referencia: params.codigo_referencia.trim(),
      tipo_actividad: params.tipo_actividad,
      fecha_operacion: params.fecha_operacion,
      responsable_nombre: params.responsable_nombre.trim(),
      ubicacion: params.ubicacion.trim(),
      descripcion: params.descripcion ? params.descripcion.trim() : null,
      estado_reporte: params.estado_reporte || 'pendiente',
      datos_formato_json: (params.datos_formato_json as unknown as Json) ?? null,
      responsable_id: params.responsable_id || currentUserId || null,
    };

    return this.create(recordToInsert);
  }

  /**
   * Obtiene una actividad por su código de referencia único
   */
  async getByCodigoReferencia(codigo: string): Promise<ActividadRow | null> {
    try {
      const { data, error } = await supabase
        .from('actividades')
        .select('*')
        .eq('codigo_referencia', codigo)
        .maybeSingle();

      if (error) {
        this.handleDatabaseError(error, `getByCodigoReferencia (${codigo})`);
      }

      return data as ActividadRow | null;
    } catch (error) {
      console.error('[ActivityService] Error buscando por código de referencia:', error);
      throw error;
    }
  }

  /**
   * Vincula atómicamente una evidencia a esta actividad mediante el RPC de Supabase
   */
  async vincularEvidencia(evidenciaId: string, actividadId: string, notas?: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('vincular_evidencia_atomica', {
        p_evidencia_id: evidenciaId,
        p_actividad_id: actividadId,
        p_notas: notas,
      });

      if (error) {
        this.handleDatabaseError(error, 'rpc vincular_evidencia_atomica');
      }

      return Boolean(data);
    } catch (error) {
      console.error('[ActivityService] Error en RPC vincular_evidencia_atomica:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las evidencias vinculadas a una actividad junto con sus identificaciones OCR
   */
  async getEvidenciasVinculadas(actividadId: string): Promise<Array<{
    vinculo: Database['public']['Tables']['vinculos']['Row'];
    evidencia: Database['public']['Tables']['evidencias']['Row'];
    identificacion: Database['public']['Tables']['identificaciones']['Row'] | null;
  }>> {
    try {
      // 1. Consultar los vínculos de la actividad
      const { data: vinculos, error: vinculosError } = await supabase
        .from('vinculos')
        .select('*')
        .eq('actividad_id', actividadId)
        .order('vinculado_en', { ascending: false });

      if (vinculosError) {
        this.handleDatabaseError(vinculosError, `getEvidenciasVinculadas (${actividadId})`);
      }

      if (!vinculos || vinculos.length === 0) {
        return [];
      }

      const typedVinculos = vinculos as Database['public']['Tables']['vinculos']['Row'][];
      const evidenciaIds = typedVinculos.map((v) => v.evidencia_id);

      // 2. Consultar las evidencias correspondientes
      const { data: evidencias, error: evidenciasError } = await supabase
        .from('evidencias')
        .select('*')
        .in('id', evidenciaIds);

      if (evidenciasError) {
        this.handleDatabaseError(evidenciasError, `evidencias en getEvidenciasVinculadas`);
      }

      // 3. Consultar las identificaciones OCR de estas evidencias
      const { data: identificaciones, error: ocrError } = await supabase
        .from('identificaciones')
        .select('*')
        .in('evidencia_id', evidenciaIds);

      if (ocrError) {
        console.warn('[ActivityService] Advertencia consultando identificaciones OCR:', ocrError);
      }

      const typedEvidencias = (evidencias || []) as Database['public']['Tables']['evidencias']['Row'][];
      const typedIdentificaciones = (identificaciones || []) as Database['public']['Tables']['identificaciones']['Row'][];

      const evidenciasMap = new Map<string, Database['public']['Tables']['evidencias']['Row']>(
        typedEvidencias.map((e) => [e.id, e])
      );
      const identMap = new Map<string, Database['public']['Tables']['identificaciones']['Row']>(
        typedIdentificaciones.map((i) => [i.evidencia_id, i])
      );

      return typedVinculos
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
    } catch (error) {
      console.error('[ActivityService] Error en getEvidenciasVinculadas:', error);
      throw error;
    }
  }
}

export const activityService = new ActivityService();
