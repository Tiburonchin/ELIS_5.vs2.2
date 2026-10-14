import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OcrService } from '../../services/OcrService';
import { supabase } from '../../lib/supabaseClient';

vi.mock('../../lib/supabaseClient', () => {
  return {
    supabase: {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    },
  };
});

describe('OcrService - saveHumanValidation', () => {
  let ocrService: OcrService;

  beforeEach(() => {
    vi.clearAllMocks();
    ocrService = new OcrService();
  });

  it('inyecta el UUID y email del usuario logueado vía supabase.auth.getUser() al crear una validación nueva', async () => {
    const mockUser = {
      id: 'usr-supervisor-uuid-9876',
      email: 'supervisor@elis-mina.com',
    };

    // Mock sesión activa
    ((supabase.auth as any).getUser).mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    // Mock getById (verificación de registro existente) -> null (es nuevo)
    vi.spyOn(ocrService, 'getById').mockResolvedValueOnce(null);

    // Mock create (inserción)
    const mockCreatedRecord = {
      evidencia_id: 'ev-1111-2222',
      nombres: 'Carlos Alberto',
      apellido_paterno: 'Quispe',
      apellido_materno: 'Mamani',
      cargo: 'Operador Mina',
      nivel_confianza: 92,
      texto_crudo_ocr: 'TEXTO OCR RAW',
      confirmado_por: 'usr-supervisor-uuid-9876',
      confirmador_email: 'supervisor@elis-mina.com',
      confirmado_en: '2026-10-14T01:40:00.000Z',
    };

    const createSpy = vi.spyOn(ocrService, 'create').mockResolvedValueOnce(mockCreatedRecord);

    const result = await ocrService.saveHumanValidation({
      evidencia_id: 'ev-1111-2222',
      nombres: '  Carlos Alberto ',
      apellido_paterno: ' Quispe ',
      apellido_materno: ' Mamani ',
      cargo: ' Operador Mina ',
      nivel_confianza: 92,
      texto_crudo_ocr: 'TEXTO OCR RAW',
    });

    expect((supabase.auth as any).getUser).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        evidencia_id: 'ev-1111-2222',
        nombres: 'Carlos Alberto',
        apellido_paterno: 'Quispe',
        apellido_materno: 'Mamani',
        cargo: 'Operador Mina',
        confirmado_por: 'usr-supervisor-uuid-9876',
        confirmador_email: 'supervisor@elis-mina.com',
      })
    );
    expect(result).toEqual(mockCreatedRecord);
  });

  it('actualiza el registro existente en identificaciones manteniendo el UUID del confirmador', async () => {
    const mockUser = {
      id: 'usr-supervisor-uuid-9876',
      email: 'supervisor@elis-mina.com',
    };

    ((supabase.auth as any).getUser).mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    // Mock getById -> ya existe registro
    const existingRecord = {
      evidencia_id: 'ev-1111-2222',
      nombres: 'Carlos',
      apellido_paterno: 'Quispe',
      apellido_materno: 'Mamani',
      cargo: 'Operador',
      nivel_confianza: 75,
      texto_crudo_ocr: 'OLD TEXT',
      confirmado_por: 'old-usr',
      confirmador_email: 'old@elis.app',
      confirmado_en: '2026-10-10T00:00:00.000Z',
    };
    vi.spyOn(ocrService, 'getById').mockResolvedValueOnce(existingRecord);

    const mockUpdatedRecord = {
      ...existingRecord,
      nombres: 'Carlos Actualizado',
      confirmado_por: mockUser.id,
      confirmador_email: mockUser.email,
    };

    const mockSingle = vi.fn().mockResolvedValueOnce({ data: mockUpdatedRecord, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

    (supabase.from as any).mockReturnValue({
      update: mockUpdate,
    });

    const result = await ocrService.saveHumanValidation({
      evidencia_id: 'ev-1111-2222',
      nombres: 'Carlos Actualizado',
      apellido_paterno: 'Quispe',
      apellido_materno: 'Mamani',
      cargo: 'Operador Senior',
    });

    expect(supabase.from).toHaveBeenCalledWith('identificaciones');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        evidencia_id: 'ev-1111-2222',
        nombres: 'Carlos Actualizado',
        confirmado_por: 'usr-supervisor-uuid-9876',
        confirmador_email: 'supervisor@elis-mina.com',
      })
    );
    expect(mockEq).toHaveBeenCalledWith('evidencia_id', 'ev-1111-2222');
    expect(result).toEqual(mockUpdatedRecord);
  });
});
