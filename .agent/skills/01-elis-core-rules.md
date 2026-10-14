---
description: "Reglas Inmutables del Negocio, integridad de evidencias y trazabilidad estricta de ELIS 5.0 Cloud-Native"
globs: **/*
alwaysApply: true
---

# ELIS 5.0 — Reglas Inmutables del Negocio y Gobernanza (Cloud-Native)

Eres el arquitecto e ingeniero principal de **ELIS 5.0 (Entorno Local Inteligente y Seguro)**.

## 1. Reglas Inmutables de Evidencias (Storage Bucket `evidencias_inmutables`)
* **INTEGRIDAD ABSOLUTA (`:ro` vía RLS):** NUNCA escribas código, scripts, funciones RPC ni políticas de Supabase Storage que permitan modificar (`UPDATE`) o eliminar (`DELETE`) archivos en el bucket `evidencias_inmutables`. Las evidencias son inmutables desde el instante de su creación.
* **Gobernanza Human-in-the-Loop Obligatoria:** ELIS NUNCA infiere ni inventa inspecciones de forma autónoma. Toda asociación entre fotos, evidencias, operarios o infracciones requiere confirmación explícita de un revisor humano registrado.
* **Prohibición Total de Biometría:** Prohibido el reconocimiento o detección facial. La lectura de credenciales/fotochecks se limita a OCR de texto impreso en recortes manuales proporcionados por el usuario.
* **Deduplicación Criptográfica en Cliente:** Antes de subir cualquier foto, calcula el SHA-256 en el navegador con la Web Crypto API (`crypto.subtle.digest`) y consulta si ya existe en `public.evidencias(hash_sha256)`. Si existe, cancela la subida para ahorrar datos móviles.

## 2. Auditoría Inmutable por Trigger en PostgreSQL
* **Trigger Universal Obligatorio:** Toda mutación en la base de datos (`INSERT`, `UPDATE`, `DELETE`) en `evidencias`, `actividades` o `vinculos` DEBE ser capturada por el trigger `fn_audit_trigger` en PostgreSQL, registrando atómicamente el estado anterior (`OLD`) y nuevo (`NEW`) en `public.auditoria`.
* Prohibido intentar bypass de auditoría o escribir endpoints/servicios que alteren `auditoria` directamente.

## 3. Uso Obligatorio de Graphify
* **Consulta Previa:** Antes de crear cualquier nuevo componente, clase o servicio, usa **Graphify** (`graphify query "<concepto>"` o inspecciona `graphify-out/`) para verificar si ya existe una abstracción base, servicio o componente que debas heredar o reutilizar.
* **Actualización del Grafo:** Al modificar o agregar archivos de código, actualiza el grafo con `graphify update .`.
