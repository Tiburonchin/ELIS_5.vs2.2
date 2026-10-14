import { createWorker } from 'tesseract.js';

export interface OcrExtractedData {
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  cargo: string;
  texto_crudo_ocr: string;
  nivel_confianza: number;
}

/**
 * Procesa texto plano con expresiones regulares para sugerir campos de fotochecks peruanos / mineros / industriales.
 */
export function parseFotocheckText(rawText: string): {
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  cargo: string;
} {
  const cleanLines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 1 && /[A-ZÁÉÍÓÚÑa-záéíóúñ]{2,}/.test(line));

  let apellido_paterno = '';
  let apellido_materno = '';
  let nombres = '';
  let cargo = '';

  // 1. Patrones explícitos con etiquetas: APELLIDOS:, NOMBRES:, CARGO:, DNI:, etc.
  for (const line of cleanLines) {
    const apeMatch = line.match(/(?:apellidos?|apell)\s*[:.-]?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/i);
    if (apeMatch && !apellido_paterno) {
      const parts = apeMatch[1].trim().split(/\s+/);
      if (parts.length >= 2) {
        apellido_paterno = parts[0];
        apellido_materno = parts.slice(1).join(' ');
      } else if (parts.length === 1) {
        apellido_paterno = parts[0];
      }
    }

    const nomMatch = line.match(/(?:nombres?|nom)\s*[:.-]?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/i);
    if (nomMatch && !nombres) {
      nombres = nomMatch[1].trim();
    }

    const cargoMatch = line.match(/(?:cargo|puesto|ocupaci[oó]n|funci[oó]n)\s*[:.-]?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/i);
    if (cargoMatch && !cargo) {
      cargo = cargoMatch[1].trim();
    }
  }

  // 2. Si no se hallaron etiquetas, analizar líneas en mayúsculas típicas de credenciales
  const filteredLines = cleanLines.filter(
    (l) => !/^(dni|ce|ruc|empresa|vigencia|caduca|obra|zona|pase|seguridad|elis)/i.test(l)
  );

  if ((!apellido_paterno || !nombres) && filteredLines.length >= 2) {
    // Si la primera línea tiene 2 palabras, suelen ser apellidos (Paterno Materno)
    const line0Words = filteredLines[0].split(/\s+/);
    if (line0Words.length >= 2 && !apellido_paterno) {
      apellido_paterno = line0Words[0];
      apellido_materno = line0Words.slice(1).join(' ');
    } else if (line0Words.length === 1 && !apellido_paterno) {
      apellido_paterno = line0Words[0];
      if (filteredLines.length > 2 && !apellido_materno) {
        apellido_materno = filteredLines[1];
      }
    }

    if (!nombres) {
      const nomLine = filteredLines.length > 2 && line0Words.length === 1 ? filteredLines[2] : filteredLines[1];
      if (nomLine) nombres = nomLine;
    }

    if (!cargo && filteredLines.length >= 3) {
      // Líneas subsiguientes como OPERADOR, SUPERVISOR, TECNICO, INGENIERO, CHOFER
      const possibleCargo = filteredLines.slice(2).find((l) =>
        /(?:operador|supervisor|t[eé]cnico|ingeniero|conductor|chofer|inspector|gerente|jefe|asistente|obrero|mecanico|electricista)/i.test(l)
      );
      if (possibleCargo) {
        cargo = possibleCargo;
      }
    }
  }

  return {
    nombres: nombres || '',
    apellido_paterno: apellido_paterno || '',
    apellido_materno: apellido_materno || '',
    cargo: cargo || '',
  };
}

/**
 * Ejecuta OCR sobre una imagen (recorte en base64, Blob o HTMLCanvasElement) usando tesseract.js con el idioma 'spa'.
 */
export async function runOcrOnCrop(
  imageSource: string | Blob | HTMLCanvasElement,
  onProgress?: (progress: number, status: string) => void
): Promise<OcrExtractedData> {
  const worker = await createWorker('spa', 1, {
    logger: (m) => {
      if (onProgress && m.progress !== undefined) {
        onProgress(m.progress, m.status);
      }
    },
  });

  try {
    const ret = await worker.recognize(imageSource);
    const rawText = ret.data.text || '';
    const confidence = ret.data.confidence ?? 0;

    const parsed = parseFotocheckText(rawText);

    return {
      ...parsed,
      texto_crudo_ocr: rawText,
      nivel_confianza: Math.round(confidence),
    };
  } finally {
    await worker.terminate();
  }
}
