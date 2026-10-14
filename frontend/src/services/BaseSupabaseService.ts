import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/database.types';
import { toast } from 'sonner';

export type TableName = keyof Database['public']['Tables'];

export interface BaseEntity {
  id: string | number;
  creado_en?: string;
  [key: string]: unknown;
}

/**
 * Error normalizado para violaciones de Row Level Security (RLS)
 */
export class RlsSecurityError extends Error {
  public code?: string;
  public details?: string;
  public hint?: string;

  constructor(message: string, code?: string, details?: string, hint?: string) {
    super(message);
    this.name = 'RlsSecurityError';
    this.code = code;
    this.details = details;
    this.hint = hint;
  }
}

export class BaseSupabaseService<
  TRow extends Record<string, unknown>,
  TInsert = Record<string, unknown>,
  TUpdate = Record<string, unknown>
> {
  protected tableName: TableName;

  constructor(tableName: TableName) {
    this.tableName = tableName;
  }

  /**
   * Captura de forma segura el auth.uid() activo desde Supabase Auth.
   * Retorna el UUID del usuario o null si no hay sesión.
   */
  async getCurrentUserId(): Promise<string | null> {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        return null;
      }
      return data.user.id;
    } catch {
      return null;
    }
  }

  /**
   * Manejador centralizado de errores para formatear excepciones RLS de Postgres (42501, 401, 403)
   */
  protected handleDatabaseError(error: any, operation: string): never {
    const isRlsViolation =
      error?.code === '42501' ||
      error?.code === '401' ||
      error?.code === '403' ||
      error?.status === 401 ||
      error?.status === 403 ||
      error?.message?.toLowerCase().includes('violates row-level security') ||
      error?.message?.toLowerCase().includes('permission denied');

    if (isRlsViolation) {
      const rlsMsg = `Acceso denegado por política de seguridad en la tabla "${this.tableName}" (${operation}).`;
      console.error(`[RLS Denied] ${rlsMsg}`, error);

      // Notificación elegante al usuario sin romper el hilo de ejecución silenciosamente
      if (typeof window !== 'undefined') {
        try {
          toast.error('Restricción de Seguridad RLS', {
            description: `No cuenta con privilegios suficientes para ${operation} en ${this.tableName}.`,
          });
        } catch {
          // Entorno de test o soporte sin DOM
        }
      }

      throw new RlsSecurityError(rlsMsg, error?.code, error?.details, error?.hint);
    }

    console.error(`[BaseSupabaseService] Error en ${operation} para ${this.tableName}:`, error);
    throw error;
  }

  /**
   * Obtiene todos los registros con paginación opcional
   */
  async getAll(page?: number, pageSize: number = 20): Promise<{ data: TRow[]; total: number }> {
    try {
      if (page !== undefined && page > 0) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, count, error } = await supabase
          .from(this.tableName)
          .select('*', { count: 'exact' })
          .range(from, to);

        if (error) {
          this.handleDatabaseError(error, 'getAll (paginado)');
        }

        return {
          data: (data as unknown as TRow[]) || [],
          total: count ?? 0,
        };
      }

      const { data, count, error } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact' });

      if (error) {
        this.handleDatabaseError(error, 'getAll');
      }

      return {
        data: (data as unknown as TRow[]) || [],
        total: count ?? ((data as unknown as TRow[])?.length || 0),
      };
    } catch (err) {
      if (err instanceof RlsSecurityError) throw err;
      throw err;
    }
  }

  /**
   * Alias compatible para getAll paginado
   */
  async getAllPaginated(page: number = 1, pageSize: number = 20): Promise<{ data: TRow[]; total: number }> {
    return this.getAll(page, pageSize);
  }

  /**
   * Obtiene un registro por su clave primaria
   */
  async getById(id: string | number, idColumn: string = 'id'): Promise<TRow | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq(idColumn, id)
        .maybeSingle();

      if (error) {
        this.handleDatabaseError(error, `getById (${idColumn}=${id})`);
      }

      return (data as unknown as TRow) ?? null;
    } catch (err) {
      if (err instanceof RlsSecurityError) throw err;
      throw err;
    }
  }

  /**
   * Sanitiza el payload eliminando claves no persistibles o campos computados/relaciones
   * (tales como vinculos, evidencias, creado_en, id en updates, etc.)
   */
  protected sanitizePayload<T extends Record<string, unknown>>(payload: T, isUpdate: boolean = false): Record<string, unknown> {
    const forbiddenKeys = new Set(['vinculos', 'evidencias', 'identificacion', 'identificaciones', 'perfiles', 'autor', 'responsable']);
    if (isUpdate) {
      forbiddenKeys.add('id');
      forbiddenKeys.add('creado_en');
    }

    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (!forbiddenKeys.has(key) && value !== undefined) {
        clean[key] = value;
      }
    }
    return clean;
  }

  /**
   * Crea un nuevo registro. Inyecta automáticamente el auth.uid() si la entidad posee
   * campos de autoría típicos (subido_por, responsable_id, confirmado_por, vinculado_por) y no fueron provistos.
   */
  async create(item: TInsert): Promise<TRow> {
    try {
      const currentUserId = await this.getCurrentUserId();
      let recordWithAuth = this.sanitizePayload(item as Record<string, unknown>, false);

      if (currentUserId) {
        // Inyección condicional si el campo existe o es null/undefined en el payload
        if ('subido_por' in recordWithAuth && !recordWithAuth.subido_por) {
          recordWithAuth.subido_por = currentUserId;
        }
        if ('responsable_id' in recordWithAuth && !recordWithAuth.responsable_id) {
          recordWithAuth.responsable_id = currentUserId;
        }
        if ('confirmado_por' in recordWithAuth && !recordWithAuth.confirmado_por) {
          recordWithAuth.confirmado_por = currentUserId;
        }
        if ('vinculado_por' in recordWithAuth && !recordWithAuth.vinculado_por) {
          recordWithAuth.vinculado_por = currentUserId;
        }
      }

      const { data, error } = await (supabase
        .from(this.tableName) as any)
        .insert(recordWithAuth)
        .select()
        .single();

      if (error) {
        this.handleDatabaseError(error, 'create');
      }

      return data as unknown as TRow;
    } catch (err) {
      if (err instanceof RlsSecurityError) throw err;
      throw err;
    }
  }

  /**
   * Actualiza un registro existente por su identificador
   */
  async update(id: string | number, changes: TUpdate, idColumn: string = 'id'): Promise<TRow> {
    try {
      const sanitized = this.sanitizePayload(changes as Record<string, unknown>, true);

      const { data, error } = await (supabase
        .from(this.tableName) as any)
        .update(sanitized)
        .eq(idColumn, id)
        .select()
        .single();

      if (error) {
        this.handleDatabaseError(error, `update (${idColumn}=${id})`);
      }

      return data as unknown as TRow;
    } catch (err) {
      if (err instanceof RlsSecurityError) throw err;
      throw err;
    }
  }

  /**
   * Actualiza el estado de un registro por su ID
   */
  async updateStatus(id: string | number, estado: string, statusColumn: string = 'estado'): Promise<TRow> {
    return this.update(id, { [statusColumn]: estado } as unknown as TUpdate);
  }
}
