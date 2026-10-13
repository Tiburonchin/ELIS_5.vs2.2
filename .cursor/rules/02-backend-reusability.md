---
description: "Patrones de arquitectura de Backend: FastAPI, SQLAlchemy Async, GenericRepository y RFC 7807"
globs: backend/**/*
alwaysApply: false
---

# ELIS 5.0 — Patrones de Backend (FastAPI + SQLAlchemy Async)

## 1. Capas y Responsabilidades
* **Rutas limpias (Thin Handlers):** Ninguna ruta ni endpoint de FastAPI puede contener lógica de negocio. Los endpoints solo realizan inyección de dependencias (`Depends`), validación de esquemas y delegan a la capa `services/`.
* **Inyección de Dependencias:** Utiliza siempre el sistema de `Depends(...)` de FastAPI para bases de datos, repositorios, servicios y autenticación por API Key (`X-ELIS-Key`).

## 2. Patrón de Persistencia (GenericRepository Async)
* Implementa el patrón `GenericRepository[T, ID]` sobre SQLAlchemy 2.0 Async (`AsyncSession`).
* Operaciones asíncronas puras con `async/await` (`select`, `execute`, `scalars`).
* Ninguna consulta SQL cruda en endpoints ni en servicios de alto nivel.

## 3. Manejo de Respuestas y Errores
* **Envoltorio Estándar:** Todos los endpoints deben devolver la clase envolvente `StandardResponse[T]` para respuestas exitosas:
  ```json
  {
    "success": true,
    "data": { ... },
    "metadata": { ... }
  }
  ```
* **Manejo de Errores RFC 7807 (ProblemDetails):** Todos los errores de negocio y validación deben retornar el estándar `application/problem+json` con campos: `type`, `title`, `status`, `detail`, `instance`.

## 4. Tipado y Validación con Pydantic v2
* Esquemas separados por responsabilidad: `*Create`, `*Update`, `*Response`, `*InDB`.
* Usar `model_config = ConfigDict(from_attributes=True)`.
* Evitar diccionarios genéricos (`dict`) en favor de modelos fuertemente tipados.
