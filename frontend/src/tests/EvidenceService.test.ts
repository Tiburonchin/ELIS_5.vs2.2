import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EvidenceService, type EvidenciaRow } from '../services/EvidenceService';
import { supabase } from '../lib/supabaseClient';
import * as fileProcessor from '../utils/fileProcessor';

// Mock del cliente supabase
vi.mock('../lib/supabaseClient', () => {
  const fromMock = vi.fn();
  const storageMock = {
    from: vi.fn(),
  };

  return {
    supabase: {
      from: fromMock,
      storage: storageMock,
    },
  };
});

describe('EvidenceService - uploadAndRegisterEvidence', () => {
  let evidenceService: EvidenceService;

  beforeEach(() => {
    vi.clearAllMocks();
    evidenceService = new EvidenceService();
  });

  it('si el hash ya existe, retorna isDuplicate: true y detiene inmediatamente la subida a Storage', async () => {
    const existingHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    // Mock del procesamiento de archivos
    const mockFile = new File(['fake-evidence-content'], 'test_duplicate.jpg', { type: 'image/jpeg' });
    const mockThumb = new File(['fake-thumb'], 'test_duplicate_thumb.webp', { type: 'image/webp' });

    vi.spyOn(fileProcessor, 'processFileForIngestion').mockResolvedValue({
      file: mockFile,
      hashSHA256: existingHash,
      safeExif: {
        dateTimeOriginal: '2026-10-13T10:00:00.000Z',
        width: 1920,
        height: 1080,
        orientation: 1,
      },
      thumbnailFile: mockThumb,
    });

    const mockExistingRow: EvidenciaRow = {
      id: 'existing-uuid-1234',
      nombre_archivo: 'test_duplicate.jpg',
      ruta_storage: `originals/${existingHash}.jpg`,
      ruta_thumb: `thumbs/${existingHash}_thumb.webp`,
      hash_sha256: existingHash,
      tamano_bytes: 1024,
      mime_type: 'image/jpeg',
      fecha_captura: '2026-10-13T10:00:00.000Z',
      fecha_ingesta: '2026-10-13T10:05:00.000Z',
      estado: 'pendiente',
      metadatos_json: null,
      subido_por: null,
    };

    // Configurar mock de Supabase .from('evidencias').select('*').eq('hash_sha256', hash).maybeSingle()
    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: mockExistingRow,
      error: null,
    });
    const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    vi.mocked(supabase.from).mockReturnValue({
      select: selectMock,
    } as any);

    const storageUploadMock = vi.fn();
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: storageUploadMock,
    } as any);

    // Ejecutar el flujo de uploadAndRegisterEvidence
    const result = await evidenceService.uploadAndRegisterEvidence(mockFile);

    // 1. Verificación de resultado
    expect(result.isDuplicate).toBe(true);
    expect(result.hash).toBe(existingHash);
    expect(result.evidence).toEqual(mockExistingRow);

    // 2. Verificación de consulta por hash
    expect(supabase.from).toHaveBeenCalledWith('evidencias');
    expect(selectMock).toHaveBeenCalledWith('*');
    expect(eqMock).toHaveBeenCalledWith('hash_sha256', existingHash);

    // 3. Verificación CRÍTICA: NO debe llamar a Storage bajo ninguna circunstancia cuando hay duplicado
    expect(supabase.storage.from).not.toHaveBeenCalled();
    expect(storageUploadMock).not.toHaveBeenCalled();
  });

  it('si el hash no existe, sube original y thumbnail a Storage y registra la evidencia en base de datos', async () => {
    const newHash = 'a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef';
    const mockFile = new File(['new-evidence-content'], 'fresh_evidence.jpg', { type: 'image/jpeg' });
    const mockThumb = new File(['thumb-bytes'], 'fresh_evidence_thumb.webp', { type: 'image/webp' });

    vi.spyOn(fileProcessor, 'processFileForIngestion').mockResolvedValue({
      file: mockFile,
      hashSHA256: newHash,
      safeExif: {
        dateTimeOriginal: '2026-10-13T15:30:00.000Z',
        width: 3840,
        height: 2160,
        orientation: 1,
      },
      thumbnailFile: mockThumb,
    });

    // 1. Mock de búsqueda de hash inexistente (retorna data: null)
    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

    // Mock de inserción en base de datos (create)
    const mockCreatedRow: EvidenciaRow = {
      id: 'new-uuid-5678',
      nombre_archivo: 'fresh_evidence.jpg',
      ruta_storage: `originals/${newHash}.jpg`,
      ruta_thumb: `thumbs/${newHash}_thumb.webp`,
      hash_sha256: newHash,
      tamano_bytes: mockFile.size,
      mime_type: 'image/jpeg',
      fecha_captura: '2026-10-13T15:30:00.000Z',
      fecha_ingesta: '2026-10-13T15:35:00.000Z',
      estado: 'pendiente',
      metadatos_json: { safe_exif: { width: 3840, height: 2160 } },
      subido_por: null,
    };

    const singleInsertMock = vi.fn().mockResolvedValue({
      data: mockCreatedRow,
      error: null,
    });
    const insertSelectMock = vi.fn().mockReturnValue({ single: singleInsertMock });
    const insertMock = vi.fn().mockReturnValue({ select: insertSelectMock });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'evidencias') {
        return {
          select: selectMock,
          insert: insertMock,
        } as any;
      }
      return {} as any;
    });

    // 2. Mock de subida a Storage
    const storageUploadMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: storageUploadMock,
    } as any);

    const result = await evidenceService.uploadAndRegisterEvidence(mockFile);

    expect(result.isDuplicate).toBe(false);
    expect(result.hash).toBe(newHash);
    expect(result.evidence).toEqual(mockCreatedRow);

    // Verificar subida a Storage de ambos archivos
    expect(supabase.storage.from).toHaveBeenCalledWith('evidencias');
    expect(storageUploadMock).toHaveBeenCalledTimes(2);
    expect(storageUploadMock).toHaveBeenNthCalledWith(
      1,
      `originals/${newHash}.jpg`,
      mockFile,
      { contentType: 'image/jpeg', upsert: false }
    );
    expect(storageUploadMock).toHaveBeenNthCalledWith(
      2,
      `thumbs/${newHash}_thumb.webp`,
      mockThumb,
      { contentType: 'image/webp', upsert: false }
    );
  });
});
