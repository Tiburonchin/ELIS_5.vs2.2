-- ==============================================================================
-- PROYECTO: ELIS 5.0 Cloud-Native (Base de Datos en Supabase)
-- MIGRACIÓN: Módulo 7 - Seguridad RLS, Perfiles y Soporte de Formatos HSE
-- FECHA: 2026-10-14
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLA public.perfiles Y AUTO-APROVISIONAMIENTO
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombres_completos TEXT NOT NULL,
    cargo TEXT NOT NULL DEFAULT 'Inspector HSE',
    rol TEXT NOT NULL DEFAULT 'inspector' CHECK (rol IN ('inspector', 'supervisor', 'administrador')),
    telefono TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Función para aprovisionar perfil automáticamente al registrarse en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfiles (id, nombres_completos, cargo, rol)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombres_completos', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'cargo', 'Inspector HSE'),
        COALESCE(NEW.raw_user_meta_data->>'rol', 'inspector')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sobre auth.users
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Retroactivo: Si existen usuarios previos en auth.users, sincronizar perfil
INSERT INTO public.perfiles (id, nombres_completos, cargo, rol)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'nombres_completos', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'cargo', 'Inspector HSE'),
    COALESCE(raw_user_meta_data->>'rol', 'inspector')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. AJUSTE DE TRIGGER UNIVERSAL DE AUDITORÍA (SOPORTE PARA public.perfiles)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_registrar_auditoria_universal() 
RETURNS TRIGGER AS $$ 
DECLARE
    v_id TEXT;
    v_user_id UUID;
    v_user_email TEXT;
