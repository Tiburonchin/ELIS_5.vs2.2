-- ==============================================================================
-- PROYECTO: ELIS 5.0 Cloud-Native (Base de Datos en Supabase)
-- MIGRACIÓN: 20261014_fix_actividades_sync_and_rpc.sql
-- DESCRIPCIÓN: Blindaje de public.actividades, índice GIN, trigger actualizado_en,
--              políticas RLS para supervisor/inspector y RPC guardar_actividad_hse_completa
-- FECHA: 2026-10-14
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. NORMALIZACIÓN Y COLUMNAS DE public.actividades
-- ------------------------------------------------------------------------------

-- Asegurar que datos_formato_json exista como JSONB NOT NULL DEFAULT '{}'::jsonb
UPDATE public.actividades 
SET datos_formato_json = '{}'::jsonb 
WHERE datos_formato_json IS NULL;

ALTER TABLE public.actividades 
    ALTER COLUMN datos_formato_json SET DEFAULT '{}'::jsonb,
    ALTER COLUMN datos_formato_json SET NOT NULL;

-- Índice GIN para búsquedas y consultas optimizadas dentro del JSONB de formatos HSE
CREATE INDEX IF NOT EXISTS idx_actividades_datos_formato_gin 
    ON public.actividades USING GIN (datos_formato_json);

-- Asegurar que responsable_id tenga DEFAULT auth.uid()
ALTER TABLE public.actividades 
    ALTER COLUMN responsable_id SET DEFAULT auth.uid();

-- Reparar cualquier registro huérfano (responsable_id IS NULL) asignándolo al primer usuario de auth.users si existe
UPDATE public.actividades 
SET responsable_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1) 
WHERE responsable_id IS NULL 
  AND EXISTS (SELECT 1 FROM auth.users);

-- ------------------------------------------------------------------------------
-- 2. TRIGGER AUTOMÁTICO trg_set_actualizado_en
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_set_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_actualizado_en_actividades ON public.actividades;
CREATE TRIGGER trg_set_actualizado_en_actividades
    BEFORE UPDATE ON public.actividades
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_actualizado_en();

DROP TRIGGER IF EXISTS trg_set_actualizado_en_perfiles ON public.perfiles;
CREATE TRIGGER trg_set_actualizado_en_perfiles
    BEFORE UPDATE ON public.perfiles
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_actualizado_en();

-- ------------------------------------------------------------------------------
-- 3. OPTIMIZACIÓN DE POLÍTICAS RLS EN public.actividades
-- ------------------------------------------------------------------------------
-- Permitir que usuarios autenticados puedan actualizar si son responsables, si la actividad
-- aún no tiene responsable asignado (auto-asignación), o si su perfil tiene rol 'supervisor' o 'administrador'.

DROP POLICY IF EXISTS "actividades_update_authenticated" ON public.actividades;
CREATE POLICY "actividades_update_authenticated"
    ON public.actividades FOR UPDATE
    TO authenticated
    USING (
        responsable_id IS NULL 
        OR responsable_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.rol IN ('supervisor', 'administrador')
        )
    )
    WITH CHECK (
        responsable_id IS NULL 
        OR responsable_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.perfiles p
            WHERE p.id = (SELECT auth.uid())
              AND p.rol IN ('supervisor', 'administrador')
        )
    );

