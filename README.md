# ELIS 5.0 — Entorno Local Inteligente y Seguro

**Plataforma Cloud-Native para Gestión de Evidencias Forenses, Auditoría de Campo, OCR en Navegador y Generación de Fichas Técnicas de Inspección HSE**

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/UI-shadcn%2Fui-000000?logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase%20Cloud-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)

---

## 🚀 Inicio Rápido en 1 Clic (Para Usuarios Finales)

No necesitas conocimientos de programación para usar ELIS 5.0. El proyecto ya cuenta con las credenciales públicas de Supabase preconfiguradas:

1. **Único Requisito:** Tener instalado **[Node.js](https://nodejs.org/)** (descarga la versión *LTS* e instálala con las opciones por defecto).
2. **Descarga el proyecto:** Clona el repositorio con Git o descárgalo como archivo ZIP desde GitHub y descomprímelo.
3. **Ejecuta el sistema:** En la carpeta del proyecto, haz doble clic sobre el archivo:
   ```text
   setup.bat
   ```
4. **¡Listo!** El script instalará los componentes necesarios, iniciará el sistema y **abrirá automáticamente tu navegador web** en `http://localhost:5173`. También podrás abrir la URL en el navegador de tu celular conectado a la misma red WiFi.

---

## 1. Resumen del Sistema HSE

**ELIS 5.0** (*Entorno Local Inteligente y Seguro*) es una solución empresarial de alta confiabilidad diseñada para optimizar las operaciones de supervisión técnica, aseguramiento de la calidad e inspecciones **HSE** (*Health, Safety & Environment / SST*).

Elimina la dispersión de registros fotográficos en chats no auditados y carpetas compartidas desorganizadas mediante:
* **Integridad Criptográfica en Cliente:** Cálculo determinista de huella digital **SHA-256** vía Web Crypto API (`crypto.subtle`) en memoria antes de la transmisión.
* **Sanitización Forense de Metadatos:** Preservación de la estampa de captura `DateTimeOriginal` y purga estricta de coordenadas GPS de geolocalización sensible previo a la persistencia.
* **Compresión WebP Local:** Optimización de transferencias y reducción de consumo de ancho de banda móvil.
* **Motor OCR en Navegador:** Preprocesamiento en lienzo (`<CropCanvas />`) y extracción de texto de fotochecks/credenciales con `tesseract.js` en Web Workers fuera del hilo principal.
* **Gobernanza Human-in-the-Loop:** Confirmación y revisión humana mandataria para vinculaciones operativas.
* **Reportes Inmutables:** Generación instantánea de Fichas Técnicas de Inspección listas para firma y exportación PDF vía `react-to-print`.

---

## 2. Pila Tecnológica

| Componente | Tecnología | Propósito |
|---|---|---|
| **Núcleo UI** | React 19 + TypeScript | SPA / PWA reactiva con tipado estricto |
| **Empaquetador & Dev Server** | Vite 8 + Rolldown | HMR ultrarrápido y compilación optimizada |
| **Estilos & Diseño** | Tailwind CSS v4 | Estilizado moderno, rendimiento nativo y variables CSS |
| **Componentes Atómicos** | shadcn/ui | Sistema de diseño empresarial accesible (Card, Table, Button, Sidebar, Dialog) |
| **Base de Datos & Auth** | Supabase (PostgreSQL 15+) | Almacenamiento relacional con Row-Level Security (RLS) y Triggers de auditoría |
| **Almacenamiento Objeto** | Supabase Storage (S3-compatible) | Bucket inmutable con políticas estrictas de sólo lectura y escritura |
| **Motor OCR** | Tesseract.js (v7) | Reconocimiento óptico de caracteres local en Web Worker |
| **Procesamiento de Imágenes** | Browser Image Compression + exifr | Conversión a formato WebP y sanitización de cabeceras EXIF |

---

## 3. Instalación para Desarrolladores (Multiplataforma)

Si utilizas Linux, macOS o prefieres la terminal:

1. **Posiciónate en la carpeta frontend:**
   ```bash
   cd frontend
   ```
2. **Ejecuta el script automatizado:**
   ```bash
   npm run setup
   ```
   *(Este comando descarga dependencias y levanta el servidor de desarrollo expuesto en red local con `--host`).*

---

## 4. Scripts de Desarrollo Disponibles

Desde el directorio `frontend/`:

* `npm run dev`: Inicia el servidor de desarrollo local.
* `npm run dev -- --host`: Expone el servidor en la red WiFi local para probar la interfaz en teléfonos móviles.
* `npm run setup`: Descarga dependencias y arranca el servidor con host abierto.
* `npm test`: Ejecuta los 35 tests unitarios automatizados con Vitest.
* `npm run build`: Valida tipado TypeScript (`tsc -b`) y empaqueta la versión optimizada de producción.
* `npm run lint`: Ejecuta el análisis estático de código con Oxlint.

---

## 5. Seguridad y Cumplimiento

* **Seguridad en Supabase:** El proyecto utiliza llaves de acceso público (`anon key`) protegidas por políticas **RLS (Row Level Security)** en PostgreSQL. Nadie puede alterar las evidencias subidas ni vulnerar la base de datos sin los permisos correspondientes.
* **Zero-Tracking:** Los archivos nunca se almacenan en servidores intermedios de terceros; viajan directamente desde el cliente seguro autenticado al Bucket S3 de Supabase.
* **Inmutabilidad:** Cada registro fotográfico queda sellado con su digest SHA-256 y vinculado a la bitácora transaccional en `public.auditoria`.
