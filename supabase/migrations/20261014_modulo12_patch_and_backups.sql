-- ==============================================================================
-- MÓDULO 12: MOTOR DE PARCHES OTA, SOBRESCRITURA CONTROLADA Y BACKUPS PREVENTIVOS
-- Archivo: supabase/migrations/20261014_modulo12_patch_and_backups.sql
-- Descripción:
-- 1. Tabla de Puntos de Restauración (public.backups_sistema) con RLS estricto e inmutable.
-- 2. Función RPC public.aplicar_parche_actividad_con_backup (Backup automático 'PRE_SOBRESCRITURA_ACTIVIDAD' + Delta Patching MERGE u OVERWRITE).
-- 3. Función RPC public.restaurar_backup_actividad (Rollback seguro a snapshot previo).
-- 4. Notificación para recargar esquema PostgREST.
-- ==============================================================================

-- 1. Tabla de Puntos de Restauración
CREATE TABLE IF NOT EXISTS public.backups_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_backup TEXT NOT NULL CHECK (
        tipo_backup IN ('PRE_PARCHE_APP', 'PRE_SOBRESCRITURA_ACTIVIDAD', 'MANUAL_COMPLETO', 'PARCHE_DATOS')
    ),
    entidad_id UUID NULL,
    version_app TEXT NOT NULL,
    descripcion TEXT,
    snapshot_json JSONB NOT NULL,
    hash_integridad CHAR(64),
    creado_por UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- Índices de optimización y búsqueda
CREATE INDEX IF NOT EXISTS idx_backups_sistema_tipo ON public.backups_sistema(tipo_backup);
CREATE INDEX IF NOT EXISTS idx_backups_sistema_entidad ON public.backups_sistema(entidad_id);
CREATE INDEX IF NOT EXISTS idx_backups_sistema_creado_en ON public.backups_sistema(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_backups_sistema_creado_por ON public.backups_sistema(creado_por);

-- Habilitar RLS estricto
ALTER TABLE public.backups_sistema ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad:
-- Permitir SELECT a usuarios autenticados
DROP POLICY IF EXISTS "Permitir lectura de backups a usuarios autenticados" ON public.backups_sistema;
CREATE POLICY "Permitir lectura de backups a usuarios autenticados"
    ON public.backups_sistema
    FOR SELECT
    TO authenticated
    USING (true);

-- Permitir INSERT a usuarios autenticados
DROP POLICY IF EXISTS "Permitir creación de backups a usuarios autenticados" ON public.backups_sistema;
CREATE POLICY "Permitir creación de backups a usuarios autenticados"
    ON public.backups_sistema
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL OR creado_por IS NOT NULL);

-- NOTA: No se definen políticas de UPDATE ni DELETE para authenticated,
-- garantizando la regla de inmutabilidad estricta (:ro) de los respaldos de auditoría.

-- Conceder permisos de acceso
GRANT SELECT, INSERT ON TABLE public.backups_sistema TO authenticated;
GRANT ALL ON TABLE public.backups_sistema TO service_role;


-- 2. Función RPC: aplicar_parche_actividad_con_backup
-- Paso 1: Backup Automático preventivo 'PRE_SOBRESCRITURA_ACTIVIDAD'
-- Paso 2: Aplicación del parche en modo MERGE (||) u OVERWRITE
CREATE OR REPLACE FUNCTION public.aplicar_parche_actividad_con_backup(
    p_actividad_id UUID,
    p_parche_json JSONB,
    p_modo TEXT DEFAULT 'MERGE'
)
RETURNS JSONB AS $$
DECLARE
    v_actividad public.actividades%ROWTYPE;
    v_usuario_id UUID;
    v_snapshot JSONB;
    v_datos_previos JSONB;
    v_nuevos_datos JSONB;
    v_backup_id UUID;
    v_hash CHAR(64);
    v_version TEXT := '5.0.0';
    v_descripcion TEXT;
