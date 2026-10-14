import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OcrResultEditor } from '../../components/ocr/OcrResultEditor';
import { ocrService } from '../../services/OcrService';
import type { OcrExtractedData } from '../../utils/ocrClient';

vi.mock('../../services/OcrService', () => ({
  ocrService: {
    saveHumanValidation: vi.fn(),
  },
}));

describe('OcrResultEditor Component', () => {
  const dummyInitialData: OcrExtractedData = {
    nombres: 'Jorge Luis',
    apellido_paterno: 'Medina',
    apellido_materno: 'Castro',
    cargo: 'Técnico Soldador',
    texto_crudo_ocr: 'FOTOCHECK MINA\nAPELLIDOS: MEDINA CASTRO\nNOMBRES: JORGE LUIS\nCARGO: TÉCNICO SOLDADOR',
    nivel_confianza: 89,
  };

  const mockOnSaved = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza los datos crudos del OCR, nivel de confianza y puebla los campos del formulario', () => {
    render(
      <OcrResultEditor
        evidenciaId="evi-test-99"
        initialData={dummyInitialData}
        croppedImagePreviewUrl="blob:http://localhost/dummy-crop"
        onSaved={mockOnSaved}
        onCancel={mockOnCancel}
      />
    );

    // Confianza y texto crudo
    expect(screen.getByText(/Confianza: 89%/i)).toBeInTheDocument();
    expect(screen.getByText(/FOTOCHECK MINA/i)).toBeInTheDocument();

    // Imagen de recorte
    const cropImg = screen.getByRole('img', { name: /Recorte del fotocheck/i });
    expect(cropImg).toBeInTheDocument();
    expect(cropImg).toHaveAttribute('src', 'blob:http://localhost/dummy-crop');

    // Campos poblados
    const paternoInput = screen.getByPlaceholderText('Paterno') as HTMLInputElement;
    const maternoInput = screen.getByPlaceholderText('Materno') as HTMLInputElement;
    const nombresInput = screen.getByPlaceholderText('Nombres completos') as HTMLInputElement;
    const cargoInput = screen.getByPlaceholderText(/Ej. Operador/i) as HTMLInputElement;

    expect(paternoInput.value).toBe('Medina');
    expect(maternoInput.value).toBe('Castro');
    expect(nombresInput.value).toBe('Jorge Luis');
    expect(cargoInput.value).toBe('Técnico Soldador');
  });

  it('permite corregir visualmente los campos y al hacer clic en "Confirmar y Guardar" llama a saveHumanValidation y onSaved', async () => {
    const mockSavedRecord = {
      evidencia_id: 'evi-test-99',
      nombres: 'Jorge Luis Actualizado',
      apellido_paterno: 'Medina',
      apellido_materno: 'Castro',
      cargo: 'Supervisor Soldadura',
      nivel_confianza: 89,
      texto_crudo_ocr: dummyInitialData.texto_crudo_ocr,
      confirmado_por: 'usr-admin-1',
      confirmador_email: 'admin@elis.app',
      confirmado_en: '2026-10-14T01:45:00.000Z',
    };

    (ocrService.saveHumanValidation as any).mockResolvedValueOnce(mockSavedRecord);

    render(
      <OcrResultEditor
        evidenciaId="evi-test-99"
        initialData={dummyInitialData}
        onSaved={mockOnSaved}
      />
    );

    const nombresInput = screen.getByPlaceholderText('Nombres completos');
    const cargoInput = screen.getByPlaceholderText(/Ej. Operador/i);

    // Modificar valores (Human-in-the-Loop)
    fireEvent.change(nombresInput, { target: { value: 'Jorge Luis Actualizado' } });
    fireEvent.change(cargoInput, { target: { value: 'Supervisor Soldadura' } });

    // Enviar formulario
    const submitBtn = screen.getByRole('button', { name: /Confirmar y Guardar/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(ocrService.saveHumanValidation).toHaveBeenCalledTimes(1);
    });

    expect(ocrService.saveHumanValidation).toHaveBeenCalledWith({
      evidencia_id: 'evi-test-99',
      nombres: 'Jorge Luis Actualizado',
      apellido_paterno: 'Medina',
      apellido_materno: 'Castro',
      cargo: 'Supervisor Soldadura',
      nivel_confianza: 89,
      texto_crudo_ocr: dummyInitialData.texto_crudo_ocr,
    });

    expect(mockOnSaved).toHaveBeenCalledWith(mockSavedRecord);
  });

  it('muestra un mensaje de error si el servicio falla al guardar', async () => {
    (ocrService.saveHumanValidation as any).mockRejectedValueOnce(
      new Error('Fallo de red en Supabase')
    );

    render(
      <OcrResultEditor
        evidenciaId="evi-test-99"
        initialData={dummyInitialData}
        onSaved={mockOnSaved}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Confirmar y Guardar/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Fallo de red en Supabase/i)).toBeInTheDocument();
    });

    expect(mockOnSaved).not.toHaveBeenCalled();
  });
});
