-- ==============================================================================
-- PROYECTO: ELIS 5.0 Cloud-Native (Base de Datos en Supabase)
-- DESCRIPCIÓN: Modelo Relacional, Triggers de Auditoría Automática y RPC Atómica
-- FECHA: 2026-10-13
-- ==============================================================================

-- Habilitar extensión para UUIDs si no está activa
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TABLA DE EVIDENCIAS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evidencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_archivo TEXT NOT NULL,
    ruta_storage TEXT NOT NULL,
    ruta_thumb TEXT,
    hash_sha256 CHAR(64) NOT NULL UNIQUE,
    tamano_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    fecha_captura TIMESTAMPTZ,
    fecha_ingesta TIMESTAMPTZ NOT NULL DEFAULT now(),
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'vinculada', 'archivada', 'error')),
    metadatos_json JSONB DEFAULT '{}'::jsonb
);

-- ------------------------------------------------------------------------------
-- 2. TABLA DE IDENTIFICACIONES (OCR validado por humano 1:1)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.identificaciones (
    evidencia_id UUID PRIMARY KEY REFERENCES public.evidencias(id) ON DELETE RESTRICT,
    apellido_paterno TEXT NOT NULL,
    apellido_materno TEXT NOT NULL,
    nombres TEXT NOT NULL,
    cargo TEXT,
    texto_crudo_ocr TEXT,
    nivel_confianza REAL CHECK (nivel_confianza >= 0.0 AND nivel_confianza <= 1.0),
    confirmado_por TEXT NOT NULL,
    confirmado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. TABLA DE ACTIVIDADES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.actividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_referencia TEXT NOT NULL UNIQUE,
    tipo_actividad TEXT NOT NULL CHECK (tipo_actividad IN ('INSPECCION', 'CAPACITACION', 'AUDITORIA')),
    fecha_operacion DATE NOT NULL,
    responsable TEXT NOT NULL,
    ubicacion TEXT NOT NULL,
    descripcion TEXT,
    estado_reporte TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_reporte IN ('pendiente', 'exportada', 'publicada')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 4. TABLA DE VÍNCULOS (1 evidencia pertenece a 1 actividad)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vinculos (
    evidencia_id UUID PRIMARY KEY REFERENCES public.evidencias(id) ON DELETE RESTRICT,
    actividad_id UUID NOT NULL REFERENCES public.actividades(id) ON DELETE RESTRICT,
    vinculado_por TEXT NOT NULL,
    vinculado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    notas TEXT
);

-- ------------------------------------------------------------------------------
-- 5. TABLA DE AUDITORÍA INMUTABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auditoria (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    evento TEXT NOT NULL,
    entidad TEXT NOT NULL,
    entidad_id TEXT NOT NULL,
    usuario TEXT NOT NULL DEFAULT COALESCE(current_setting('request.jwt.claims', true)::json->>'email', 'sistema_local'),
    payload_anterior JSONB,
    payload_nuevo JSONB,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- ÍNDICES DE ALTA VELOCIDAD
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_evidencias_estado ON public.evidencias(estado);
CREATE INDEX IF NOT EXISTS idx_evidencias_fecha ON public.evidencias(fecha_ingesta DESC);
CREATE INDEX IF NOT EXISTS idx_vinculos_actividad ON public.vinculos(actividad_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidad ON public.auditoria(entidad, entidad_id);

-- ------------------------------------------------------------------------------
-- MOTOR AUTOMÁTICO DE AUDITORÍA (TRIGGER)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_registrar_auditoria() 
RETURNS TRIGGER AS $$ 
BEGIN 
    IF (TG_OP = 'INSERT') THEN 
        INSERT INTO public.auditoria (
            evento, 
            entidad, 
            entidad_id, 
            payload_anterior, 
            payload_nuevo
        ) VALUES (
            TG_TABLE_NAME || '_REGISTRADO', 
            TG_TABLE_NAME, 
            NEW.id::TEXT, 
            NULL, 
            to_jsonb(NEW)
        ); 
        RETURN NEW; 
    ELSIF (TG_OP = 'UPDATE') THEN 
        INSERT INTO public.auditoria (
            evento, 
            entidad, 
            entidad_id, 
            payload_anterior, 
            payload_nuevo
        ) VALUES (
            TG_TABLE_NAME || '_ACTUALIZADO', 
            TG_TABLE_NAME, 
            NEW.id::TEXT, 
            to_jsonb(OLD), 
            to_jsonb(NEW)
        ); 
        RETURN NEW; 
    END IF; 
    RETURN NULL; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar Trigger a las tablas principales
DROP TRIGGER IF EXISTS trg_auditoria_evidencias ON public.evidencias;
CREATE TRIGGER trg_auditoria_evidencias 
AFTER INSERT OR UPDATE ON public.evidencias 
FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_auditoria();

DROP TRIGGER IF EXISTS trg_auditoria_actividades ON public.actividades;
CREATE TRIGGER trg_auditoria_actividades 
AFTER INSERT OR UPDATE ON public.actividades 
FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_auditoria();

-- ------------------------------------------------------------------------------
-- FUNCIÓN RPC PARA VINCULACIÓN ATÓMICA
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vincular_evidencia_atomica( 
    p_evidencia_id UUID, 
    p_actividad_id UUID, 
    p_revisor TEXT, 
    p_notas TEXT DEFAULT NULL 
) 
RETURNS BOOLEAN AS $$ 
BEGIN 
    -- 1. Actualizar estado de evidencia a 'vinculada'
    UPDATE public.evidencias 
    SET estado = 'vinculada' 
    WHERE id = p_evidencia_id; 

    -- 2. Insertar o actualizar relación en tabla vinculos
    INSERT INTO public.vinculos (evidencia_id, actividad_id, vinculado_por, notas) 
    VALUES (p_evidencia_id, p_actividad_id, p_revisor, p_notas) 
    ON CONFLICT (evidencia_id) DO UPDATE 
    SET actividad_id = EXCLUDED.actividad_id, 
        vinculado_por = EXCLUDED.vinculado_por, 
        notas = EXCLUDED.notas, 
        vinculado_en = now(); 

    -- 3. Registro explícito de auditoría del evento de vinculación
    INSERT INTO public.auditoria (evento, entidad, entidad_id, usuario, payload_nuevo) 
    VALUES (
        'EVIDENCIA_VINCULADA', 
        'vinculos', 
        p_evidencia_id::TEXT, 
        p_revisor, 
        jsonb_build_object('evidencia_id', p_evidencia_id, 'actividad_id', p_actividad_id)
    ); 

    RETURN TRUE; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;
