import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jvwotxlpznafkuodyfhg.supabase.co';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2d290eGxwem5hZmt1b2R5ZmhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MzQ1ODAsImV4cCI6MjEwNzUxMDU4MH0.SW_s26Gq6lz2M_6fohbNIZZdSbiQ9YtPdDP7HuEYWUw';

const TEST_EMAIL = 'auditor.seguridad.elis@gmail.com';
const TEST_PASSWORD = 'Seguridad2026!#';

describe('Módulo 7: Auditoría y Pruebas de Integración de Seguridad RLS en Supabase Cloud', () => {
  let anonClient: SupabaseClient;
  let authClient: SupabaseClient;
  let authenticatedUserId: string;

  beforeAll(async () => {
    // 1. Cliente Anónimo estricto
    anonClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 2. Cliente Autenticado para pruebas de integridad
    authClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: authData, error: authError } = await (authClient.auth as any).signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (authError || !authData.user) {
      throw new Error(`Fallo en autenticación de prueba: ${authError?.message}`);
    }

    authenticatedUserId = authData.user.id;
    expect(authenticatedUserId).toBeDefined();
  });

  // ============================================================================
  // Escenario 1: Bloqueo Absoluto a Usuarios Anónimos (anon)
  // ============================================================================
  describe('1. Bloqueo Absoluto a Usuarios Anónimos (anon)', () => {
    it('debe denegar lectura y devolver colección vacía o error en public.perfiles para anon', async () => {
      const { data, error: _error } = await anonClient.from('perfiles').select('*');
      // Con RLS sin políticas para anon, data es vacía o devuelve error RLS
      expect(data === null || (Array.isArray(data) && data.length === 0)).toBe(true);
    });

    it('debe rechazar INSERT en public.perfiles para anon', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000999';
      const { error } = await anonClient.from('perfiles').insert({
        id: fakeId,
        nombres_completos: 'Intruso Anónimo',
        cargo: 'Hacker',
        rol: 'administrador',
      });
      // RLS bloquea insert para anon (error o code 42501)
      expect(error).not.toBeNull();
    });

    it('debe denegar lectura y devolver colección vacía en public.evidencias para anon', async () => {
      const { data, error: _error } = await anonClient.from('evidencias').select('*');
      expect(data === null || (Array.isArray(data) && data.length === 0)).toBe(true);
    });

    it('debe rechazar INSERT en public.evidencias para anon', async () => {
      const { error } = await anonClient.from('evidencias').insert({
        nombre_archivo: 'inyeccion_anonima.jpg',
        ruta_storage: 'originals/fake.jpg',
        hash_sha256: '0000000000000000000000000000000000000000000000000000000000000001',
        tamano_bytes: 1024,
        mime_type: 'image/jpeg',
      });
      expect(error).not.toBeNull();
    });

    it('debe denegar lectura y devolver colección vacía en public.actividades para anon', async () => {
      const { data } = await anonClient.from('actividades').select('*');
      expect(data === null || (Array.isArray(data) && data.length === 0)).toBe(true);
    });

    it('debe rechazar INSERT en public.actividades para anon', async () => {
      const { error } = await anonClient.from('actividades').insert({
        codigo_referencia: 'ACT-ANON-999',
        tipo_actividad: 'INSPECCION',
        fecha_operacion: '2026-10-14',
        responsable_nombre: 'Anónimo',
        ubicacion: 'Frente 1',
      });
      expect(error).not.toBeNull();
    });

    it('debe denegar lectura y devolver colección vacía en public.auditoria para anon', async () => {
      const { data } = await anonClient.from('auditoria').select('*');
      expect(data === null || (Array.isArray(data) && data.length === 0)).toBe(true);
    });

    it('debe rechazar INSERT en public.auditoria para anon', async () => {
      const { error } = await anonClient.from('auditoria').insert({
        operacion: 'INSERT',
        tabla: 'evidencias',
        entidad_id: 'fake',
      });
      expect(error).not.toBeNull();
    });
  });

  // ============================================================================
  // Escenario 2: Prueba de Inmutabilidad (:ro - Cero Borrado)
  // ============================================================================
  describe('2. Prueba de Inmutabilidad (:ro - Cero Borrado)', () => {
    it('debe rechazar o impedir DELETE en public.evidencias incluso con usuario autenticado', async () => {
      // Intentar borrar cualquier fila en evidencias
      const { data } = await authClient
        .from('evidencias')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .select();

      // En PostgreSQL RLS, si no hay política DELETE para authenticated, 0 filas son afectadas o da error 42501
      expect(data === null || (Array.isArray(data) && data.length === 0)).toBe(true);
    });

    it('debe rechazar o impedir DELETE en public.auditoria incluso con usuario autenticado', async () => {
      const { data } = await authClient
        .from('auditoria')
        .delete()
        .neq('id', 0)
        .select();

      // Inmutabilidad absoluta: ningún usuario puede mutar o borrar auditoría
      expect(data === null || (Array.isArray(data) && data.length === 0)).toBe(true);
    });
  });

  // ============================================================================
  // Escenario 3: Auditoría del Trigger fn_registrar_auditoria_universal
  // ============================================================================
  describe('3. Auditoría del Trigger fn_registrar_auditoria_universal', () => {
    it('debe registrar automáticamente una mutación en public.auditoria con payload_nuevo y usuario_id', async () => {
      const codigoUnico = `AUDIT-TEST-${Date.now()}`;

      // 1. Insertar actividad válida con usuario autenticado
      const { data: actData, error: actError } = await authClient
        .from('actividades')
        .insert({
          codigo_referencia: codigoUnico,
          tipo_actividad: 'INSPECCION',
          fecha_operacion: '2026-10-14',
          responsable_nombre: 'Ing. Roberto Carlos Mendoza',
          ubicacion: 'Frente de Excavación Norte - Km 42',
          descripcion: 'Inspección de seguridad para verificación de líneas de vida y EPP',
          datos_formato_json: {
            seccion_epp: { calificacion: 'S', observaciones: 'Uso conforme' },
          },
        })
        .select()
        .single();

      expect(actError).toBeNull();
      expect(actData).toBeDefined();
      expect(actData.id).toBeDefined();
      expect(actData.responsable_id).toBe(authenticatedUserId);

      // 2. Consultar public.auditoria para verificar que el trigger grabó el registro
      const { data: auditData, error: auditError } = await authClient
        .from('auditoria')
        .select('*')
        .eq('tabla', 'actividades')
        .eq('entidad_id', actData.id)
        .eq('operacion', 'INSERT')
        .single();

      expect(auditError).toBeNull();
      expect(auditData).toBeDefined();
      expect(auditData.operacion).toBe('INSERT');
      expect(auditData.tabla).toBe('actividades');
      expect(auditData.entidad_id).toBe(actData.id);
      expect(auditData.usuario_id).toBe(authenticatedUserId);
      expect(auditData.payload_nuevo).toBeDefined();
      expect(auditData.payload_nuevo.codigo_referencia).toBe(codigoUnico);
    });
  });

  // ============================================================================
  // Escenario 4: Validación del Check Constraint de Formatos HSE
  // ============================================================================
  describe('4. Validación del Check Constraint de Formatos HSE', () => {
    it('debe rechazar inserciones con tipo_actividad no permitido (ej. INVENTARIO)', async () => {
      const codigoInvalido = `INV-FAIL-${Date.now()}`;

      const { error } = await authClient.from('actividades').insert({
        codigo_referencia: codigoInvalido,
        tipo_actividad: 'INVENTARIO' as any,
        fecha_operacion: '2026-10-14',
        responsable_nombre: 'Ing. Roberto Carlos Mendoza',
        ubicacion: 'Almacén Central',
      });

      expect(error).not.toBeNull();
      // Error code 23514 en Postgres es check_violation
      expect(error?.code === '23514' || error?.message?.includes('check')).toBe(true);
    });

    it('debe permitir inserción con nuevo tipo corporativo AMONESTACION y datos_formato_json', async () => {
      const codigoAmon = `AMON-TEST-${Date.now()}`;

      const { data, error } = await authClient
        .from('actividades')
        .insert({
          codigo_referencia: codigoAmon,
          tipo_actividad: 'AMONESTACION',
          fecha_operacion: '2026-10-14',
          responsable_nombre: 'Ing. Roberto Carlos Mendoza',
          ubicacion: 'Área de Soldadura y Calderería',
          descripcion: 'Amonestación por incumplimiento de uso de careta de soldar',
          datos_formato_json: {
            formato: 'HSE-EL-F-128',
            motivo: '02 Acto Subestandar',
            nivel_riesgo: '01 Intolerable',
            sancion: '01 Llamada de atencion',
          },
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.tipo_actividad).toBe('AMONESTACION');
      expect(data.datos_formato_json.formato).toBe('HSE-EL-F-128');
    });
  });
});
