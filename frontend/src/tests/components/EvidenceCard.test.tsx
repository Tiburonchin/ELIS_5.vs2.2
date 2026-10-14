import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EvidenceCard } from '../../components/evidence/EvidenceCard';
import type { EvidenciaRow } from '../../services/EvidenceService';

// Mock de Supabase Client para Storage getPublicUrl
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    storage: {
      from: vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockImplementation((path: string) => ({
          data: { publicUrl: `https://test-supabase.co/storage/v1/object/public/evidencias/${path}` },
        })),
      }),
    },
  },
}));

describe('EvidenceCard Component', () => {
  const mockEvidence: EvidenciaRow = {
    id: 'test-evidence-uuid-1234',
    nombre_archivo: 'inspeccion_operario_01.jpg',
    ruta_storage: 'originals/d41d8cd98f00b204e9800998ecf8427e.jpg',
    ruta_thumb: 'thumbs/d41d8cd98f00b204e9800998ecf8427e_thumb.webp',
    hash_sha256: 'd41d8cd98f00b204e9800998ecf8427e4e1234567890abcdef1234567890abcdef',
    tamano_bytes: 204800,
    mime_type: 'image/jpeg',
    fecha_captura: '2026-10-13T14:30:00.000Z',
    fecha_ingesta: '2026-10-13T14:35:00.000Z',
    estado: 'pendiente',
    metadatos_json: null,
    subido_por: null,
  };

  it('renderiza el nombre del archivo y la insignia de estado', () => {
    render(<EvidenceCard evidence={mockEvidence} />);

    // Verificar nombre de archivo
    expect(screen.getByText('inspeccion_operario_01.jpg')).toBeInTheDocument();

    // Verificar StatusBadge
    const badge = screen.getByTestId('status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(/pendiente/i);
  });

  it('muestra el hash SHA-256 (truncado) y tiene el botón de copiar', () => {
    render(<EvidenceCard evidence={mockEvidence} />);

    // El componente trunca a los primeros 8 y últimos 6 caracteres: d41d8cd9...abcdef
    expect(screen.getByText(/SHA:/i)).toBeInTheDocument();
    expect(screen.getByText(/d41d8cd9/i)).toBeInTheDocument();

    // Botón de copiar
    const copyButton = screen.getByTitle('Copiar SHA-256 completo');
    expect(copyButton).toBeInTheDocument();
  });

  it('asegura que el botón "Extraer Fotocheck (OCR)" está habilitado y es interactivo para el Módulo 4', () => {
    render(<EvidenceCard evidence={mockEvidence} />);

    const ocrButton = screen.getByRole('button', { name: /Extraer Fotocheck \(OCR\)/i });
    expect(ocrButton).toBeInTheDocument();
    expect(ocrButton).not.toBeDisabled();
  });

  it('obtiene y renderiza la miniatura de Supabase Storage', async () => {
    render(<EvidenceCard evidence={mockEvidence} />);

    const img = await screen.findByRole('img', { name: /inspeccion_operario_01\.jpg/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute(
      'src',
      'https://test-supabase.co/storage/v1/object/public/evidencias/thumbs/d41d8cd98f00b204e9800998ecf8427e_thumb.webp'
    );
  });
});
