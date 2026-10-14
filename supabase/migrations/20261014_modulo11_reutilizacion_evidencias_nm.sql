-- ==============================================================================
-- MÓDULO 11: REUTILIZACIÓN DE EVIDENCIAS N:M Y SUBIDA MULTI-UPLOAD
-- Archivo: supabase/migrations/20261014_modulo11_reutilizacion_evidencias_nm.sql
-- Descripción:
-- 1. Modifica la tabla public.vinculos: cambia la relación 1:1 a N:M mediante
--    PRIMARY KEY compuesta (evidencia_id, actividad_id).
-- 2. Agrega la columna rol_evidencia TEXT DEFAULT 'hallazgo' con CHECK.
-- 3. Actualiza el índice idx_vinculos_actividad y añade idx_vinculos_evidencia_rol.
-- 4. Actualiza public.vincular_evidencia_atomica para soportar rol_evidencia
--    y ON CONFLICT (evidencia_id, actividad_id) DO UPDATE.
-- 5. Crea la función RPC public.vincular_multiples_evidencias para asociar lotes
--    de imágenes en una sola transacción ACID.
-- 6. Notifica recarga de esquema a PostgREST.
-- ==============================================================================

-- 1. Modificar tabla public.vinculos para relación N:M
DO $$
BEGIN
    -- Eliminar la clave primaria simple existente sobre evidencia_id si existe
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'vinculos_pkey' 
        AND conrelid = 'public.vinculos'::regclass
    ) THEN
        ALTER TABLE public.vinculos DROP CONSTRAINT vinculos_pkey;
    END IF;

    -- Agregar columna rol_evidencia si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vinculos' 
        AND column_name = 'rol_evidencia'
    ) THEN
        ALTER TABLE public.vinculos 
        ADD COLUMN rol_evidencia TEXT NOT NULL DEFAULT 'hallazgo' 
        CHECK (rol_evidencia IN ('hallazgo', 'correccion', 'fotocheck', 'whatsapp_captura', 'general'));
    END IF;

    -- Crear la llave primaria compuesta (evidencia_id, actividad_id) si aún no está creada
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'vinculos_pkey' 
        AND conrelid = 'public.vinculos'::regclass
    ) THEN
        ALTER TABLE public.vinculos 
        ADD CONSTRAINT vinculos_pkey PRIMARY KEY (evidencia_id, actividad_id);
    END IF;
END $$;

-- 2. Índices de optimización para búsqueda por actividad, evidencia y rol
CREATE INDEX IF NOT EXISTS idx_vinculos_actividad ON public.vinculos(actividad_id);
CREATE INDEX IF NOT EXISTS idx_vinculos_evidencia ON public.vinculos(evidencia_id);
CREATE INDEX IF NOT EXISTS idx_vinculos_rol ON public.vinculos(rol_evidencia);

-- Eliminar firmas previas en caso de variación de nombres o parámetros
DROP FUNCTION IF EXISTS public.vincular_evidencia_atomica(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.vincular_evidencia_atomica(UUID, UUID, TEXT, TEXT);

-- 3. Actualización de la función RPC vincular_evidencia_atomica
-- Soporta p_rol_evidencia y maneja ON CONFLICT sobre la clave compuesta (evidencia_id, actividad_id)
CREATE OR REPLACE FUNCTION public.vincular_evidencia_atomica(
    p_evidencia_id UUID,
    p_actividad_id UUID,
    p_notas TEXT DEFAULT NULL,
    p_rol_evidencia TEXT DEFAULT 'hallazgo'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_usuario_id UUID;
    v_rol TEXT;
BEGIN
    v_usuario_id := auth.uid();
    v_rol := COALESCE(NULLIF(p_rol_evidencia, ''), 'hallazgo');

    -- Validar rol permitido
    IF v_rol NOT IN ('hallazgo', 'correccion', 'fotocheck', 'whatsapp_captura', 'general') THEN
        v_rol := 'hallazgo';
    END IF;

    -- 1. Actualizar estado de la evidencia a 'vinculada'
    UPDATE public.evidencias
    SET estado = 'vinculada'
    WHERE id = p_evidencia_id;

    -- 2. Insertar o actualizar el vínculo N:M
    INSERT INTO public.vinculos (evidencia_id, actividad_id, vinculado_por, notas, rol_evidencia, vinculado_en)
    VALUES (p_evidencia_id, p_actividad_id, v_usuario_id, p_notas, v_rol, now())
    ON CONFLICT (evidencia_id, actividad_id) DO UPDATE
    SET vinculado_por = COALESCE(EXCLUDED.vinculado_por, public.vinculos.vinculado_por),
        notas = EXCLUDED.notas,
        rol_evidencia = EXCLUDED.rol_evidencia,
        vinculado_en = now();

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Nueva función RPC vincular_multiples_evidencias para vinculación atómica por lotes
DROP FUNCTION IF EXISTS public.vincular_multiples_evidencias(UUID[], UUID, TEXT);

CREATE OR REPLACE FUNCTION public.vincular_multiples_evidencias(
    p_evidencia_ids UUID[],
    p_actividad_id UUID,
    p_rol_evidencia TEXT DEFAULT 'hallazgo'
)
RETURNS JSONB AS $$
DECLARE
    v_usuario_id UUID;
    v_rol TEXT;
    v_evidencia_id UUID;
    v_count INT := 0;
BEGIN
    v_usuario_id := auth.uid();
    v_rol := COALESCE(NULLIF(p_rol_evidencia, ''), 'hallazgo');

    IF v_rol NOT IN ('hallazgo', 'correccion', 'fotocheck', 'whatsapp_captura', 'general') THEN
        v_rol := 'hallazgo';
    END IF;

    IF p_evidencia_ids IS NULL OR array_length(p_evidencia_ids, 1) IS NULL THEN
        RETURN jsonb_build_object('success', true, 'vinculados_count', 0);
    END IF;

    -- Actualizar estado a 'vinculada' en lote para todas las evidencias indicadas
    UPDATE public.evidencias
    SET estado = 'vinculada'
    WHERE id = ANY(p_evidencia_ids);

    -- Insertar o actualizar vínculos en lote de forma atómica
    FOREACH v_evidencia_id IN ARRAY p_evidencia_ids
    LOOP
        INSERT INTO public.vinculos (evidencia_id, actividad_id, vinculado_por, notas, rol_evidencia, vinculado_en)
        VALUES (v_evidencia_id, p_actividad_id, v_usuario_id, NULL, v_rol, now())
        ON CONFLICT (evidencia_id, actividad_id) DO UPDATE
        SET vinculado_por = COALESCE(EXCLUDED.vinculado_por, public.vinculos.vinculado_por),
            rol_evidencia = EXCLUDED.rol_evidencia,
            vinculado_en = now();

        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'actividad_id', p_actividad_id,
        'vinculados_count', v_count,
        'rol_evidencia', v_rol
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Otorgar permisos de ejecución a roles autenticados
GRANT EXECUTE ON FUNCTION public.vincular_evidencia_atomica(UUID, UUID, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vincular_multiples_evidencias(UUID[], UUID, TEXT) TO authenticated, service_role;

-- 6. Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
