import { supabase } from './supabaseClient';

export interface BaseEntity {
  id: string;
  creado_en?: string;
  [key: string]: any;
}

export class BaseSupabaseService<T extends BaseEntity> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Obtiene registros paginados ordenados de forma descendente por ID
   */
  async getAllPaginated(page = 1, pageSize = 20): Promise<{ data: T[]; total: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .order('id', { ascending: false })
      .range(from, to);

    if (error) {
      console.error(`[BaseSupabaseService] Error en getAllPaginated para ${this.tableName}:`, error);
      throw error;
    }

    return { 
      data: (data as T[]) || [], 
      total: count || 0 
    };
  }

  /**
   * Obtiene un registro por su clave primaria UUID
   */
  async getById(id: string): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`[BaseSupabaseService] Error en getById para ${this.tableName}:`, error);
      throw error;
    }

    return data as T;
  }

  /**
   * Inserta un nuevo registro
   */
  async create(item: Partial<T>): Promise<T> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(item as any)
      .select()
      .single();

    if (error) {
      console.error(`[BaseSupabaseService] Error en create para ${this.tableName}:`, error);
      throw error;
    }

    return data as T;
  }

  /**
   * Actualiza el estado de un registro por su ID
   */
  async updateStatus(id: string, estado: string): Promise<T> {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({ estado } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`[BaseSupabaseService] Error en updateStatus para ${this.tableName}:`, error);
      throw error;
    }

    return data as T;
  }
}
