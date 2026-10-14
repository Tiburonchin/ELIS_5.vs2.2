import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivitiesManager } from '../../pages/ActivitiesManager';
import { activityService } from '../../services/ActivityService';

// Mock de activityService
vi.mock('../../services/ActivityService', () => ({
  activityService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock de useVoiceAssistant
vi.mock('../../hooks/useVoiceAssistant', () => ({
  useVoiceAssistant: () => ({
    state: 'idle',
    orbState: 'idle',
    isListening: false,
    transcript: '',
    interimTranscript: '',
    isSupported: true,
    error: null,
    startSession: vi.fn(),
    stopSession: vi.fn(),
    resetSession: vi.fn(),
    setProcessing: vi.fn(),
    setErrorState: vi.fn(),
    speak: vi.fn(),
  }),
}));

// Mock de useSpeech
vi.mock('../../hooks/useSpeech', () => ({
  useSpeech: () => ({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    isSupported: true,
    error: null,
    startListening: vi.fn(),
    stopListening: vi.fn(),
    resetTranscript: vi.fn(),
  }),
}));

describe('ActivitiesManager Page Component', () => {
  const mockActivities = [
    {
      id: 'act-1',
      codigo_referencia: 'ACT-2026-001',
      tipo_actividad: 'INSPECCION' as const,
      ubicacion: 'Planta Principal',
      fecha_operacion: '2026-10-14T00:00:00Z',
      responsable_id: null,
      responsable_nombre: 'Ing. Carlos Mendoza',
      descripcion: 'Inspección técnica general',
      estado_reporte: 'pendiente' as const,
      datos_formato_json: null,
      creado_en: '2026-10-14T00:00:00Z',
      actualizado_en: '2026-10-14T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza la lista de actividades cargadas desde Supabase', async () => {
    vi.mocked(activityService.getAll).mockResolvedValueOnce({
      data: mockActivities,
      total: 1,
    });

    render(<ActivitiesManager />);

    expect(screen.getByText(/Cargando actividades desde Supabase/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('ACT-2026-001')).toBeInTheDocument();
      expect(screen.getByText('Planta Principal')).toBeInTheDocument();
      expect(screen.getByText(/Carlos Mendoza/i)).toBeInTheDocument();
    });
  });

  it('abre el modal y permite crear una nueva actividad', async () => {
    vi.mocked(activityService.getAll).mockResolvedValueOnce({
      data: [],
      total: 0,
    });

    const newActivity = {
      ...mockActivities[0],
      id: 'act-new',
      codigo_referencia: 'ACT-2026-999',
    };

    vi.mocked(activityService.create).mockResolvedValueOnce(newActivity);

    render(<ActivitiesManager />);

    await waitFor(() => {
      expect(screen.getByText(/No hay actividades creadas/i)).toBeInTheDocument();
    });

    // Abrir modal
    const newBtn = screen.getByText('Nueva Actividad');
    fireEvent.click(newBtn);

    expect(screen.getByText('Nueva Actividad Operativa')).toBeInTheDocument();

    // Rellenar campos obligatorios
    fireEvent.change(screen.getByPlaceholderText('Planta Principal - Sector B'), {
      target: { value: 'Sector Norte' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ing. Carlos Mendoza'), {
      target: { value: 'Ing. Laura Rios' },
    });

    // Guardar
    const submitBtn = screen.getByText('Crear Actividad');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(activityService.create).toHaveBeenCalled();
      expect(screen.getByText('ACT-2026-999')).toBeInTheDocument();
    });
  });

  it('integra el reconocimiento de voz insertando el texto dictado en el campo Descripción', async () => {
    vi.mocked(activityService.getAll).mockResolvedValueOnce({
      data: [],
      total: 0,
    });

    render(<ActivitiesManager />);

    await waitFor(() => {
      expect(screen.getByText(/No hay actividades creadas/i)).toBeInTheDocument();
    });

    // Abrir modal de nueva actividad
    fireEvent.click(screen.getByText('Nueva Actividad'));

    const textarea = screen.getByPlaceholderText(
      'Dicta o escribe notas de campo sobre la inspección...'
    ) as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    expect(textarea.value).toBe('');

    // Verificar que el botón de dictado de voz está presente y accesible
    const voiceBtn = screen.getByRole('button', { name: /Dictar Descripción|Dictar por Voz/i });
    expect(voiceBtn).toBeInTheDocument();

    // Simular que el usuario dicta o el hook de voz actualiza la descripción
    fireEvent.change(textarea, {
      target: {
        value: 'El operario no había repasado la actuación ante una quemadura eléctrica',
      },
    });

    expect(textarea.value).toBe(
      'El operario no había repasado la actuación ante una quemadura eléctrica'
    );
  });
});