BEGIN 
    -- Obtener ID según la entidad
    IF (TG_TABLE_NAME = 'vinculos' OR TG_TABLE_NAME = 'identificaciones') THEN
        v_id := COALESCE(NEW.evidencia_id::TEXT, OLD.evidencia_id::TEXT);
    ELSE
        -- Aplica tanto para evidencias, actividades, auditoria como perfiles (NEW.id)
        v_id := COALESCE(NEW.id::TEXT, OLD.id::TEXT);
    END IF;

    -- Obtener usuario actual autenticado si existe en el JWT
    BEGIN
        v_user_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    BEGIN
        v_user_email := COALESCE(current_setting('request.jwt.claims', true)::json->>'email', 'sistema');
    EXCEPTION WHEN OTHERS THEN
        v_user_email := 'sistema';
    END;

    IF (TG_OP = 'INSERT') THEN 
        INSERT INTO public.auditoria (operacion, tabla, entidad_id, usuario_id, usuario_email, payload_anterior, payload_nuevo)
        VALUES ('INSERT', TG_TABLE_NAME, v_id, v_user_id, v_user_email, NULL, to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN 
        INSERT INTO public.auditoria (operacion, tabla, entidad_id, usuario_id, usuario_email, payload_anterior, payload_nuevo)
        VALUES ('UPDATE', TG_TABLE_NAME, v_id, v_user_id, v_user_email, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN 
        INSERT INTO public.auditoria (operacion, tabla, entidad_id, usuario_id, usuario_email, payload_anterior, payload_nuevo)
        VALUES ('DELETE', TG_TABLE_NAME, v_id, v_user_id, v_user_email, to_jsonb(OLD), NULL);
        RETURN OLD;
    END IF;
    RETURN NULL; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_perfiles ON public.perfiles;
CREATE TRIGGER trg_audit_perfiles 
    AFTER INSERT OR UPDATE OR DELETE ON public.perfiles 
    FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_auditoria_universal();

-- ------------------------------------------------------------------------------
-- 3. AMPLIACIÓN DE public.actividades PARA FORMATOS CORPORATIVOS HSE
-- ------------------------------------------------------------------------------
-- Ampliar restricción CHECK de tipo_actividad
ALTER TABLE public.actividades 
    DROP CONSTRAINT IF EXISTS actividades_tipo_actividad_check;

ALTER TABLE public.actividades 
    ADD CONSTRAINT actividades_tipo_actividad_check 
    CHECK (tipo_actividad IN ('INSPECCION', 'CAPACITACION', 'AUDITORIA', 'AMONESTACION'));

-- Agregar columna para datos estructurados de formularios HSE (Checklist 15 secciones o HSE-EL-F-128)
ALTER TABLE public.actividades 
    ADD COLUMN IF NOT EXISTS datos_formato_json JSONB DEFAULT '{}'::jsonb;

-- Índice para responsable de actividad (optimización de consultas y soporte RLS)
CREATE INDEX IF NOT EXISTS idx_actividades_responsable 
    ON public.actividades(responsable_id);

-- Asignar default auth.uid() a columnas de autoría para flexibilidad operativa
ALTER TABLE public.evidencias 
    ALTER COLUMN subido_por SET DEFAULT auth.uid();

ALTER TABLE public.identificaciones 
    ALTER COLUMN confirmado_por SET DEFAULT auth.uid();

ALTER TABLE public.actividades 
    ALTER COLUMN responsable_id SET DEFAULT auth.uid();

ALTER TABLE public.vinculos 
    ALTER COLUMN vinculado_por SET DEFAULT auth.uid();

-- ------------------------------------------------------------------------------
-- 4. ACTIVACIÓN ESTRICTA DE ROW LEVEL SECURITY (RLS) EN LAS 6 TABLAS
-- ------------------------------------------------------------------------------
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vinculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 4.1 POLÍTICAS RLS: public.perfiles
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "perfiles_select_authenticated" ON public.perfiles;
CREATE POLICY "perfiles_select_authenticated"
    ON public.perfiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "perfiles_insert_authenticated" ON public.perfiles;
CREATE POLICY "perfiles_insert_authenticated"
    ON public.perfiles FOR INSERT
    TO authenticated
    WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "perfiles_update_authenticated" ON public.perfiles;
CREATE POLICY "perfiles_update_authenticated"
    ON public.perfiles FOR UPDATE
    TO authenticated
    USING (id = (select auth.uid()))
    WITH CHECK (id = (select auth.uid()));

-- Regla Inmutable: NO EXISTE POLÍTICA DELETE para perfiles.

-- ------------------------------------------------------------------------------
-- 4.2 POLÍTICAS RLS: public.evidencias
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "evidencias_select_authenticated" ON public.evidencias;
CREATE POLICY "evidencias_select_authenticated"
    ON public.evidencias FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "evidencias_insert_authenticated" ON public.evidencias;
CREATE POLICY "evidencias_insert_authenticated"
    ON public.evidencias FOR INSERT
    TO authenticated
    WITH CHECK (
        (select auth.uid()) IS NOT NULL 
        AND (subido_por IS NULL OR subido_por = (select auth.uid()))
    );

DROP POLICY IF EXISTS "evidencias_update_authenticated" ON public.evidencias;
CREATE POLICY "evidencias_update_authenticated"
    ON public.evidencias FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (estado IN ('pendiente', 'vinculada', 'archivada', 'error'));

-- Regla Inmutable (:ro): NO EXISTE POLÍTICA DELETE para evidencias.

-- ------------------------------------------------------------------------------
-- 4.3 POLÍTICAS RLS: public.identificaciones
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "identificaciones_select_authenticated" ON public.identificaciones;
CREATE POLICY "identificaciones_select_authenticated"
    ON public.identificaciones FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "identificaciones_insert_authenticated" ON public.identificaciones;
CREATE POLICY "identificaciones_insert_authenticated"
    ON public.identificaciones FOR INSERT
    TO authenticated
    WITH CHECK (
        (select auth.uid()) IS NOT NULL 
        AND (confirmado_por IS NULL OR confirmado_por = (select auth.uid()))
    );

DROP POLICY IF EXISTS "identificaciones_update_authenticated" ON public.identificaciones;
CREATE POLICY "identificaciones_update_authenticated"
    ON public.identificaciones FOR UPDATE
    TO authenticated
    USING (
        confirmado_por IS NULL OR confirmado_por = (select auth.uid())
    )
    WITH CHECK (
        confirmado_por IS NULL OR confirmado_por = (select auth.uid())
    );

-- Regla Inmutable: NO EXISTE POLÍTICA DELETE para identificaciones.

-- ------------------------------------------------------------------------------
-- 4.4 POLÍTICAS RLS: public.actividades
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "actividades_select_authenticated" ON public.actividades;
CREATE POLICY "actividades_select_authenticated"
    ON public.actividades FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "actividades_insert_authenticated" ON public.actividades;
CREATE POLICY "actividades_insert_authenticated"
    ON public.actividades FOR INSERT
    TO authenticated
    WITH CHECK (
        (select auth.uid()) IS NOT NULL 
        AND (responsable_id IS NULL OR responsable_id = (select auth.uid()))
    );

DROP POLICY IF EXISTS "actividades_update_authenticated" ON public.actividades;
CREATE POLICY "actividades_update_authenticated"
    ON public.actividades FOR UPDATE
    TO authenticated
    USING (
        responsable_id IS NULL OR responsable_id = (select auth.uid())
    )
    WITH CHECK (
        responsable_id IS NULL OR responsable_id = (select auth.uid())
    );

-- Regla Inmutable: NO EXISTE POLÍTICA DELETE para actividades.

-- ------------------------------------------------------------------------------
-- 4.5 POLÍTICAS RLS: public.vinculos
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "vinculos_select_authenticated" ON public.vinculos;
CREATE POLICY "vinculos_select_authenticated"
    ON public.vinculos FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "vinculos_insert_authenticated" ON public.vinculos;
CREATE POLICY "vinculos_insert_authenticated"
    ON public.vinculos FOR INSERT
    TO authenticated
    WITH CHECK (
        (select auth.uid()) IS NOT NULL 
        AND (vinculado_por IS NULL OR vinculado_por = (select auth.uid()))
    );

DROP POLICY IF EXISTS "vinculos_update_authenticated" ON public.vinculos;
CREATE POLICY "vinculos_update_authenticated"
    ON public.vinculos FOR UPDATE
    TO authenticated
    USING (
        vinculado_por IS NULL OR vinculado_por = (select auth.uid())
    )
    WITH CHECK (
        vinculado_por IS NULL OR vinculado_por = (select auth.uid())
    );

DROP POLICY IF EXISTS "vinculos_delete_authenticated" ON public.vinculos;
CREATE POLICY "vinculos_delete_authenticated"
    ON public.vinculos FOR DELETE
    TO authenticated
    USING (
        vinculado_por IS NULL OR vinculado_por = (select auth.uid())
    );

-- ------------------------------------------------------------------------------
-- 4.6 POLÍTICAS RLS: public.auditoria
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "auditoria_select_authenticated" ON public.auditoria;
CREATE POLICY "auditoria_select_authenticated"
    ON public.auditoria FOR SELECT
    TO authenticated
    USING (true);

-- Inmutabilidad Absoluta: NO EXISTEN POLÍTICAS INSERT, UPDATE NI DELETE para public.auditoria.
-- Toda escritura en public.auditoria se realiza exclusivamente vía trigger SECURITY DEFINER.

-- ------------------------------------------------------------------------------
-- 5. SUPABASE STORAGE (BUCKET 'evidencias') Y POLÍTICAS RLS INMUTABLES (:ro)
-- ------------------------------------------------------------------------------
-- Garantizar que el bucket 'evidencias' exista y sea privado
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidencias', 'evidencias', false)
ON CONFLICT (id) DO NOTHING;

-- Política de lectura: usuarios autenticados pueden ver objetos del bucket 'evidencias'
DROP POLICY IF EXISTS "evidencias_storage_select_authenticated" ON storage.objects;
CREATE POLICY "evidencias_storage_select_authenticated"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'evidencias');

-- Política de inserción: usuarios autenticados pueden subir objetos al bucket 'evidencias'
DROP POLICY IF EXISTS "evidencias_storage_insert_authenticated" ON storage.objects;
CREATE POLICY "evidencias_storage_insert_authenticated"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'evidencias' 
        AND (select auth.uid()) IS NOT NULL
    );

-- Regla Inmutable (:ro): Bloqueo estricto de UPDATE y DELETE en storage.objects
DROP POLICY IF EXISTS "evidencias_storage_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "evidencias_storage_delete_authenticated" ON storage.objects;