-- ------------------------------------------------------------------------------
-- 4. FUNCIÓN RPC ATÓMICA: guardar_actividad_hse_completa
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guardar_actividad_hse_completa(
    p_id UUID DEFAULT NULL,
    p_datos_generales JSONB DEFAULT '{}'::jsonb,
    p_datos_formato_json JSONB DEFAULT '{}'::jsonb,
    p_estado_reporte TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_id UUID;
    v_user_id UUID;
    v_actividad RECORD;
    v_codigo TEXT;
    v_tipo TEXT;
    v_fecha DATE;
    v_responsable_nombre TEXT;
    v_ubicacion TEXT;
    v_descripcion TEXT;
    v_estado TEXT;
    v_formato JSONB;
BEGIN
    v_user_id := auth.uid();
    v_id := p_id;
    v_formato := COALESCE(p_datos_formato_json, '{}'::jsonb);

    -- Extraer valores de campos generales
    v_codigo := NULLIF(TRIM(p_datos_generales->>'codigo_referencia'), '');
    v_tipo := NULLIF(TRIM(p_datos_generales->>'tipo_actividad'), '');
    v_fecha := (p_datos_generales->>'fecha_operacion')::DATE;
    v_responsable_nombre := NULLIF(TRIM(p_datos_generales->>'responsable_nombre'), '');
    v_ubicacion := NULLIF(TRIM(p_datos_generales->>'ubicacion'), '');
    v_descripcion := p_datos_generales->>'descripcion';
    v_estado := COALESCE(p_estado_reporte, p_datos_generales->>'estado_reporte', 'pendiente');

    IF v_id IS NOT NULL THEN
        -- Actualización de actividad existente
        UPDATE public.actividades
        SET 
            codigo_referencia = COALESCE(v_codigo, codigo_referencia),
            tipo_actividad = COALESCE(v_tipo, tipo_actividad),
            fecha_operacion = COALESCE(v_fecha, fecha_operacion),
            responsable_id = COALESCE(responsable_id, v_user_id),
            responsable_nombre = COALESCE(v_responsable_nombre, responsable_nombre),
            ubicacion = COALESCE(v_ubicacion, ubicacion),
            descripcion = CASE 
                WHEN p_datos_generales ? 'descripcion' THEN v_descripcion 
                ELSE descripcion 
            END,
            estado_reporte = COALESCE(v_estado, estado_reporte),
            datos_formato_json = v_formato,
            actualizado_en = now()
        WHERE id = v_id
        RETURNING * INTO v_actividad;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Actividad con ID % no encontrada para actualizar.', v_id;
        END IF;
    ELSE
        -- Inserción de nueva actividad
        IF v_codigo IS NULL THEN
            RAISE EXCEPTION 'El código de referencia es obligatorio para crear una actividad.';
        END IF;

        IF v_tipo IS NULL THEN
            v_tipo := 'INSPECCION';
        END IF;

        IF v_fecha IS NULL THEN
            v_fecha := CURRENT_DATE;
        END IF;

        IF v_ubicacion IS NULL THEN
            v_ubicacion := 'Área de Operaciones';
        END IF;

        IF v_responsable_nombre IS NULL THEN
            SELECT nombres_completos INTO v_responsable_nombre 
            FROM public.perfiles 
            WHERE id = v_user_id;

            IF v_responsable_nombre IS NULL THEN
                v_responsable_nombre := 'Inspector HSE';
            END IF;
        END IF;

        INSERT INTO public.actividades (
            codigo_referencia,
            tipo_actividad,
            fecha_operacion,
            responsable_id,
            responsable_nombre,
            ubicacion,
            descripcion,
            estado_reporte,
            datos_formato_json,
            creado_en,
            actualizado_en
        )
        VALUES (
            v_codigo,
            v_tipo,
            v_fecha,
            v_user_id,
            v_responsable_nombre,
            v_ubicacion,
            v_descripcion,
            COALESCE(v_estado, 'pendiente'),
            v_formato,
            now(),
            now()
        )
        ON CONFLICT (codigo_referencia) DO UPDATE
        SET 
            tipo_actividad = EXCLUDED.tipo_actividad,
            fecha_operacion = EXCLUDED.fecha_operacion,
            responsable_id = COALESCE(public.actividades.responsable_id, EXCLUDED.responsable_id),
            responsable_nombre = EXCLUDED.responsable_nombre,
            ubicacion = EXCLUDED.ubicacion,
            descripcion = EXCLUDED.descripcion,
            estado_reporte = EXCLUDED.estado_reporte,
            datos_formato_json = EXCLUDED.datos_formato_json,
            actualizado_en = now()
        RETURNING * INTO v_actividad;
    END IF;

    -- Retornar la fila completa como JSONB
    RETURN to_jsonb(v_actividad);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Conceder ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.guardar_actividad_hse_completa(UUID, JSONB, JSONB, TEXT) TO authenticated;

-- ------------------------------------------------------------------------------
-- 5. RECARGA DE CACHÉ POSTGREST
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
