# Estado de Desarrollo - ELIS 5.0

## Regla para el Agente
Solo debes trabajar en el módulo que tenga el estado `[EN PROGRESO]`. Está ESTRICTAMENTE PROHIBIDO escribir código de módulos marcados como `[PENDIENTE]`. Al terminar un módulo, actualiza su estado a `[COMPLETADO]`.

- [COMPLETADO] **Módulo 1: Capa de Datos y Servicios Base** (Cliente Supabase, Tipos TS, `BaseSupabaseService`, `EvidenceService`, `ActivityService`).
- [COMPLETADO] **Módulo 2: Motor de Archivos Local** (`fileProcessor.ts`: Hash SHA-256, extracción EXIF sin GPS, compresión WebP y subida al Bucket).
- [COMPLETADO] **Módulo 3: UI Base y Bandeja de Ingesta** (Componentes reutilizables `<StatusBadge/>`, `<EvidenceCard/>`, pantalla de subida y listado).
- [COMPLETADO] **Módulo 4: Recorte y OCR en Navegador** (`<CropCanvas/>`, Web Worker con `tesseract.js` y formulario de confirmación humana).
- [COMPLETADO] **Módulo 5: Actividades, Vínculos y Reporte PDF** (CRUD de actividades, llamado al RPC atómico y plantilla de impresión `<InspectionReportTemplate/>`).
- [COMPLETADO] **Módulo 6: Refactorización Estética con shadcn/ui** (Configuración de alias `@/*`, `components.json`, bloque dashboard con Sidebar y Header, creación de `DashboardLayout`, migración visual de `InboxEvidences` y `ActivitiesManager` con Card, Table, Button, Input y Badge corporativos).
