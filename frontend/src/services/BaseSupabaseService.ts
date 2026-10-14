import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/database.types';

export type TableName = keyof Database['public']['Tables'];

export interface BaseEntity {
  id: string | number;
  creado_en?: string;
  [key: string]: unknown;
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
   * Obtiene todos los registros con paginación opcional
   */
  async getAll(page?: number, pageSize: number = 20): Promise<{ data: TRow[]; total: number }> {
    if (page !== undefined && page > 0) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .range(from, to);

      if (error) {
        console.error(`[BaseSupabaseService] Error en getAll paginado para ${this.tableName}:`, error);
        throw error;
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
      console.error(`[BaseSupabaseService] Error en getAll para ${this.tableName}:`, error);
      throw error;
    }

    return {
      data: (data as unknown as TRow[]) || [],
      total: count ?? ((data as unknown as TRow[])?.length || 0),
    };
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
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq(idColumn, id)
      .maybeSingle();

    if (error) {
      console.error(`[BaseSupabaseService] Error en getById (${idColumn}=${id}) para ${this.tableName}:`, error);
      throw error;
    }

    return (data as unknown as TRow) ?? null;
  }

  /**
   * Crea un nuevo registro
   */
  async create(item: TInsert): Promise<TRow> {
    const { data, error } = await (supabase
      .from(this.tableName) as any)
      .insert(item)
      .select()
      .single();

    if (error) {
      console.error(`[BaseSupabaseService] Error en create para ${this.tableName}:`, error);
      throw error;
    }

    return data as unknown as TRow;
  }

  /**
   * Actualiza un registro existente por su identificador
   */
  async update(id: string | number, changes: TUpdate, idColumn: string = 'id'): Promise<TRow> {
    const { data, error } = await (supabase
      .from(this.tableName) as any)
      .update(changes)
      .eq(idColumn, id)
      .select()
      .single();

    if (error) {
      console.error(`[BaseSupabaseService] Error en update (${idColumn}=${id}) para ${this.tableName}:`, error);
      throw error;
    }

    return data as unknown as TRow;
  }

  /**
   * Actualiza el estado de un registro por su ID
   */
  async updateStatus(id: string | number, estado: string, statusColumn: string = 'estado'): Promise<TRow> {
    return this.update(id, { [statusColumn]: estado } as unknown as TUpdate);
  }
}
