import { useState, useEffect, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { AuthService, type PerfilRow } from '../services/AuthService';

export interface UseAuthReturn {
  user: User | null;
  profile: PerfilRow | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: Error }>;
  logout: () => Promise<{ success: boolean; error?: Error }>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PerfilRow | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Carga o actualiza el perfil desde public.perfiles
   */
  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error: profileError } = await AuthService.getCurrentProfile(userId);
      if (profileError) {
        console.warn('[useAuth] Error al cargar perfil:', profileError.message);
      }
      setProfile(data);
    } catch (err) {
      console.error('[useAuth] Excepción en loadProfile:', err);
      setProfile(null);
    }
  }, []);

  /**
   * Refresca manualmente el perfil del usuario actual
   */
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  }, [user?.id, loadProfile]);

  useEffect(() => {
    let isMounted = true;

    // 1. Carga inicial de la sesión
    const initAuth = async () => {
      try {
        setIsLoading(true);
        const { data: sessionData, error: sessionError } = await AuthService.getSession();

        if (sessionError) {
          if (isMounted) setError(sessionError);
        }

        const currentSession = sessionData;
        const currentUser = currentSession?.user ?? null;

        if (isMounted) {
          setSession(currentSession);
          setUser(currentUser);
        }

        if (currentUser?.id) {
          const { data: profileData } = await AuthService.getCurrentProfile(currentUser.id);
          if (isMounted) {
            setProfile(profileData);
          }
        } else {
          if (isMounted) {
            setProfile(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Error al inicializar sesión'));
          setUser(null);
          setProfile(null);
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // 2. Suscripción a eventos de autenticación de Supabase (onAuthStateChange)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      const newUser = newSession?.user ?? null;
      setSession(newSession);
      setUser(newUser);
      setError(null);

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        if (newUser?.id) {
          await loadProfile(newUser.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  /**
   * Método de login reactivo
   */
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: signInError } = await AuthService.signIn(email, password);
      if (signInError || !data) {
        const err = signInError || new Error('No se pudo iniciar sesión');
        setError(err);
        setIsLoading(false);
        return { success: false, error: err };
      }

      setUser(data.user);
      setSession(data.session);

      if (data.user.id) {
        await loadProfile(data.user.id);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err) {
      const loginErr = err instanceof Error ? err : new Error('Fallo inesperado al iniciar sesión');
      setError(loginErr);
      setIsLoading(false);
      return { success: false, error: loginErr };
    }
  }, [loadProfile]);

  /**
   * Método de logout reactivo
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error: signOutError } = await AuthService.signOut();
      if (signOutError) {
        setError(signOutError);
        setIsLoading(false);
        return { success: false, error: signOutError };
      }

      setUser(null);
      setProfile(null);
      setSession(null);
      setError(null);
      setIsLoading(false);
      return { success: true };
    } catch (err) {
      const logoutErr = err instanceof Error ? err : new Error('Fallo inesperado al cerrar sesión');
      setError(logoutErr);
      setIsLoading(false);
      return { success: false, error: logoutErr };
    }
  }, []);

  return {
    user,
    profile,
    session,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    refreshProfile,
  };
}
