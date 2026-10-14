import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/database.types';

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
   * Manejador centralizado de errores para formatear excepciones RLS de Postgres (42501)
   */
  protected handleDatabaseError(error: any, operation: string): never {
    // Código PostgreSQL 42501: insufficient_privilege (RLS policy violation)
    if (error?.code === '42501' || error?.message?.toLowerCase().includes('violates row-level security')) {
      const rlsMsg = `[RLS Denied] Acceso denegado por política de seguridad en la tabla "${this.tableName}" durante la operación ${operation}.`;
      console.error(rlsMsg, error);
      throw new RlsSecurityError(rlsMsg, error.code, error.details, error.hint);
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
   * Crea un nuevo registro. Inyecta automáticamente el auth.uid() si la entidad posee
   * campos de autoría típicos (subido_por, responsable_id, confirmado_por, vinculado_por) y no fueron provistos.
   */
  async create(item: TInsert): Promise<TRow> {
    try {
      const currentUserId = await this.getCurrentUserId();
      let recordWithAuth = { ...(item as Record<string, unknown>) };

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
      const { data, error } = await (supabase
        .from(this.tableName) as any)
        .update(changes)
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
