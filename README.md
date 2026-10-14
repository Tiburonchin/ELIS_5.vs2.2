# ELIS 5.0 — Entorno Local Inteligente y Seguro

**Plataforma Cloud-Native para Gestión de Evidencias Forenses, Auditoría de Campo, OCR en Navegador y Generación de Fichas Técnicas de Inspección**

---

## 1. Resumen Ejecutivo

**ELIS 5.0** (Entorno Local Inteligente y Seguro) es una solución integral desarrollada para optimizar y estandarizar las operaciones de supervisión técnica, aseguramiento de calidad e inspecciones HSE (*Health, Safety & Environment*). 

La plataforma reemplaza los flujos tradicionales basados en carpetas compartidas, transferencias manuales no verificadas y registros en procesadores de texto, proporcionando un canal digital inmutable con garantías criptográficas de autenticidad, sanitización de datos sensibles en el origen y procesamiento analítico directamente en el dispositivo del inspector.

---

## 2. Objetivos y Principios de Diseño

1. **Integridad Criptográfica en Origen (Client-Side Integrity):**  
   Antes de transmitir cualquier archivo a los servidores, el sistema calcula de forma determinista su huella digital mediante el algoritmo **SHA-256** utilizando la Web Crypto API (`crypto.subtle`). Esto permite la deduplicación instantánea en memoria y previene la alteración o reemplazo posterior de imágenes.

2. **Privacidad y Sanitización Forense de Metadatos:**  
   Durante la captura en campo, el motor de archivos analiza la cabecera EXIF para conservar exclusivamente la estampa temporal de origen (`DateTimeOriginal`). Todas las coordenadas de posicionamiento global (GPS) y metadatos no requeridos son purgados antes del almacenamiento.

3. **Optimización de Transferencia de Datos:**  
   El cliente genera una versión miniatura en formato **WebP** de alta compresión y bajo peso. El archivo original y la miniatura son transferidos a contenedores inmutables de almacenamiento, reduciendo el consumo de ancho de banda celular en zonas remotas.

4. **Procesamiento Óptico Desacoplado (OCR Human-in-the-Loop):**  
   La extracción de texto desde fotochecks y credenciales se realiza dentro del navegador del usuario aprovechando Web Workers y la biblioteca Tesseract.js. La interfaz implementa un enfoque de validación humana asistida donde los datos extraídos (nombres, apellidos, cargo) deben ser confirmados o corregidos por el inspector antes de su inserción en la base de datos.

5. **Transacciones Atómicas y Registro Universal de Auditoría:**  
   La asociación de evidencias a actividades operativas se ejecuta mediante funciones de procedimiento remoto (RPC en PostgreSQL), garantizando consistencia transaccional ACID. Cada evento del ciclo de vida se documenta de forma automática en una bitácora inmutable de auditoría.

6. **Interacción por Voz en Campo (Web Speech API):**  
   Incorpora dictado continuo por voz parametrizado para la variante lingüística `es-PE` (Español de Perú), permitiendo la captura de descripciones y hallazgos sin requerir el teclado en condiciones de campo complejas.

7. **Generación de Fichas de Inspección Técnicas (A4 Inmutable):**  
   El sistema renderiza un documento técnico estructurado en tamaño estándar A4 que consolida datos de la actividad, miniaturas fotográficas, resultados de verificación de personal y el código de integridad SHA-256 impreso, listo para impresión o exportación nativa a PDF.

---

## 3. Arquitectura del Sistema

