import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/database.types';
import type { Session, User } from '@supabase/supabase-js';

export type PerfilRow = Database['public']['Tables']['perfiles']['Row'];
export type PerfilUpdate = Database['public']['Tables']['perfiles']['Update'];

export interface AuthResponse<T = unknown> {
  data: T | null;
  error: Error | null;
}

export class AuthService {
  /**
   * Inicia sesión con correo electrónico corporativo y contraseña
   */
  static async signIn(email: string, password: string): Promise<AuthResponse<{ user: User; session: Session }>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('[AuthService] Error al iniciar sesión:', error.message);
        return { data: null, error };
      }

      if (!data.user || !data.session) {
        return { data: null, error: new Error('Respuesta de autenticación incompleta') };
      }

      return {
        data: {
          user: data.user,
          session: data.session,
        },
        error: null,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error inesperado durante el inicio de sesión');
      console.error('[AuthService] Excepción en signIn:', error);
      return { data: null, error };
    }
  }

  /**
   * Inicia sesión con Google OAuth corporativo mediante supabase.auth.signInWithOAuth
   */
  static async signInWithGoogle(): Promise<AuthResponse<{ provider: string; url: string | null }>> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
        },
      });

      if (error) {
        console.error('[AuthService] Error al iniciar sesión con Google:', error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error inesperado durante el inicio de sesión con Google');
      console.error('[AuthService] Excepción en signInWithGoogle:', error);
      return { data: null, error };
    }
  }

  /**
   * Cierra la sesión activa actual
   */
  static async signOut(): Promise<AuthResponse<void>> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AuthService] Error al cerrar sesión:', error.message);
        return { data: null, error };
      }
      return { data: undefined, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error inesperado al cerrar sesión');
      console.error('[AuthService] Excepción en signOut:', error);
      return { data: null, error };
    }
  }

  /**
   * Obtiene la sesión activa actual
   */
  static async getSession(): Promise<AuthResponse<Session | null>> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[AuthService] Error obteniendo sesión:', error.message);
        return { data: null, error };
      }
      return { data: data.session, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error inesperado al obtener sesión');
      console.error('[AuthService] Excepción en getSession:', error);
      return { data: null, error };
    }
  }

  /**
   * Obtiene el usuario autenticado actual validado contra el servidor
   */
  static async getCurrentUser(): Promise<AuthResponse<User | null>> {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        // Si no hay sesión activa, getUser() devuelve AuthSessionMissingError
        return { data: null, error: null };
      }
      return { data: data.user, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error inesperado al obtener usuario');
      console.error('[AuthService] Excepción en getCurrentUser:', error);
      return { data: null, error };
    }
  }

  /**
   * Consulta la tabla public.perfiles vinculada al usuario autenticado actual.
   * Si no se especifica userId, consulta el usuario activo actual.
   */
  static async getCurrentProfile(userId?: string): Promise<AuthResponse<PerfilRow | null>> {
    try {
      let targetUid = userId;

      if (!targetUid) {
        const { data: user } = await this.getCurrentUser();
        if (!user || !user.id) {
          return { data: null, error: null };
        }
        targetUid = user.id;
      }

      if (!targetUid) {
        return { data: null, error: null };
      }

      const { data, error: _error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', targetUid)
        .maybeSingle();

      let profile = (data as PerfilRow) ?? null;

      // Auto-Healing: Si un usuario autenticado inicia sesión y no tiene fila en public.perfiles,
      // el servicio la crea al vuelo usando los metadatos de su cuenta (email, full_name de Google OAuth)
      if (!profile) {
        const { data: user } = await this.getCurrentUser();
        if (user && user.id === targetUid) {
          const userMeta = user.user_metadata || {};
          const derivedName =
            userMeta.full_name ||
            userMeta.nombres_completos ||
            userMeta.name ||
            (user.email ? user.email.split('@')[0] : 'Inspector HSE');
          const derivedCargo = userMeta.cargo || 'Supervisor HSE';
          const derivedRol = (userMeta.rol as 'inspector' | 'supervisor' | 'administrador') || 'inspector';

          const newProfilePayload = {
            id: user.id,
            nombres_completos: derivedName,
            cargo: derivedCargo,
            rol: derivedRol,
            telefono: user.phone || null,
          };

          const { data: createdProfile, error: insertError } = await (supabase.from('perfiles') as any)
            .upsert(newProfilePayload)
            .select()
            .single();

          if (insertError) {
            console.warn(`[AuthService] Auto-healing fallback activo, error creando perfil (${targetUid}):`, insertError.message);
            // Retorna un perfil simulado en memoria para que profile jamás sea null
            profile = {
              id: user.id,
              nombres_completos: derivedName,
              cargo: derivedCargo,
              rol: derivedRol,
              telefono: user.phone || null,
              creado_en: new Date().toISOString(),
              actualizado_en: new Date().toISOString(),
            };
          } else {
            profile = createdProfile as PerfilRow;
          }
        }
      }

      return { data: profile, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error inesperado al obtener perfil');
      console.error('[AuthService] Excepción en getCurrentProfile:', error);
      return { data: null, error };
    }
  }

  /**
   * Actualiza los datos del perfil del usuario autenticado (nombres_completos, cargo, telefono)
   */
  static async updateProfile(changes: PerfilUpdate, userId?: string): Promise<AuthResponse<PerfilRow | null>> {
    try {
      let targetUid = userId;
      if (!targetUid) {
        const { data: user } = await this.getCurrentUser();
        if (!user) {
          return { data: null, error: new Error('No hay usuario autenticado para actualizar perfil') };
        }
        targetUid = user.id;
      }

      const { data, error } = await (supabase.from('perfiles') as any)
        .update({
          ...changes,
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', targetUid)
        .select()
        .single();

      if (error) {
        console.error(`[AuthService] Error actualizando perfil (${targetUid}):`, error.message);
        return { data: null, error };
      }

      return { data: (data as PerfilRow) ?? null, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error inesperado al actualizar perfil');
      console.error('[AuthService] Excepción en updateProfile:', error);
      return { data: null, error };
    }
  }
}
