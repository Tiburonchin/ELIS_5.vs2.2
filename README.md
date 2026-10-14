# ELIS 5.0 — Entorno Local Inteligente y Seguro

**Sistema de Inspección Inmutable, Ingesta Forense, OCR en Navegador y Generación de Fichas Técnicas Oficiales.**

---

## 🌟 Visión General

**ELIS 5.0** es una Progressive Web App (PWA) de nivel empresarial diseñada para operaciones de campo, supervisión de seguridad (HSE) e inspección técnica. Reemplaza el flujo manual y fragmentado de captura en campo, carpetas compartidas y edición en OneNote por un pipeline unificado, seguro y verificable criptográficamente.

### Principios Fundamentales
1. **Integridad Criptográfica en Cliente:** Cálculo instantáneo del hash **SHA-256** mediante la Web Crypto API (`crypto.subtle`) antes de consumir datos móviles o almacenamiento.
2. **Privacidad y Sanitización Forense:** Eliminación automática de coordenadas GPS y metadatos sensibles mediante `exifr` conservando únicamente la marca de tiempo de captura (`DateTimeOriginal`).
3. **Compresión Inteligente:** Generación local de miniaturas livianas en formato **WebP** antes de la subida a buckets inmutables de Supabase Storage.
4. **OCR Desacoplado (Human-in-the-Loop):** Reconocimiento óptico de caracteres para fotochecks ejecutado en segundo plano con **Web Workers** (`tesseract.js`), preprocesamiento de contraste/escala de grises en Canvas y confirmación humana asistida por expresiones regulares.
5. **Transacciones Atómicas (ACID):** Vinculación de evidencias a actividades operativas mediante funciones PostgreSQL RPC (`vincular_evidencia_atomica`) con triggers automáticos de auditoría.
6. **Dictado por Voz en Campo:** Hook `useSpeech` integrado con la **Web Speech API** configurado en español peruano (`es-PE`) para dictado de observaciones con manos libres.
7. **Fichas Técnicas A4 Inmutables:** Exportación nativa e impresión a PDF mediante `react-to-print` (`<InspectionReportTemplate />`) con membrete oficial, miniaturas, personal detectado y hashes SHA-256 impresos.

---

## 🏗️ Arquitectura del Sistema

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. CAPA DE PRESENTACIÓN Y COMPONENTES (React 19 + TailwindCSS v4)      │
│  - Páginas: Bandeja de Evidencias, Gestor de Actividades, Detalle      │
│  - Modales & Canvas: <CropCanvas />, <OcrResultEditor />, <Modal />    │
│  - Plantillas de Reporte: <InspectionReportTemplate />, <PdfExporter /> │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Hooks Reactivos
┌───────────────────────────────────▼────────────────────────────────────┐
│ 2. LÓGICA DE NEGOCIO Y WEB WORKERS (Navegador / Off-Main-Thread)        │
│  - fileProcessor.ts: Hash SHA-256, sanitización EXIF, compresión WebP │
│  - ocrClient.ts: Canvas B/N + Alto contraste, Tesseract.js Worker      │
│  - useSpeech.ts: Web Speech API (es-PE) para dictado en campo         │
│  - useEvidences.ts: Sincronización y filtros reactivos                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Servicios POO Tipados
┌───────────────────────────────────▼────────────────────────────────────┐
│ 3. CAPA DE ACCESO A DATOS (TypeScript + BaseSupabaseService<T>)         │
│  - BaseSupabaseService: CRUD genérico reutilizable y paginación        │
│  - EvidenceService: Ingesta forense, validación SHA y Storage          │
│  - ActivityService: Gestión de actividades y RPC vincular_evidencia    │
│  - OcrService: Persistencia y auditoría de validaciones humanas        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS (Supabase Client)
┌───────────────────────────────────▼────────────────────────────────────┐
│ 4. PERSISTENCIA Y REGLAS CLOUD-NATIVE (Supabase PostgreSQL + Storage)  │
│  - Tablas: evidencias, actividades, vinculos, identificaciones        │
│  - Triggers: public.fn_registrar_auditoria_universal() en public.auditoria│
│  - RPC: public.vincular_evidencia_atomica() (Transacción ACID)         │
│  - RLS: Políticas inmutables contra eliminación o alteración forense   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Módulos Implementados

