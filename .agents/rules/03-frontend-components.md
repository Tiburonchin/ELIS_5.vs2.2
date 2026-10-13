---
description: "Patrones de UI Frontend: React, TypeScript, TailwindCSS y cliente HTTP centralizado"
globs: frontend/**/*
alwaysApply: false
---

# ELIS 5.0 — Patrones de UI (React + TypeScript + TailwindCSS)

## 1. Cliente HTTP Centralizado e Interceptores
* Todas las llamadas a la API de ELIS deben pasar por el cliente HTTP centralizado (`apiClient` con Axios o Fetch wrapper).
* Inyectar automáticamente el header de seguridad `X-ELIS-Key` en cada petición.
* Manejar de forma global las respuestas de error en formato `ProblemDetails` (RFC 7807) mostrando alertas claras al usuario.

## 2. Componentes Atómicos y Reutilizables
* Diseño modular con componentes funcionales y TypeScript estricto (`interface ComponentProps { ... }`).
* Composición con TailwindCSS respetando paletas de diseño modernas (dark mode, glassmorphism, micro-animaciones, estados hover/focus claros).
* Prohibido estilos inline o CSS ad-hoc no unificados.

## 3. Estado y Hooks Limpios
* Separar la lógica de negocio y consumo de APIs en Custom Hooks (`useEvidence`, `useAuditLog`, `useInspection`).
* Evitar useEffect innecesarios o dependencias circulares.
* Validar estados de carga (`isLoading`), error (`error`) y contenido vacío (`empty state`) en cada vista.
