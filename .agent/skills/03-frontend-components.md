---
description: "Patrones de UI Frontend: React, TypeScript, TailwindCSS, PWA y cliente Supabase"
globs: src/components/**/*,src/pages/**/*
alwaysApply: false
---

# ELIS 5.0 — Patrones de UI (React + TypeScript + TailwindCSS + PWA)

## 1. Componentes Atómicos y Reutilizables
* Diseño modular con componentes funcionales y TypeScript estricto (`interface ComponentProps { ... }`).
* Estilizado exclusivo con TailwindCSS respetando paletas de diseño modernas (dark mode, glassmorphism, micro-animaciones, estados hover/focus táctiles para móviles).
* Componentes base obligatorios:
  * `<StatusBadge status="..." />`: Insignia de estado unificada.
  * `<AuditTimeline entityId="..." />`: Historial cronológico de cambios leyendo de `public.auditoria`.
  * `<EvidenceCard evidence={...} />`: Tarjeta de visualización de foto con miniatura WebP y metadatos.
  * `<InspectionReportTemplate />`: Ficha técnica de inspección para vista e impresión con `react-to-print`.

## 2. Lógica Desacoplada en Hooks y Web Workers
* Toda interacción con Supabase se encapsula en Custom Hooks (`useEvidences`, `useActivities`, `useAuth`).
* El preprocesamiento de imágenes y OCR se ejecuta fuera del hilo principal usando Web Workers (`tesseract.js`) para evitar congelamientos de la interfaz en pantallas de celulares.
* Sanitización EXIF y cálculo SHA-256 en cliente mediante `fileProcessor.ts` con la Web Crypto API (`crypto.subtle`).

## 3. Experiencia PWA Mobile-First
* Diseñar pensando primero en la pantalla táctil de un teléfono Android en campo (botones accesibles con pulgar, áreas táctiles amplias $\ge 44\text{px}$, soporte para gestos en `<CropCanvas />` con `react-easy-crop`).
* Manejo explícito de estados de carga (`isLoading`), error (`error`) y vacíos (`empty state`) en cada vista.
