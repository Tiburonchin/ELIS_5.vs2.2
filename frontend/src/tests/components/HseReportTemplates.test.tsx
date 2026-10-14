import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InspectionReportTemplate } from '@/components/reports/InspectionReportTemplate';
import { AmonestacionReportTemplate } from '@/components/reports/AmonestacionReportTemplate';
import type { ActividadRow } from '@/services/ActivityService';

describe('Auditoría de Plantillas HSE (JSONB Structure)', () => {
  const mockInspectionActivity: ActividadRow = {
    id: 'act-ins-001',
    codigo_referencia: 'ACT-2026-INSP-01',
    tipo_actividad: 'INSPECCION',
    descripcion: 'Inspección periódica en planta de chancado primario.',
    ubicacion: 'Frente Norte - Chancado',
    responsable_id: 'usr-1',
    responsable_nombre: 'Ing. Carlos Mendoza',
    fecha_operacion: '2026-10-14T08:00:00Z',
    estado_reporte: 'publicada',
    datos_formato_json: {
      items_evaluados: {
        sec_1: { calificacion: 'S', observacion: 'Instalaciones y accesos despejados' },
        sec_2: { calificacion: 'ER', observacion: 'Herramienta de impacto sin guarda de seguridad' },
        sec_4: { calificacion: 'PI', observacion: 'Trabajador en altura sin línea de anclaje normada' },
        sec_8: { calificacion: 'NA', observacion: 'Sin químicos almacenados en el área' },
      },
    },
    creado_en: '2026-10-14T08:30:00Z',
    actualizado_en: '2026-10-14T08:30:00Z',
  };

  const mockAmonestacionActivity: ActividadRow = {
    id: 'act-amn-002',
    codigo_referencia: 'HSE-EL-F-128-009',
    tipo_actividad: 'AMONESTACION',
    descripcion: 'Amonestación por no uso reiterado de protección auditiva y casco.',
    ubicacion: 'Taller de Soldadura',
    responsable_id: 'usr-1',
    responsable_nombre: 'Ing. Miguel Salazar',
    fecha_operacion: '2026-10-14T10:30:00Z',
    estado_reporte: 'pendiente',
    datos_formato_json: {
      datos_amonestado: {
        apellidos_nombres: 'García Pérez, Raúl',
        dni: '45678901',
        cargo: 'Operario Soldador',
        empresa: 'Contratista Metales SAC',
        ubicacion: 'Taller de Soldadura',
        fecha_hora: '2026-10-14 10:15',
      },
      supervisores_responsables: {
        capataz_cuadrilla: 'Jorge Benítez',
        ingeniero_responsable: 'Ing. Miguel Salazar',
        actividad_en_ejecucion: 'Fabricación de ductos de ventilación',
      },
      motivo_amonestacion: {
        codigo_motivo: '02',
        detalle_motivo: 'El colaborador no usaba casco de seguridad ni tapones auditivos en zona de ruido elevado.',
      },
      nivel_riesgo: '01_INTOLERABLE',
      accion_inmediata_hechos: 'Paralización de la labor y entrega inmediata de EPP con reinducción.',
      sancion_aplicada_risst: '02_SUSPENSION',
      dias_suspension: 3,
    },
    creado_en: '2026-10-14T10:35:00Z',
    actualizado_en: '2026-10-14T10:35:00Z',
  };

  const mockEvidences = [
    {
      vinculo: {
        actividad_id: 'act-ins-001',
        evidencia_id: 'evi-1',
        notas: 'Evidencia de incumplimiento',
        vinculado_en: '2026-10-14T08:30:00Z',
        vinculado_por: 'usr-1',
      },
      evidencia: {
        id: 'evi-1',
        subido_por: 'usr-1',
        nombre_archivo: 'foto_andamio_01.jpg',
        ruta_storage: 'evidencias/foto_andamio_01.jpg',
        ruta_thumb: null,
        hash_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        mime_type: 'image/jpeg',
        tamano_bytes: 2048500,
        fecha_captura: '2026-10-14T08:25:00Z',
        fecha_ingesta: '2026-10-14T08:30:00Z',
        metadatos_json: {},
        estado: 'vinculada' as const,
      },
      identificacion: {
        evidencia_id: 'evi-1',
        nombres: 'Raúl',
        apellido_paterno: 'García',
        apellido_materno: 'Pérez',
        cargo: 'Operario Soldador',
        texto_crudo_ocr: 'RAUL GARCIA PEREZ DNI 45678901',
        nivel_confianza: 95.5,
        confirmado_por: 'usr-1',
        confirmador_email: 'supervisor@empresa.com',
        confirmado_en: '2026-10-14T08:30:00Z',
      },
    },
  ];

  it('InspectionReportTemplate renderiza sin errores de tipado con el checklist de 15 secciones y JSONB', () => {
    render(
      <InspectionReportTemplate
        activity={mockInspectionActivity}
        evidences={mockEvidences}
        inspectorName="Ing. Supervisor Prueba"
        inspectorCargo="Supervisor General HSE"
      />
    );

    // Encabezado
    expect(screen.getByText(/REPORTE DE INSPECCIÓN HSE/i)).toBeInTheDocument();
    expect(screen.getByText('ACT-2026-INSP-01')).toBeInTheDocument();
    expect(screen.getByText('Frente Norte - Chancado')).toBeInTheDocument();

    // Secciones del checklist evaluadas
    expect(screen.getByText('Instalaciones, Estructura y Almacén')).toBeInTheDocument();
    expect(screen.getByText('Herramientas Manuales y Eléctricas')).toBeInTheDocument();
    expect(screen.getByText('Comportamiento y Observación Preventiva')).toBeInTheDocument();

    // Observaciones del JSONB
    expect(screen.getByText('Instalaciones y accesos despejados')).toBeInTheDocument();
    expect(screen.getByText('Herramienta de impacto sin guarda de seguridad')).toBeInTheDocument();

    // Evidencias fotográficas y hash SHA-256
    expect(screen.getByText('foto_andamio_01.jpg')).toBeInTheDocument();
    expect(screen.getByText('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')).toBeInTheDocument();
  });

  it('AmonestacionReportTemplate renderiza sin errores con el formato oficial HSE-EL-F-128', () => {
    render(
      <AmonestacionReportTemplate
        activity={mockAmonestacionActivity}
        evidences={mockEvidences}
        inspectorName="Ing. Supervisor Prueba"
        inspectorCargo="Supervisor General HSE"
      />
    );

    // Membrete oficial
    expect(screen.getByText(/REGISTRO DE AMONESTACIÓN • FORMATO HSE-EL-F-128/i)).toBeInTheDocument();
    expect(screen.getByText('HSE-EL-F-128-009')).toBeInTheDocument();

    // 1. Datos del amonestado y firmas
    const amonestadoElements = screen.getAllByText('García Pérez, Raúl');
    expect(amonestadoElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Operario Soldador')).toBeInTheDocument();
    expect(screen.getByText('Contratista Metales SAC')).toBeInTheDocument();

    // 2. Supervisores responsables
    expect(screen.getByText('Jorge Benítez')).toBeInTheDocument();
    expect(screen.getByText('Fabricación de ductos de ventilación')).toBeInTheDocument();

    // 3. Motivo y detalle de los hechos
    expect(screen.getByText(/El colaborador no usaba casco de seguridad ni tapones auditivos/i)).toBeInTheDocument();

    // 4. Medida inmediata
    expect(screen.getByText(/Paralización de la labor y entrega inmediata de EPP/i)).toBeInTheDocument();

    // 6. Sanción aplicada (Suspensión 3 días)
    expect(screen.getByText(/\[X\] 02\. Suspensión \(3 días\)/i)).toBeInTheDocument();

    // Evidencias y validación forense
    expect(screen.getByText(/foto_andamio_01.jpg/i)).toBeInTheDocument();
    expect(screen.getByText(/Infractor Confirmado: Raúl García/i)).toBeInTheDocument();
  });
});