La solución está construida siguiendo el principio de capas limpias (*Clean Architecture*):

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. CAPA DE PRESENTACIÓN (React 19 + TailwindCSS v4)                    │
│    • Vistas: Bandeja de Evidencias, Gestor de Actividades, Detalle     │
│    • Componentes: <EvidenceCard />, <CropCanvas />, <Modal />          │
│    • Plantillas Técnicas: <InspectionReportTemplate />, <PdfExporter />│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Custom Hooks & Callbacks
┌───────────────────────────────────▼────────────────────────────────────┐
│ 2. LÓGICA DE CLIENTE Y HILOS DE FONDO (Web Workers & Native APIs)      │
│    • fileProcessor.ts: Hash SHA-256, purga EXIF y compresión WebP      │
│    • ocrClient.ts: Filtros de imagen en Canvas y Tesseract Worker      │
│    • useSpeech.ts: Reconocimiento de voz en tiempo real                │
│    • useEvidences.ts: Sincronización y filtrado de estado              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Servicios Tipados POO
┌───────────────────────────────────▼────────────────────────────────────┐
│ 3. CAPA DE ACCESO A DATOS (TypeScript POO)                             │
│    • BaseSupabaseService<T>: Abstracción genérica CRUD y paginación    │
│    • EvidenceService: Control de ingesta forense y Storage             │
│    • ActivityService: Gestión de órdenes y ejecución de RPC atómico    │
│    • OcrService: Registro y trazabilidad de identificaciones humanas   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Protocolo HTTPS / WSS
┌───────────────────────────────────▼────────────────────────────────────┐
│ 4. PERSISTENCIA Y MOTOR DE REGLAS (Supabase Cloud-Native)              │
│    • PostgreSQL: Tablas evidencias, actividades, vinculos, etc.        │
│    • Row Level Security (RLS): Bloqueo estricto de borrado y alteración│
│    • Triggers de Auditoría: fn_registrar_auditoria_universal()        │
│    • Transacciones RPC: vincular_evidencia_atomica()                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Estructura del Proyecto

```text
ELIS_Vs1/
├── .agents/                    # Reglas de arquitectura, backend y componentes UI
├── supabase/                   # Definición de esquemas DDL, triggers y funciones RPC
│   └── migrations/
│       └── 20261013000000_elis_core_schema.sql
├── frontend/                   # Aplicación cliente React + Vite
│   ├── public/                 # Recursos públicos y configuración PWA
│   ├── src/
│   │   ├── components/
│   │   │   ├── evidence/       # Subida, tarjetas y cuadrícula de evidencias
│   │   │   ├── ocr/            # Canvas de recorte y confirmación humana
│   │   │   ├── reports/        # Plantilla A4 formal y exportador react-to-print
│   │   │   └── ui/             # Componentes base: StatusBadge, Modal
│   │   ├── hooks/              # useEvidences, useSpeech
│   │   ├── lib/                # Cliente Supabase singleton inicializado
│   │   ├── pages/              # ActivitiesManager, ActivityDetail
│   │   ├── services/           # BaseSupabaseService, EvidenceService, ActivityService, OcrService
│   │   ├── tests/              # Pruebas unitarias y de integración (Vitest)
│   │   ├── types/              # Tipado TypeScript derivado del esquema de base de datos
│   │   └── utils/              # Procesamiento de archivos, criptografía y OCR
│   ├── package.json            # Dependencias del proyecto
│   └── vite.config.ts          # Configuración del empaquetador Vite
├── ARQUITECTURA_Y_ESPECIFICACION_MODERNA.md  # Especificación técnica del sistema
├── PLAN_MAESTRO.md             # Matriz de estado de desarrollo por módulos
└── README.md                   # Documentación principal del repositorio
```

---

## 5. Módulos y Estado de Implementación

| Módulo | Denominación | Componentes y Alcance Técnico | Estado |
| :---: | :--- | :--- | :---: |
| **01** | Capa de Datos y Servicios Base | Definición de tipos TypeScript (`Database`), implementación de `BaseSupabaseService<T>`, `EvidenceService` y `ActivityService`. | Completado |
| **02** | Motor de Archivos Local | Deduplicación por hash SHA-256 (`crypto.subtle`), eliminación de etiquetas de geolocalización, generación de miniaturas WebP y carga en Storage. | Completado |
| **03** | UI Base y Bandeja de Ingesta | Componentes modulares `<StatusBadge />`, `<EvidenceCard />`, `<EvidenceUploader />`, vista en cuadrícula y filtros por estado de procesamiento. | Completado |
| **04** | Recorte y OCR en Navegador | Lienzo de recorte táctil `<CropCanvas />`, preprocesamiento Canvas (filtro B/N y contraste), Web Worker Tesseract.js y formulario de confirmación `<OcrResultEditor />`. | Completado |
| **05** | Actividades, Vínculos y Fichas PDF | Gestión CRUD en `ActivitiesManager`, dictado con `useSpeech`, vinculación atómica mediante RPC, ficha A4 `<InspectionReportTemplate />` y exportación con `react-to-print`. | Completado |

