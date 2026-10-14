-- ==============================================================================
-- PROYECTO: ELIS 5.0 Cloud-Native (Base de Datos en Supabase)
-- DESCRIPCIÓN: Modelo Relacional Normalizado, Triggers de Auditoría y RPC Atómica
-- FECHA: 2026-10-13 (Versión Final de Producción con Integridad Referencial)
-- ==============================================================================

-- 0. LIMPIEZA PREVIA CON CASCADE (Para inicializaciones idempotentes)
DROP TRIGGER IF EXISTS trg_auditoria_evidencias ON public.evidencias;
DROP TRIGGER IF EXISTS trg_auditoria_actividades ON public.actividades;
DROP TRIGGER IF EXISTS trg_audit_evidencias ON public.evidencias;
DROP TRIGGER IF EXISTS trg_audit_actividades ON public.actividades;
DROP TRIGGER IF EXISTS trg_audit_identificaciones ON public.identificaciones;
DROP TRIGGER IF EXISTS trg_audit_vinculos ON public.vinculos;

DROP TABLE IF EXISTS public.vinculos CASCADE;
DROP TABLE IF EXISTS public.identificaciones CASCADE;
DROP TABLE IF EXISTS public.evidencias CASCADE;
DROP TABLE IF EXISTS public.actividades CASCADE;
DROP TABLE IF EXISTS public.auditoria CASCADE;

-- 1. EXTENSIÓN PARA CRIPTOGRAFÍA Y UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLA DE EVIDENCIAS (Inmutable por diseño y deduplicada)
CREATE TABLE public.evidencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_archivo TEXT NOT NULL,
    ruta_storage TEXT NOT NULL,
    ruta_thumb TEXT,
    hash_sha256 CHAR(64) NOT NULL UNIQUE,
    tamano_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    fecha_captura TIMESTAMPTZ,
    fecha_ingesta TIMESTAMPTZ NOT NULL DEFAULT now(),
    estado TEXT NOT NULL DEFAULT 'pendiente' 
        CHECK (estado IN ('pendiente', 'vinculada', 'archivada', 'error')),
    metadatos_json JSONB DEFAULT '{}'::jsonb,
    subido_por UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 3. TABLA DE IDENTIFICACIONES (OCR validado por humano 1:1)
CREATE TABLE public.identificaciones (
    evidencia_id UUID PRIMARY KEY REFERENCES public.evidencias(id) ON DELETE RESTRICT,
    apellido_paterno TEXT NOT NULL,
    apellido_materno TEXT NOT NULL,
    nombres TEXT NOT NULL,
    cargo TEXT,
    texto_crudo_ocr TEXT,
    nivel_confianza REAL CHECK (nivel_confianza >= 0.0 AND nivel_confianza <= 1.0),
    confirmado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    confirmador_email TEXT,
    confirmado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABLA DE ACTIVIDADES (Inspecciones y Auditorías de Campo)
CREATE TABLE public.actividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_referencia TEXT NOT NULL UNIQUE,
    tipo_actividad TEXT NOT NULL 
        CHECK (tipo_actividad IN ('INSPECCION', 'CAPACITACION', 'AUDITORIA')),
    fecha_operacion DATE NOT NULL,
    responsable_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    responsable_nombre TEXT NOT NULL,
    ubicacion TEXT NOT NULL,
    descripcion TEXT,
    estado_reporte TEXT NOT NULL DEFAULT 'pendiente' 
        CHECK (estado_reporte IN ('pendiente', 'exportada', 'publicada')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABLA DE VÍNCULOS (Garantiza 1 evidencia = 1 actividad)
CREATE TABLE public.vinculos (
    evidencia_id UUID PRIMARY KEY REFERENCES public.evidencias(id) ON DELETE RESTRICT,
    actividad_id UUID NOT NULL REFERENCES public.actividades(id) ON DELETE RESTRICT,
    vinculado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    vinculado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    notas TEXT
);

-- 6. TABLA DE AUDITORÍA UNIVERSAL E INMUTABLE
CREATE TABLE public.auditoria (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    operacion TEXT NOT NULL,   -- INSERT, UPDATE, DELETE
    tabla TEXT NOT NULL,       -- evidencias, actividades, vinculos, identificaciones
    entidad_id TEXT NOT NULL,  -- UUID del registro afectado
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    usuario_email TEXT DEFAULT COALESCE(current_setting('request.jwt.claims', true)::json->>'email', 'sistema'),
    payload_anterior JSONB,
    payload_nuevo JSONB,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. ÍNDICES DE ALTA VELOCIDAD
CREATE INDEX idx_evidencias_estado ON public.evidencias(estado);
CREATE INDEX idx_evidencias_fecha ON public.evidencias(fecha_ingesta DESC);
CREATE INDEX idx_evidencias_subido_por ON public.evidencias(subido_por);
CREATE INDEX idx_vinculos_actividad ON public.vinculos(actividad_id);
CREATE INDEX idx_auditoria_entidad ON public.auditoria(tabla, entidad_id);
CREATE INDEX idx_auditoria_fecha ON public.auditoria(creado_en DESC);

-- 8. TRIGGER UNIVERSAL DE AUDITORÍA AUTOMÁTICA
CREATE OR REPLACE FUNCTION public.fn_registrar_auditoria_universal() 
RETURNS TRIGGER AS $$ 
DECLARE
    v_id TEXT;
    v_user_id UUID;
    v_user_email TEXT;
BEGIN 
    IF (TG_TABLE_NAME = 'vinculos' OR TG_TABLE_NAME = 'identificaciones') THEN
        v_id := COALESCE(NEW.evidencia_id::TEXT, OLD.evidencia_id::TEXT);
    ELSE
        v_id := COALESCE(NEW.id::TEXT, OLD.id::TEXT);
    END IF;

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

-- Aplicar Trigger universal a todas las tablas del negocio
CREATE TRIGGER trg_audit_evidencias AFTER INSERT OR UPDATE OR DELETE ON public.evidencias FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_auditoria_universal();
CREATE TRIGGER trg_audit_actividades AFTER INSERT OR UPDATE OR DELETE ON public.actividades FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_auditoria_universal();
CREATE TRIGGER trg_audit_identificaciones AFTER INSERT OR UPDATE OR DELETE ON public.identificaciones FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_auditoria_universal();
CREATE TRIGGER trg_audit_vinculos AFTER INSERT OR UPDATE OR DELETE ON public.vinculos FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_auditoria_universal();

-- 9. FUNCIÓN RPC PARA VINCULACIÓN ATÓMICA
CREATE OR REPLACE FUNCTION public.vincular_evidencia_atomica( 
    p_evidencia_id UUID, 
    p_actividad_id UUID, 
    p_notas TEXT DEFAULT NULL 
) 
RETURNS BOOLEAN AS $$ 
BEGIN 
    UPDATE public.evidencias 
    SET estado = 'vinculada' 
    WHERE id = p_evidencia_id; 

    INSERT INTO public.vinculos (evidencia_id, actividad_id, vinculado_por, notas) 
    VALUES (p_evidencia_id, p_actividad_id, auth.uid(), p_notas) 
    ON CONFLICT (evidencia_id) DO UPDATE 
    SET actividad_id = EXCLUDED.actividad_id, 
        vinculado_por = auth.uid(), 
        notas = EXCLUDED.notas, 
        vinculado_en = now(); 

    RETURN TRUE; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;