BEGIN
    v_usuario_id := auth.uid();

    -- Validar existencia de la actividad
    SELECT * INTO v_actividad
    FROM public.actividades
    WHERE id = p_actividad_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La actividad con ID % no existe', p_actividad_id;
    END IF;

    v_datos_previos := COALESCE(v_actividad.datos_formato_json, '{}'::jsonb);

    -- Paso 1: Crear Snapshot Completo (Actividad + Vínculos asociados)
    v_snapshot := jsonb_build_object(
        'actividad', to_jsonb(v_actividad),
        'vinculos', (
            SELECT COALESCE(jsonb_agg(to_jsonb(v)), '[]'::jsonb)
            FROM public.vinculos v
            WHERE v.actividad_id = p_actividad_id
        ),
        'modo_aplicado_antes', p_modo,
        'fecha_snapshot', now()
    );

    -- Cálculo de hash SHA-256 de integridad del snapshot
    v_hash := encode(digest(v_snapshot::text, 'sha256'), 'hex');
    v_descripcion := 'Backup preventivo automático antes de parchear actividad ' || COALESCE(v_actividad.codigo_referencia, p_actividad_id::text) || ' (Modo: ' || p_modo || ')';

    -- Registrar el backup preventivo
    INSERT INTO public.backups_sistema (
        tipo_backup,
        entidad_id,
        version_app,
        descripcion,
        snapshot_json,
        hash_integridad,
        creado_por,
        creado_en
    )
    VALUES (
        'PRE_SOBRESCRITURA_ACTIVIDAD',
        p_actividad_id,
        v_version,
        v_descripcion,
        v_snapshot,
        v_hash,
        v_usuario_id,
        now()
    )
    RETURNING id INTO v_backup_id;

    -- Paso 2: Aplicación del Parche
    IF upper(COALESCE(p_modo, 'MERGE')) = 'OVERWRITE' THEN
        -- Sobrescritura limpia del formato JSON
        v_nuevos_datos := COALESCE(p_parche_json, '{}'::jsonb);
    ELSE
        -- Fusión diferencial (MERGE) con operador || de JSONB
        v_nuevos_datos := v_datos_previos || COALESCE(p_parche_json, '{}'::jsonb);
    END IF;

    -- Actualizar actividad
    UPDATE public.actividades
    SET
        datos_formato_json = v_nuevos_datos,
        actualizado_en = now(),
        -- Si el parche incluye metadatos básicos en la raíz, actualizarlos opcionalmente
        descripcion = COALESCE(p_parche_json->>'descripcion', v_actividad.descripcion),
        ubicacion = COALESCE(p_parche_json->>'ubicacion', v_actividad.ubicacion),
        responsable_nombre = COALESCE(p_parche_json->>'responsable_nombre', v_actividad.responsable_nombre)
    WHERE id = p_actividad_id;

    RETURN jsonb_build_object(
        'success', true,
        'actividad_id', p_actividad_id,
        'backup_id', v_backup_id,
        'modo', upper(COALESCE(p_modo, 'MERGE')),
        'hash_integridad', v_hash,
        'mensaje', 'Parche aplicado con éxito con respaldo de seguridad garantizado.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Función RPC: restaurar_backup_actividad (Rollback)
CREATE OR REPLACE FUNCTION public.restaurar_backup_actividad(
    p_backup_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_backup public.backups_sistema%ROWTYPE;
    v_actividad_data JSONB;
    v_actividad_id UUID;
    v_datos_formato JSONB;
BEGIN
    -- Validar punto de restauración
    SELECT * INTO v_backup
    FROM public.backups_sistema
    WHERE id = p_backup_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El punto de restauración con ID % no existe', p_backup_id;
    END IF;

    v_actividad_data := v_backup.snapshot_json->'actividad';
    IF v_actividad_data IS NULL THEN
        RAISE EXCEPTION 'El snapshot % no contiene datos válidos de actividad para restaurar', p_backup_id;
    END IF;

    v_actividad_id := (v_actividad_data->>'id')::UUID;
    v_datos_formato := COALESCE(v_actividad_data->'datos_formato_json', '{}'::jsonb);

    -- Restaurar campos en public.actividades
    UPDATE public.actividades
    SET
        datos_formato_json = v_datos_formato,
        codigo_referencia = COALESCE(v_actividad_data->>'codigo_referencia', codigo_referencia),
        tipo_actividad = COALESCE(v_actividad_data->>'tipo_actividad', tipo_actividad),
        fecha_operacion = COALESCE(v_actividad_data->>'fecha_operacion', fecha_operacion),
        responsable_nombre = COALESCE(v_actividad_data->>'responsable_nombre', responsable_nombre),
        ubicacion = COALESCE(v_actividad_data->>'ubicacion', ubicacion),
        descripcion = v_actividad_data->>'descripcion',
        estado_reporte = COALESCE(v_actividad_data->>'estado_reporte', estado_reporte),
        actualizado_en = now()
    WHERE id = v_actividad_id;

    RETURN jsonb_build_object(
        'success', true,
        'actividad_id', v_actividad_id,
        'backup_id', p_backup_id,
        'mensaje', 'Actividad restaurada exitosamente al estado del snapshot.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos de ejecución de funciones RPC
GRANT EXECUTE ON FUNCTION public.aplicar_parche_actividad_con_backup(UUID, JSONB, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.restaurar_backup_actividad(UUID) TO authenticated, service_role;

-- 4. Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
