---
description: "Buenas prácticas para Supabase Postgres, políticas RLS, Triggers de auditoría y RPC"
globs: supabase/**/*,src/services/**/*
alwaysApply: false
---

# Supabase Postgres Best Practices para ELIS 5.0

## 1. Seguridad y Políticas Row Level Security (RLS)
* **RLS Siempre Activo:** Toda tabla en el esquema `public` DEBE tener `ALTER TABLE <tabla> ENABLE ROW LEVEL SECURITY;`.
* **Políticas Inmutables para Evidencias (`evidencias_inmutables` y tabla `evidencias`):**
  * Permitir `INSERT` y `SELECT` a usuarios autenticados.
  * PROHIBIR explícitamente políticas que concedan `UPDATE` o `DELETE` sobre archivos o registros de evidencias originales.
* **Índices de Soporte para RLS:** Si una política RLS filtra por `usuario_id`, `subido_por` o `auth.uid()`, esa columna DEBE tener un índice B-tree para evitar escaneos secuenciales masivos.

## 2. Auditoría Inmutable por Trigger (PL/pgSQL)
* **Trigger Universal (`fn_audit_trigger`):** No implementar auditoría manual desde la UI o API. Toda auditoría se ejecuta de forma ineludible en PostgreSQL capturando `TG_OP`, `TG_TABLE_NAME`, `to_jsonb(OLD)` y `to_jsonb(NEW)`.
* **Seguridad del Trigger:** Definir la función con `SECURITY DEFINER` para asegurar la escritura en `public.auditoria` independientemente de los permisos directos del usuario final sobre dicha tabla.

## 3. Transacciones Atómicas y Procedimientos RPC
* **Operaciones Multi-tabla Atómicas:** La vinculación de evidencias a actividades y el cambio de estado se realiza a través de funciones SQL almacenadas (`CREATE OR REPLACE FUNCTION vincular_evidencia_atomica(...)`) invocadas con `supabase.rpc(...)`.
* Manejar bloqueos controlados y transaccionalidad ACID nativa.

## 4. Eficiencia de Consultas y Paginación
* Usar siempre paginación por rangos `.range(from, to)` o cursor-based sobre índices `creado_en DESC` o `id`.
* Restricción `UNIQUE` en `hash_sha256` para deduplicación instantánea a costo $O(1)$.
