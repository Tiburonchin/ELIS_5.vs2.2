import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseFotocheckText, runOcrOnCrop } from '../../utils/ocrClient';

// Mock estricto de tesseract.js para evitar instanciar Web Workers reales
const mockRecognize = vi.fn();
const mockTerminate = vi.fn();

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn().mockImplementation(async (_lang?: string, _oem?: number, options?: any) => {
    // Si se pasa logger, podemos simular progreso
    if (options?.logger) {
      options.logger({ status: 'recognizing text', progress: 0.5 });
      options.logger({ status: 'done', progress: 1 });
    }
    return {
      recognize: mockRecognize,
      terminate: mockTerminate,
    };
  }),
}));

describe('ocrClient - parseFotocheckText', () => {
  it('extrae correctamente nombres, apellidos y cargo cuando existen etiquetas explícitas', () => {
    const rawText = `
      MINERA LAS BAMBAS S.A.
      APELLIDOS: PÉREZ ROJAS
      NOMBRES: JUAN CARLOS
      CARGO: OPERADOR DE VOLQUETE
      DNI: 45892134
    `;

    const result = parseFotocheckText(rawText);

    expect(result.apellido_paterno).toBe('PÉREZ');
    expect(result.apellido_materno).toBe('ROJAS');
    expect(result.nombres).toBe('JUAN CARLOS');
    expect(result.cargo).toBe('OPERADOR DE VOLQUETE');
  });

  it('extrae apellidos compuestos y cargo con etiquetas variantes (APELL:, NOM:, PUESTO:)', () => {
    const rawText = `
      CONSORCIO VIAL DEL SUR
      Apell. DE LA CRUZ FLORES
      Nom: MARÍA ELENA
      Puesto: INGENIERO RESIDENTE
      Vigencia: 2026-12-31
    `;

    const result = parseFotocheckText(rawText);

    expect(result.apellido_paterno).toBe('DE');
    expect(result.apellido_materno).toBe('LA CRUZ FLORES');
    expect(result.nombres).toBe('MARÍA ELENA');
    expect(result.cargo).toBe('INGENIERO RESIDENTE');
  });

  it('infiere apellidos, nombres y cargo a partir de líneas sin etiquetas típicas de fotocheck', () => {
    const rawText = `
      EMPRESA MINERA CHINALCO
      QUISPE MAMANI
      EDGAR ROLANDO
      SUPERVISOR DE SEGURIDAD
      ZONA DE OPERACIONES
    `;

    const result = parseFotocheckText(rawText);

    expect(result.apellido_paterno).toBe('QUISPE');
    expect(result.apellido_materno).toBe('MAMANI');
    expect(result.nombres).toBe('EDGAR ROLANDO');
    expect(result.cargo).toBe('SUPERVISOR DE SEGURIDAD');
  });

  it('maneja textos vacíos o ruidosos sin arrojar excepciones', () => {
    const rawText = `
      ...
      ---
      #
    `;

    const result = parseFotocheckText(rawText);

    expect(result.nombres).toBe('');
    expect(result.apellido_paterno).toBe('');
    expect(result.apellido_materno).toBe('');
    expect(result.cargo).toBe('');
  });
});

describe('ocrClient - runOcrOnCrop con mock de tesseract.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ejecuta reconocimiento OCR simulado, invoca callbacks de progreso y formatea los datos extraídos', async () => {
    mockRecognize.mockResolvedValueOnce({
      data: {
        text: 'APELLIDOS: GÓMEZ SILVA\nNOMBRES: ROBERTO\nCARGO: TÉCNICO ELECTRICISTA',
        confidence: 94.2,
      },
    });

    const progressReports: { progress: number; status: string }[] = [];
    const dummyBlob = new Blob(['fake image data'], { type: 'image/jpeg' });

    const result = await runOcrOnCrop(dummyBlob, (progress, status) => {
      progressReports.push({ progress, status });
    });

    expect(mockRecognize).toHaveBeenCalledWith(dummyBlob);
    expect(mockTerminate).toHaveBeenCalledTimes(1);

    expect(result.apellido_paterno).toBe('GÓMEZ');
    expect(result.apellido_materno).toBe('SILVA');
    expect(result.nombres).toBe('ROBERTO');
    expect(result.cargo).toBe('TÉCNICO ELECTRICISTA');
    expect(result.nivel_confianza).toBe(94);
    expect(result.texto_crudo_ocr).toContain('APELLIDOS: GÓMEZ SILVA');

    // Progreso reportado por el logger simulado
    expect(progressReports.length).toBeGreaterThan(0);
  });
});
