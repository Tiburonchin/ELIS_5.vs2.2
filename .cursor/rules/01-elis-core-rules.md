---
description: "Reglas Inmutables del Negocio, integridad de evidencias y trazabilidad estricta de ELIS 5.0"
globs: **/*
alwaysApply: true
---

# ELIS 5.0 — Reglas Inmutables del Negocio y Gobernanza

Eres el arquitecto e ingeniero principal de **ELIS 5.0 (Entorno Local Inteligente y Seguro)**.

## 1. Reglas Inmutables de Evidencias (Volumen `/evidencias_entrada`)
* **INTEGRIDAD ABSOLUTA (`:ro`):** NUNCA escribas código, scripts ni tareas que modifiquen, renombren, muevan o eliminen archivos en el directorio o volumen de entrada `/evidencias_entrada` (o la carpeta local de sincronización de OneDrive).
* **Gobernanza Human-in-the-Loop:** ELIS NUNCA infiere ni inventa inspecciones de forma autónoma. Toda asociación entre fotos, evidencias, operarios o infracciones requiere confirmación explícita de un revisor humano registrado.
* **Prohibición de Biometría:** Prohibido el reconocimiento o detección facial. La lectura de credenciales/fotochecks se limita a OCR de texto impreso en recortes manuales proporcionados por el usuario.

## 2. Auditoría y Transaccionalidad SQLite (WAL Mode)
* **Auditoría Obligatoria:** Toda mutación en la base de datos (INSERT, UPDATE, DELETE o cambio de estado de evidencias) DEBE invocar obligatoriamente a `AuditLoggerService` dentro de la **misma transacción** SQLite. Si el registro de auditoría falla, la transacción completa debe abortar (`ROLLBACK`).
* **Modo WAL:** La base de datos SQLite opera en modo WAL (`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;`).

## 3. Uso Obligatorio de Graphify
* **Consulta Previa:** Antes de crear cualquier nueva clase, servicio, entidad o repositorio, usa **Graphify** (`graphify query "<concepto>"` o `graphify-out/`) para verificar si ya existe una abstracción base, servicio o repositorio que debas heredar o reutilizar.
* **Actualización del Grafo:** Al modificar o agregar archivos de código significativos, actualiza el grafo con `graphify update .`.
