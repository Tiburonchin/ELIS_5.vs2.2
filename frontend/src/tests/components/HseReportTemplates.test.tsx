import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InspectionReportTemplate } from '@/components/reports/InspectionReportTemplate';
import { AmonestacionReportTemplate } from '@/components/reports/AmonestacionReportTemplate';
import type { ActividadRow } from '@/services/ActivityService';
import { crearDemoF120LlerenaRios, PA_PERU_INFO } from '@/types/hseFormats';

describe('Auditoría de Plantillas HSE Oficiales P.A. Perú (HSE-EL-F-120 y HSE-EL-F-128)', () => {
  const demoF120 = crearDemoF120LlerenaRios();

  const mockInspectionActivity: ActividadRow = {
    id: 'act-ins-001',
    codigo_referencia: 'HSE-EL-F-120-001',
    tipo_actividad: 'INSPECCION',
    descripcion: 'Inspección de Corte y Reconexión en Campo',
    ubicacion: 'Sede Central - San Isidro',
    responsable_id: 'usr-1',
    responsable_nombre: 'Ing. Carlos Mendoza',
    fecha_operacion: '2026-10-05',
    estado_reporte: 'publicada',
    datos_formato_json: demoF120 as any,
    creado_en: '2026-10-05T08:30:00Z',
    actualizado_en: '2026-10-05T08:30:00Z',
  };

  const mockAmonestacionActivity: ActividadRow = {
    id: 'act-amn-002',
    codigo_referencia: 'HSE-EL-F-128-009',
    tipo_actividad: 'AMONESTACION',
    descripcion: 'Amonestación por no uso reiterado de protección auditiva y casco.',
    ubicacion: 'Taller de Soldadura',
    responsable_id: 'usr-1',
    responsable_nombre: 'Ing. Miguel Salazar',
    fecha_operacion: '2026-10-14',
    estado_reporte: 'pendiente',
    datos_formato_json: {
      tipo_formato: 'HSE_EL_F_128',
      codigo_documento: 'HSE-EL-F-128',
      version: '01',
      amonestado: {
        apellidos_nombres: 'García Pérez, Raúl',
        dni: '45678901',
        cargo: 'Operario Soldador',
        empresa: 'Contratista Metales SAC',
        ubicacion: 'Taller de Soldadura',
        fecha: '2026-10-14',
        hora: '10:15',
      },
      responsables: {
        capataz_jefe_cuadrilla: 'Jorge Benítez',
        ing_responsable: 'Ing. Miguel Salazar',
        actividad_trabajo: 'Fabricación de ductos de ventilación',
      },
      relato_razon: 'El colaborador no usaba casco de seguridad ni tapones auditivos en zona de ruido elevado.',
      motivo_codigo: '02_ACTO_SUBESTANDAR',
      detalle_motivo: 'Art. 45 RIIST - Uso obligatorio de EPP en zonas de alto ruido',
      nivel_riesgo: '01_INTOLERABLE',
      otro_riesgo: '',
      accion_inmediata: 'Paralización de la labor y entrega inmediata de EPP con reinducción.',
      sancion_codigo: '02_SUSPENSION',
      dias_suspension: 3,
      validacion: {
        realizado_por: { nombre: 'Ing. Miguel Salazar', cargo: 'Inspector HSE' },
        aprobado_por: { nombre: 'Ing. Residente / Jefe HSE', cargo: 'Supervisión HSE' },
        aceptado_por: { nombre: 'García Pérez, Raúl', cargo: 'Operario Soldador' },
      },
    },
    creado_en: '2026-10-14T10:35:00Z',
    actualizado_en: '2026-10-14T10:35:00Z',
  };

  const mockEvidences = [
    {
      vinculo: {
        actividad_id: 'act-ins-001',
        evidencia_id: 'evi-1',
        rol_evidencia: 'hallazgo',
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

  it('InspectionReportTemplate renderiza sin errores de tipado con el checklist oficial de 15 secciones y 4 páginas', () => {
    render(
      <InspectionReportTemplate
        activity={mockInspectionActivity}
        evidences={mockEvidences}
        inspectorName="Ing. Carlos Mendoza"
        inspectorCargo="Supervisor General HSE"
      />
    );

    // Encabezado corporativo oficial P.A. Perú
    expect(screen.getAllByText(/PROFESIONALES ASOCIADOS/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(new RegExp(PA_PERU_INFO.ruc, 'i')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/INSPECCIÓN DE SEGURIDAD, SALUD EN EL TRABAJO Y MEDIO AMBIENTE/i).length).toBeGreaterThanOrEqual(1);

    // Secciones del catálogo oficial F120
    expect(screen.getAllByText(/INSTALACION \/ ESTRUCTURA \/ ALMACEN/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/INSTRUCCIÓN PREVIA EN CAMPO/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/EQUIPOS DE PROTECCIÓN PERSONAL/i).length).toBeGreaterThanOrEqual(1);

    // Caso Llerena Ríos: Personal Involucrado y Hallazgo
    expect(screen.getAllByText(/VÍCTOR ALFONSO LLERENA RÍOS/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/quemadura eléctrica/i).length).toBeGreaterThanOrEqual(1);

    // Control de páginas (Páginas estructuradas del documento)
    expect(screen.getByText('1 de 4')).toBeInTheDocument();
    expect(screen.getByText('3 de 4')).toBeInTheDocument();
    expect(screen.getByText('4 de 4')).toBeInTheDocument();
  });

  it('AmonestacionReportTemplate renderiza sin errores con el formato oficial HSE-EL-F-128', () => {
    render(
      <AmonestacionReportTemplate
        activity={mockAmonestacionActivity}
        evidences={mockEvidences}
        inspectorName="Ing. Miguel Salazar"
        inspectorCargo="Inspector HSE"
      />
    );

    // Membrete oficial
    expect(screen.getAllByText(/REGISTRO DE AMONESTACIÓN/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('HSE-EL-F-128').length).toBeGreaterThanOrEqual(1);

    // 1. Datos del amonestado
    const amonestadoElements = screen.getAllByText('García Pérez, Raúl');
    expect(amonestadoElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Operario Soldador').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Contratista Metales SAC')).toBeInTheDocument();

    // 2. Supervisores responsables
    expect(screen.getByText('Jorge Benítez')).toBeInTheDocument();
    expect(screen.getByText('Fabricación de ductos de ventilación')).toBeInTheDocument();

    // 3. Motivo y detalle de los hechos
    expect(screen.getByText(/El colaborador no usaba casco de seguridad ni tapones auditivos/i)).toBeInTheDocument();
    expect(screen.getByText(/Art. 45 RIIST/i)).toBeInTheDocument();

    // 4. Medida inmediata
    expect(screen.getByText(/Paralización de la labor y entrega inmediata de EPP/i)).toBeInTheDocument();

    // 5. Sanción aplicada (Suspensión 3 días)
    expect(screen.getByText(/02\. Suspensión \(3 días\)/i)).toBeInTheDocument();

    // 6. Firmas de validación (3 casillas oficiales)
    expect(screen.getByText('REALIZADO POR')).toBeInTheDocument();
    expect(screen.getByText('APROBADO POR')).toBeInTheDocument();
    expect(screen.getByText(/ACEPTADO POR \(TRABAJADOR\)/i)).toBeInTheDocument();
  });
});