| Módulo | Nombre | Descripción | Estado |
| :---: | :--- | :--- | :---: |
| **Módulo 1** | Capa de Datos y Servicios Base | Cliente Supabase, tipos TypeScript estrictos, `BaseSupabaseService`, `EvidenceService`, `ActivityService`. | `COMPLETADO` |
| **Módulo 2** | Motor de Archivos Local | `fileProcessor.ts`: Deduplicación SHA-256, limpieza EXIF sin GPS, compresión WebP y subida al Bucket. | `COMPLETADO` |
| **Módulo 3** | UI Base y Bandeja de Ingesta | Componentes atómicos `<StatusBadge />`, `<EvidenceCard />`, `<EvidenceUploader />`, filtros y estados de carga. | `COMPLETADO` |
| **Módulo 4** | Recorte y OCR en Navegador | `<CropCanvas />` con `react-easy-crop`, worker con `tesseract.js`, regex de nombres/cargos y `<OcrResultEditor />`. | `COMPLETADO` |
| **Módulo 5** | Actividades, Vínculos y PDF | CRUD en `ActivitiesManager`, dictado `useSpeech`, vinculación atómica en `ActivityDetail`, ficha A4 `<InspectionReportTemplate />` y exportador `<PdfExporter />`. | `COMPLETADO` |

---

## 🛠️ Tecnologías y Librerías

- **Frontend Core:** [React 19](https://react.dev/), [TypeScript 5/6](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Estilos:** [TailwindCSS v4](https://tailwindcss.com/)
- **Criptografía & Imágenes:** Web Crypto API (`crypto.subtle`), [exifr](https://github.com/MikeKovarik/exifr), [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression)
- **OCR en Navegador:** [Tesseract.js](https://tesseract.projectnaptha.com/) v7, HTML5 Canvas API, [react-easy-crop](https://github.com/ValentinH/react-easy-crop)
- **Voz:** Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
- **Reportes & Exportación:** [react-to-print](https://github.com/MatthewHerbst/react-to-print)
- **Backend as a Service:** [Supabase](https://supabase.com/) (PostgreSQL 15+, Storage, Auth, RPC)
- **Testing:** [Vitest](https://vitest.dev/), [@testing-library/react](https://testing-library.com/)

---

## 🚀 Puesta en Marcha Local

### Prerrequisitos
- Node.js 18+ o superior
- Gestor de paquetes `npm`

### 1. Clonar el repositorio
```bash
git clone https://github.com/Tiburonchin/ELIS_Vs1.git
cd ELIS_Vs1
```

### 2. Configuración de Variables de Entorno
Crea un archivo `.env` en la raíz o en `frontend/.env` basado en `.env.example`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
```

### 3. Instalación de dependencias
```bash
cd frontend
npm install
```

### 4. Ejecución del Servidor de Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173/`.

### 5. Ejecución de Pruebas Unitarias
```bash
npm test
```

### 6. Compilación de Producción (Typecheck + Bundle)
```bash
npm run build
```

---

## 🔒 Estándares de Seguridad y Calidad

- **TypeScript Estricto:** Toda la base de código compila con `tsc -b` sin errores (`strict: true`).
- **Human-in-the-Loop:** Ningún texto extraído por OCR se persiste sin previa confirmación y firma de auditoría por el usuario.
- **Inmutabilidad:** Las evidencias subidas no se modifican ni se eliminan; el historial de estados y asociaciones queda auditado en PostgreSQL mediante disparadores universales.
- **Auditoría Forense:** Cada reporte generado cuenta con el Hash SHA-256 visible para cotejo contra peritaje digital.
