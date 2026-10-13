---
description: "Patrones de Acceso a Datos y Reutilización: TypeScript POO, BaseSupabaseService y RPC atómicas"
globs: src/services/**/*,src/hooks/**/*
alwaysApply: false
---

# ELIS 5.0 — Patrones de Servicios y Acceso a Datos (TypeScript + Supabase)

## 1. Reutilización mediante BaseSupabaseService<T>
* **Patrón de Herencia Obligatorio:** Todos los servicios de datos (`EvidenceService`, `ActivityService`, etc.) DEBEN heredar de la clase base genérica `BaseSupabaseService<T>`.
* **Prohibido Duplicar Lógica CRUD:** Las operaciones genéricas (`getAllPaginated`, `getById`, `create`, `updateStatus`) ya están resueltas en `BaseSupabaseService<T>`. Los servicios derivados solo implementan lógica de negocio específica y consultas personalizadas.
* Tipado estricto en cada entidad utilizando los tipos generados de Supabase (`Database['public']['Tables']`).

## 2. Transacciones Atómicas mediante RPC
* Cuando una operación afecte múltiples tablas de forma atómica (por ejemplo, vincular una evidencia a una actividad y cambiar simultáneamente su estado a `'vinculada'`), DEBE invocarse a una función SQL de PostgreSQL mediante:
  ```typescript
  const { data, error } = await supabase.rpc('vincular_evidencia_atomica', {
    p_evidencia_id: evidenciaId,
    p_actividad_id: actividadId
  });
  ```
* Prohibido realizar múltiples mutaciones secuenciales manuales desde el cliente que puedan dejar estados inconsistentes ante pérdidas de conexión en campo.

## 3. Microservicio Backend FastAPI (Opcional / Tareas Pesadas)
* Si se implementa un microservicio backend en Python para tareas que no corran en el cliente:
  * Rutas limpias sin lógica de negocio (handlers delegados a `services/`).
  * Inyección de dependencias con `Depends(...)`.
  * Respuestas estandarizadas `StandardResponse[T]` para éxito y `ProblemDetails` (RFC 7807) para errores.
