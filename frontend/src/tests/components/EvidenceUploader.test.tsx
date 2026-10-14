import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EvidenceUploader } from '../../components/evidence/EvidenceUploader';
import { evidenceService } from '../../services/EvidenceService';

// Mock del servicio EvidenceService
vi.mock('../../services/EvidenceService', () => ({
  evidenceService: {
    uploadAndRegisterEvidence: vi.fn(),
  },
}));

describe('EvidenceUploader Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza la zona de carga con opciones de galería y cámara', () => {
    render(<EvidenceUploader />);

    expect(screen.getByText(/Arrastra y suelta tu evidencia fotográfica aquí/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Seleccionar de Galería/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Capturar con Cámara/i })).toBeInTheDocument();
  });

  it('si el mock de uploadAndRegisterEvidence retorna isDuplicate: true, muestra exitosamente el mensaje visual de alerta en el DOM', async () => {
    const mockDuplicateHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const mockFile = new File(['fake-duplicate-image'], 'foto_duplicada.jpg', { type: 'image/jpeg' });

    vi.mocked(evidenceService.uploadAndRegisterEvidence).mockResolvedValueOnce({
      isDuplicate: true,
      hash: mockDuplicateHash,
      evidence: {
        id: 'dup-uuid-9999-1111',
        nombre_archivo: 'foto_duplicada.jpg',
        ruta_storage: 'originals/dup.jpg',
        ruta_thumb: 'thumbs/dup_thumb.webp',
        hash_sha256: mockDuplicateHash,
        tamano_bytes: 1024,
        mime_type: 'image/jpeg',
        fecha_captura: '2026-10-13T10:00:00.000Z',
        fecha_ingesta: '2026-10-13T10:05:00.000Z',
        estado: 'pendiente',
        metadatos_json: null,
        subido_por: null,
      },
    });

    const { container } = render(<EvidenceUploader />);

    // Buscar el input file oculto para galería (accept="image/*" sin capture)
    const fileInput = container.querySelector('input[type="file"]:not([capture])') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    // Simular evento change con el archivo
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    // Esperar a que se procese y aparezca la alerta en el DOM
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/Evidencia Duplicada Detectada \(Ahorro de Datos\)/i);
      expect(alert).toHaveTextContent(/foto_duplicada\.jpg/i);
      expect(alert).toHaveTextContent(/Se omitió la subida al Storage para evitar redundancia/i);
    });

    expect(evidenceService.uploadAndRegisterEvidence).toHaveBeenCalledWith(mockFile);
  });

  it('si el mock retorna una subida exitosa (no duplicada), invoca onUploadSuccess', async () => {
    const onUploadSuccess = vi.fn();
    const mockFreshHash = ' fresh-hash-1234567890';
    const mockFile = new File(['fresh-content'], 'foto_nueva.jpg', { type: 'image/jpeg' });

    const mockResult = {
      isDuplicate: false,
      hash: mockFreshHash,
      evidence: {
        id: 'new-uuid-0001',
        nombre_archivo: 'foto_nueva.jpg',
        ruta_storage: 'originals/foto_nueva.jpg',
        ruta_thumb: 'thumbs/foto_nueva_thumb.webp',
        hash_sha256: mockFreshHash,
        tamano_bytes: 2048,
        mime_type: 'image/jpeg',
        fecha_captura: '2026-10-13T12:00:00.000Z',
        fecha_ingesta: '2026-10-13T12:05:00.000Z',
        estado: 'pendiente' as const,
        metadatos_json: null,
        subido_por: null,
      },
    };

    vi.mocked(evidenceService.uploadAndRegisterEvidence).mockResolvedValueOnce(mockResult);

    const { container } = render(<EvidenceUploader onUploadSuccess={onUploadSuccess} />);

    const fileInput = container.querySelector('input[type="file"]:not([capture])') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(onUploadSuccess).toHaveBeenCalledWith(mockResult);
    });

    // No debe haber alerta de duplicado
    expect(screen.queryByText(/Evidencia Duplicada Detectada/i)).not.toBeInTheDocument();
  });
});
