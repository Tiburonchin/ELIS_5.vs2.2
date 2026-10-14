---
trigger: always_on
description: "Patrones de UI Frontend: React, TypeScript, TailwindCSS, PWA y cliente Supabase"
globs: src/components/**/*,src/pages/**/*
---

# ELIS 5.0 — Patrones de UI (React + TypeScript + TailwindCSS + PWA + shadcn/ui)

## 1. Ecosistema shadcn/ui y Componentes Atómicos
- **Uso estricto de shadcn/ui:** Todo elemento de interfaz base (botones, inputs, tarjetas, diálogos, tablas, menús) debe utilizar los componentes instalados de shadcn/ui importados desde `@/components/ui/`.
- **Instalación dinámica:** Si necesitas un componente primitivo que aún no está en el proyecto, tienes permiso para usar la terminal e instalarlo con `npx shadcn@latest add <nombre-componente>`.
- **Componentes de Negocio (Reutilizables):**
  * `<StatusBadge status="..." />`: Insignia de estado unificada usando el componente `Badge` de shadcn.
  * `<AuditTimeline entityId="..." />`: Historial cronológico leyendo de `public.auditoria`.
  * `<EvidenceCard evidence={...} />`: Tarjeta construida sobre el componente `Card` de shadcn.
  * `<InspectionReportTemplate />`: Ficha técnica de inspección para vista e impresión con `react-to-print`.

## 2. Lógica Desacoplada en Hooks y Web Workers
- Toda interacción con Supabase se encapsula en Custom Hooks (`useEvidences`, `useActivities`, `useAuth`).
- El preprocesamiento de imágenes y OCR se ejecuta fuera del hilo principal usando Web Workers (`tesseract.js`) para evitar congelamientos de la interfaz.
- Sanitización EXIF y cálculo SHA-256 en cliente mediante `fileProcessor.ts` con la Web Crypto API (`crypto.subtle`).

## 3. Experiencia PWA Mobile-First
- Diseñar pensando primero en la pantalla táctil de un teléfono Android en campo: áreas táctiles amplias (mínimo 44px), tipografía legible y soporte para gestos en `<CropCanvas />` con `react-easy-crop`.
- Manejo explícito de estados de carga (usando `<Skeleton />` de shadcn), error y vacíos (`empty state`) en cada vista.