---

## 6. Pila Tecnológica

### Frontend y Entorno de Ejecución
- **Framework:** React 19 (React DOM 19)
- **Lenguaje:** TypeScript 5.9 / 6.0
- **Herramienta de Compilación:** Vite 8.3 con soporte de HMR
- **Estilos:** TailwindCSS v4

### Procesamiento Local y Análisis
- **Criptografía:** Web Crypto API (`crypto.subtle`)
- **Manipulación de Metadatos EXIF:** Exifr
- **Compresión de Imágenes:** Browser Image Compression
- **Reconocimiento Óptico de Caracteres (OCR):** Tesseract.js v7 en Web Worker
- **Reconocimiento de Voz:** Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
- **Exportación e Impresión:** react-to-print v3

### Backend y Persistencia
- **Plataforma:** Supabase Cloud-Native
- **Base de Datos:** PostgreSQL 15+ con extensiones relacionales
- **Seguridad:** Row Level Security (RLS) y funciones plpgsql `SECURITY DEFINER`
- **Almacenamiento:** Supabase Storage (Bucket `evidencias`)

### Pruebas Automatizadas y Calidad
- **Framework de Pruebas:** Vitest v4
- **Testing de Componentes:** React Testing Library, JSDOM, Jest DOM
- **Linter:** Oxlint

---

## 7. Instrucciones de Instalación y Ejecución

### Prerrequisitos
- Node.js versión 18.18 o superior
- Administrador de paquetes `npm`

### Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/Tiburonchin/ELIS_Vs1.git
cd ELIS_Vs1
```

### Paso 2: Configurar las Variables de Entorno
Cree un archivo `.env` en la raíz del subdirectorio `frontend/` tomando como referencia el archivo `.env.example`:

```env
VITE_SUPABASE_URL=https://<tu-identificador-de-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-clave-anonima-publica>
```

### Paso 3: Instalar Dependencias
```bash
cd frontend
npm install
```

### Paso 4: Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
La aplicación estará disponible localmente en `http://localhost:5173/`.

### Paso 5: Ejecutar la Suite de Pruebas
```bash
npm test
```
Ejecuta la totalidad de pruebas unitarias sobre servicios, lógica de cálculo, hooks y componentes de interfaz.

### Paso 6: Compilar para Producción
```bash
npm run build
```
Realiza la verificación estricta de tipos (`tsc -b`) y compila el paquete optimizado en la carpeta `frontend/dist/`.

---

## 8. Consideraciones Forenses y de Seguridad

- **Inmutabilidad de Evidencias:** Las reglas de base de datos prohíben operaciones directas de eliminación (`DELETE`) sobre la tabla de evidencias y sus correspondientes archivos en almacenamiento. Toda actualización se registra mediante el trigger universal en la tabla de auditoría.
- **Transaccionalidad en Vinculaciones:** La asociación entre evidencia y actividad es gestionada por la función `vincular_evidencia_atomica`, garantizando que la actualización del estado y la creación de la relación se consoliden de forma atómica.
- **Validación Humana Obligatoria:** Las lecturas automáticas de texto de fotochecks no son consideradas definitivas hasta que un usuario autenticado verifique y confirme manualmente los campos correspondientes.
- **Trazabilidad:** Cada ficha impresa incluye la hora de generación, datos del emisor y el Hash SHA-256 de cada fotografía para permitir su verificación forense contra peritajes posteriores.

---

## 9. Licencia

Este proyecto se distribuye bajo los términos y condiciones de uso establecidos para el entorno institucional y operativo de la organización.
