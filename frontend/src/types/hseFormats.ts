/**
 * ELIS 5.0 — Tipos y Constantes Oficiales de Formatos HSE
 * P.A. Perú (PROFESIONALES ASOCIADOS PERU S.A.C - RUC 20549011196)
 *
 * Este archivo define la estructura TypeScript estricta para los 2 formatos
 * corporativos que se almacenan en actividades.datos_formato_json (JSONB).
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES CORPORATIVAS P.A. PERÚ
// ═══════════════════════════════════════════════════════════════════════════

export const PA_PERU_INFO = {
  razon_social: 'PROFESIONALES ASOCIADOS PERU S.A.C',
  ruc: '20549011196',
  domicilio: 'Av. Javier Prado Oeste 757 Oficina 1306 Magdalena del Mar - Lima',
  tipo_actividad_economica: 'Actividades de Ingeniería y Arquitectura',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// CALIFICACIÓN DE ÍTEMS HSE
// ═══════════════════════════════════════════════════════════════════════════

export type CalificacionHSE = 'S' | 'ER' | 'PI' | 'NA';

export const CALIFICACIONES_HSE: Record<CalificacionHSE, string> = {
  S: 'Seguro',
  ER: 'En Riesgo',
  PI: 'Peligro Inminente',
  NA: 'No Aplica',
};

// ═══════════════════════════════════════════════════════════════════════════
// CATÁLOGO OFICIAL DE 15 SECCIONES — HSE-EL-F-120 v02
// ═══════════════════════════════════════════════════════════════════════════

export interface ItemChecklist {
  codigo: string;   // ej. "1.1", "9.3"
  descripcion: string;
}

export interface SeccionChecklist {
  id: number;
  nombre: string;
  items: ItemChecklist[];
}

export const CATALOGO_F120: SeccionChecklist[] = [
  {
    id: 1,
    nombre: 'INSTALACION / ESTRUCTURA / ALMACEN',
    items: [
      { codigo: '1.1', descripcion: 'Pisos se encuentran limpios, secos y sin obstáculos' },
      { codigo: '1.2', descripcion: 'Las paredes y techos se encuentran en buen estado' },
      { codigo: '1.3', descripcion: 'Las ventanas y puertas están en condiciones seguras' },
      { codigo: '1.4', descripcion: 'La iluminación es adecuada para las tareas realizadas' },
      { codigo: '1.5', descripcion: 'La ventilación es suficiente y adecuada' },
      { codigo: '1.6', descripcion: 'Las rutas de evacuación están despejadas y señalizadas' },
      { codigo: '1.7', descripcion: 'Las salidas de emergencia están operativas y sin obstáculos' },
      { codigo: '1.8', descripcion: 'La señalización de seguridad es visible y vigente' },
      { codigo: '1.9', descripcion: 'Los materiales están almacenados de forma segura y ordenada' },
      { codigo: '1.10', descripcion: 'El área de almacén tiene control de acceso restringido' },
      { codigo: '1.11', descripcion: 'Los estantes/racks están asegurados y no sobrecargados' },
      { codigo: '1.12', descripcion: 'Existe separación adecuada entre materiales incompatibles' },
      { codigo: '1.13', descripcion: 'Las áreas de circulación están delimitadas' },
      { codigo: '1.14', descripcion: 'El área de carga y descarga está debidamente señalizada' },
      { codigo: '1.15', descripcion: 'Los servicios higiénicos están operativos y limpios' },
      { codigo: '1.16', descripcion: 'Las instalaciones sanitarias cuentan con agua y jabón' },
      { codigo: '1.17', descripcion: 'El sistema de drenaje y alcantarillado está operativo' },
    ],
  },
  {
    id: 2,
    nombre: 'PREVENCIÓN Y CONTROL DE INCENDIOS Y PRIMEROS AUXILIOS',
    items: [
      { codigo: '2.1', descripcion: 'Extintores disponibles, cargados y con inspección vigente' },
      { codigo: '2.2', descripcion: 'Los extintores son del tipo adecuado para los riesgos del área' },
      { codigo: '2.3', descripcion: 'Los extintores están accesibles y correctamente señalizados' },
      { codigo: '2.4', descripcion: 'El personal conoce la ubicación y uso de los extintores' },
      { codigo: '2.5', descripcion: 'Se cuenta con detectores de humo operativos' },
      { codigo: '2.6', descripcion: 'Los gabinetes contra incendio están operativos' },
      { codigo: '2.7', descripcion: 'Se realizan simulacros de evacuación periódicamente' },
      { codigo: '2.8', descripcion: 'Las brigadas de emergencia están conformadas y capacitadas' },
      { codigo: '2.9', descripcion: 'Se cuenta con botiquín de primeros auxilios abastecido' },
      { codigo: '2.10', descripcion: 'El botiquín tiene lista de contenido vigente' },
      { codigo: '2.11', descripcion: 'Se dispone de camilla rígida en el área' },
      { codigo: '2.12', descripcion: 'Los números de emergencia están publicados visiblemente' },
      { codigo: '2.13', descripcion: 'Se cuenta con plan de emergencia actualizado y difundido' },
    ],
  },
  {
    id: 3,
    nombre: 'COMEDOR',
    items: [
      { codigo: '3.1', descripcion: 'El comedor se encuentra limpio y ordenado' },
      { codigo: '3.2', descripcion: 'El personal de cocina usa implementos de higiene' },
      { codigo: '3.3', descripcion: 'Los alimentos se almacenan en condiciones adecuadas' },
      { codigo: '3.4', descripcion: 'Se cuenta con agua potable para consumo' },
    ],
  },
  {
    id: 4,
    nombre: 'MEDIO AMBIENTE',
    items: [
      { codigo: '4.1', descripcion: 'Se realiza segregación de residuos en contenedores codificados' },
      { codigo: '4.2', descripcion: 'Los residuos peligrosos se almacenan en área específica' },
      { codigo: '4.3', descripcion: 'No se evidencia contaminación del suelo por derrames' },
      { codigo: '4.4', descripcion: 'Las emisiones de polvo y ruido están controladas' },
      { codigo: '4.5', descripcion: 'Se cuenta con kit antiderrame en zonas de riesgo' },
      { codigo: '4.6', descripcion: 'Se dispone de manifiestos de manejo de residuos actualizados' },
    ],
  },
  {
    id: 5,
    nombre: 'PRODUCTOS QUÍMICOS',
    items: [
      { codigo: '5.1', descripcion: 'Los productos químicos están etiquetados correctamente (SGA/GHS)' },
      { codigo: '5.2', descripcion: 'Se dispone de Hojas de Seguridad (MSDS/SDS) accesibles' },
      { codigo: '5.3', descripcion: 'Los productos están almacenados según compatibilidad' },
      { codigo: '5.4', descripcion: 'Existen duchas de emergencia y lavaojos disponibles' },
      { codigo: '5.5', descripcion: 'El personal que manipula químicos usa EPP adecuado' },
      { codigo: '5.6', descripcion: 'Los envases de químicos están en buen estado (sin fugas)' },
      { codigo: '5.7', descripcion: 'Se cuenta con bandeja de contención en almacén de químicos' },
      { codigo: '5.8', descripcion: 'El área de almacenamiento tiene ventilación adecuada' },
    ],
  },
  {
    id: 6,
    nombre: 'VESTIDORES Y DUCHAS',
    items: [
      { codigo: '6.1', descripcion: 'Los vestidores se encuentran limpios y ventilados' },
      { codigo: '6.2', descripcion: 'Cada trabajador tiene casillero personal asignado' },
      { codigo: '6.3', descripcion: 'Las duchas están operativas con agua caliente y fría' },
      { codigo: '6.4', descripcion: 'Se dispone de bancas y áreas de secado adecuadas' },
    ],
  },
  {
    id: 7,
    nombre: 'ZONA DE TRABAJO',
    items: [
      { codigo: '7.1', descripcion: 'El área de trabajo está delimitada y señalizada' },
      { codigo: '7.2', descripcion: 'Se cuenta con análisis de riesgo vigente (ATS/AST)' },
      { codigo: '7.3', descripcion: 'Los permisos de trabajo están vigentes y en el área' },
      { codigo: '7.4', descripcion: 'El orden y limpieza en la zona de trabajo es aceptable' },
      { codigo: '7.5', descripcion: 'Las barreras y cintas de seguridad están instaladas' },
      { codigo: '7.6', descripcion: 'No se evidencian condiciones subestándar sin controlar' },
    ],
  },
  {
    id: 8,
    nombre: 'EQUIPOS DE PROTECCIÓN PERSONAL',
    items: [
      { codigo: '8.1', descripcion: 'Casco de seguridad en buen estado y uso correcto' },
      { codigo: '8.2', descripcion: 'Barbiquejo colocado y ajustado correctamente' },
      { codigo: '8.3', descripcion: 'Lentes de seguridad claros/oscuros según actividad' },
      { codigo: '8.4', descripcion: 'Protección auditiva en zonas con ruido > 85 dB' },
      { codigo: '8.5', descripcion: 'Guantes del tipo adecuado para la tarea' },
      { codigo: '8.6', descripcion: 'Calzado de seguridad con punta de acero' },
      { codigo: '8.7', descripcion: 'Ropa de trabajo en buenas condiciones (sin roturas)' },
      { codigo: '8.8', descripcion: 'Chaleco reflectivo con cintas de alta visibilidad' },
      { codigo: '8.9', descripcion: 'Arnés de seguridad para trabajos en altura (> 1.80m)' },
      { codigo: '8.10', descripcion: 'Línea de vida doble con absorbedor de impacto' },
      { codigo: '8.11', descripcion: 'Protección respiratoria según agente de riesgo' },
      { codigo: '8.12', descripcion: 'Careta facial para trabajos de esmerilado/soldadura' },
      { codigo: '8.13', descripcion: 'Mandil de cuero para trabajos en caliente' },
      { codigo: '8.14', descripcion: 'Polainas de cuero para trabajos de soldadura' },
      { codigo: '8.15', descripcion: 'Protección contra caídas certificada y vigente' },
      { codigo: '8.16', descripcion: 'EPP específico para trabajos eléctricos (guantes dieléctricos)' },
      { codigo: '8.17', descripcion: 'Control de entrega de EPP documentado y firmado' },
    ],
  },
  {
    id: 9,
    nombre: 'INSTRUCCIÓN PREVIA EN CAMPO',
    items: [
      { codigo: '9.1', descripcion: 'Se realizó charla de 5 minutos antes del inicio de trabajos' },
      { codigo: '9.2', descripcion: 'El personal conoce los riesgos de la tarea a ejecutar' },
      { codigo: '9.3', descripcion: 'Se realizó instrucción práctica / OPT de la tarea crítica' },
      { codigo: '9.4', descripcion: 'El personal conoce las medidas de control establecidas' },
      { codigo: '9.5', descripcion: 'Se evidencia registro de asistencia a la charla' },
      { codigo: '9.6', descripcion: 'El supervisor verificó comprensión del personal' },
      { codigo: '9.7', descripcion: 'Se cuenta con material visual de apoyo (fotos, diagramas)' },
    ],
  },
  {
    id: 10,
    nombre: 'PROCEDIMIENTOS',
    items: [
      { codigo: '10.1', descripcion: 'Se cuenta con PETS/AST aprobado para la actividad' },
      { codigo: '10.2', descripcion: 'El personal ha sido capacitado en el procedimiento' },
      { codigo: '10.3', descripcion: 'Se cumple con los pasos del procedimiento establecido' },
    ],
  },
  {
    id: 11,
    nombre: 'MÁQUINAS, EQUIPOS Y HERRAMIENTAS',
    items: [
      { codigo: '11.1', descripcion: 'Las máquinas tienen guardas de protección instaladas' },
      { codigo: '11.2', descripcion: 'Los equipos cuentan con parada de emergencia operativa' },
      { codigo: '11.3', descripcion: 'Las herramientas están en buen estado de conservación' },
      { codigo: '11.4', descripcion: 'Las herramientas eléctricas tienen conexión a tierra / doble aislamiento' },
      { codigo: '11.5', descripcion: 'Se aplica código de colores de inspección vigente' },
      { codigo: '11.6', descripcion: 'Los cables de extensión están en buen estado y protegidos' },
      { codigo: '11.7', descripcion: 'Las herramientas de corte tienen protectores colocados' },
      { codigo: '11.8', descripcion: 'Los equipos de soldadura están en condiciones seguras' },
      { codigo: '11.9', descripcion: 'Se cuenta con procedimiento de bloqueo/etiquetado (LOTO)' },
      { codigo: '11.10', descripcion: 'Los cilindros de gas están asegurados y con válvula cerrada' },
    ],
  },
  {
    id: 12,
    nombre: 'VEHICULOS (PESADO y LIVIANO)',
    items: [
      { codigo: '12.1', descripcion: 'El vehículo cuenta con inspección preoperacional vigente (check list)' },
      { codigo: '12.2', descripcion: 'El conductor tiene licencia y autorización interna vigente' },
      { codigo: '12.3', descripcion: 'El vehículo tiene luces, frenos y dirección operativos' },
      { codigo: '12.4', descripcion: 'Se usa cinturón de seguridad por conductor y pasajeros' },
      { codigo: '12.5', descripcion: 'El vehículo pesado cuenta con alarma de retroceso y circulina' },
      { codigo: '12.6', descripcion: 'Se respeta la velocidad máxima establecida en el proyecto' },
      { codigo: '12.7', descripcion: 'Se cuenta con vigía/cuadrador para maniobras en reversa' },
      { codigo: '12.8', descripcion: 'El vehículo tiene botiquín, extintor y triángulos de seguridad' },
      { codigo: '12.9', descripcion: 'No se evidencia uso de celular mientras se conduce' },
    ],
  },
  {
    id: 13,
    nombre: 'EQUIPO DE IZAJE Y GRÚA',
    items: [
      { codigo: '13.1', descripcion: 'La grúa/equipo de izaje tiene certificación de operatividad vigente' },
      { codigo: '13.2', descripcion: 'El operador cuenta con certificación y autorización' },
      { codigo: '13.3', descripcion: 'Se realizó plan de izaje para cargas críticas' },
      { codigo: '13.4', descripcion: 'Los estrobos y eslingas están en buen estado e inspeccionados' },
      { codigo: '13.5', descripcion: 'Se ha delimitado la zona de maniobra de izaje' },
      { codigo: '13.6', descripcion: 'El rigger/señalero está identificado y capacitado' },
      { codigo: '13.7', descripcion: 'No se realizan izajes sobre personas o zonas de tránsito' },
    ],
  },
  {
    id: 14,
    nombre: 'EXCAVACIONES, HOYOS, ZANJAS',
    items: [
      { codigo: '14.1', descripcion: 'Las excavaciones > 1.50m cuentan con sistema de sostenimiento' },
      { codigo: '14.2', descripcion: 'Se ha verificado la ausencia de instalaciones subterráneas' },
      { codigo: '14.3', descripcion: 'Las paredes de la excavación están estables (sin grietas)' },
      { codigo: '14.4', descripcion: 'Se cuenta con escaleras de acceso cada 7.50m máximo' },
      { codigo: '14.5', descripcion: 'El material excavado está a mínimo 0.60m del borde' },
      { codigo: '14.6', descripcion: 'Se dispone de barandas o barreras perimetrales' },
      { codigo: '14.7', descripcion: 'La señalización perimetral es adecuada (cintas, conos, mallas)' },
      { codigo: '14.8', descripcion: 'Se monitorean las condiciones del suelo después de lluvias' },
      { codigo: '14.9', descripcion: 'El personal usa arnés al ingresar a excavaciones profundas' },
      { codigo: '14.10', descripcion: 'Se cuenta con vigía permanente en la excavación' },
      { codigo: '14.11', descripcion: 'El equipo pesado opera a distancia segura del borde' },
      { codigo: '14.12', descripcion: 'Se ha medido oxígeno y gases en espacios confinados' },
      { codigo: '14.13', descripcion: 'Se cuenta con plan de rescate para emergencias en excavación' },
    ],
  },
  {
    id: 15,
    nombre: 'Riesgos Psicosociales',
    items: [
      { codigo: '15.1', descripcion: 'No se evidencia fatiga, somnolencia o estrés extremo en el personal' },
      { codigo: '15.2', descripcion: 'Se promueve el reporte de condiciones de acoso o presión laboral' },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// FORMATO DE INSPECCIÓN HSE-EL-F-120 (Versión 02, 4 páginas)
// ═══════════════════════════════════════════════════════════════════════════

export interface ItemEvaluado {
  codigo: string;
  calificacion: CalificacionHSE;
  observacion?: string;
}

export interface HallazgoLevantamiento {
  item_ref: string;
  descripcion_hallazgo: string;
  accion_levantamiento: string;
  evidencia_hallazgo_id?: string;
  evidencia_correccion_id?: string;
  no_requiere_foto_correccion: boolean;
}

export interface PersonalInvolucrado {
  nombre_completo: string;
  cargo: string;
  evidencia_fotocheck_id?: string;
}

export interface RetroalimentacionCharla {
  tema: string;
  hora_desde: string;
  hora_hasta: string;
  num_participantes: number;
  nombre_expositor: string;
  participantes: Array<{ nombre: string; cargo?: string }>;
}

export interface InspectorEncargado {
  nombre: string;
  cargo: string;
}

export interface FormatoInspeccionF120 {
  tipo_formato: 'CHECKLIST_F120';
  codigo_documento: 'HSE-EL-F-120';
  version: '02';

  // Cabecera P.A. Perú
  cabecera: {
    razon_social: string;
    ruc: string;
    domicilio: string;
    tipo_actividad_economica: string;
    proyecto: string;
    actividad: string;
    lugar: string;
    supervisor_encargado: string;
    responsable_area: string;
    fecha_inspeccion: string;
    hora_inspeccion: string;
  };

  // Checklist de 15 secciones (Páginas 1 y 2)
  items_evaluados: ItemEvaluado[];

  // Apartado de Corrección / Levantamiento (Página 3)
  se_corrigieron_hallazgos: boolean;
  hallazgos_y_levantamiento: HallazgoLevantamiento[];
  modalidad_inspeccion: 'CON_ACOMPANAMIENTO' | 'SIN_ACOMPANAMIENTO';
  personal_involucrado: PersonalInvolucrado[];

  // Retroalimentación / Charla
  retroalimentacion_charla: RetroalimentacionCharla;

  // Inspector encargado
  inspector_encargado: InspectorEncargado;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMATO DE AMONESTACIÓN HSE-EL-F-128 (Versión 01, 1 página)
// ═══════════════════════════════════════════════════════════════════════════

export type MotivoAmonestacion =
  | '01_FALTA_HSE'
  | '02_ACTO_SUBESTANDAR'
  | '03_OBSERVACION_HSE'
  | '04_CONDICION_SUBESTANDAR';

export type NivelRiesgoAmonestacion =
  | '01_INTOLERABLE'
  | '02_BAJO'
  | '03_MODERADO'
  | '04_OTRO';

export type SancionAmonestacion =
  | '01_LLAMADA_ATENCION'
  | '02_SUSPENSION'
  | '03_RETIRO_INMEDIATO'
  | '04_OTRO';

export const MOTIVOS_AMONESTACION: Record<MotivoAmonestacion, string> = {
  '01_FALTA_HSE': '01. Falta de HSE (según RIIST PA)',
  '02_ACTO_SUBESTANDAR': '02. Acto Subestándar',
  '03_OBSERVACION_HSE': '03. Observación HSE',
  '04_CONDICION_SUBESTANDAR': '04. Condición Subestándar',
};

export const NIVELES_RIESGO: Record<NivelRiesgoAmonestacion, string> = {
  '01_INTOLERABLE': '01. Intolerable',
  '02_BAJO': '02. Bajo',
  '03_MODERADO': '03. Moderado',
  '04_OTRO': '04. Otro',
};

export const SANCIONES_RISST: Record<SancionAmonestacion, string> = {
  '01_LLAMADA_ATENCION': '01. Llamada de Atención',
  '02_SUSPENSION': '02. Suspensión',
  '03_RETIRO_INMEDIATO': '03. Retiro Inmediato del Trabajador',
  '04_OTRO': '04. Otra Medida',
};

export interface FirmaValidacion {
  nombre: string;
  cargo: string;
}

export interface FormatoAmonestacionF128 {
  tipo_formato: 'HSE_EL_F_128';
  codigo_documento: 'HSE-EL-F-128';
  version: '01';

  amonestado: {
    apellidos_nombres: string;
    dni: string;
    cargo: string;
    ubicacion: string;
    empresa: string;
    fecha: string;
    hora: string;
  };

  responsables: {
    capataz_jefe_cuadrilla: string;
    ing_responsable: string;
    actividad_trabajo: string;
  };

  relato_razon: string;

  motivo_codigo: MotivoAmonestacion;
  detalle_motivo: string;

  nivel_riesgo: NivelRiesgoAmonestacion;
  otro_riesgo: string;

  accion_inmediata: string;

  sancion_codigo: SancionAmonestacion;
  dias_suspension?: number;
  otra_sancion?: string;

  validacion: {
    realizado_por: FirmaValidacion;
    aprobado_por: FirmaValidacion;
    aceptado_por: FirmaValidacion;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TIPO UNIÓN PARA datos_formato_json
// ═══════════════════════════════════════════════════════════════════════════

export type DatosFormatoJson = FormatoInspeccionF120 | FormatoAmonestacionF128 | Record<string, unknown>;

// ═══════════════════════════════════════════════════════════════════════════
// DATOS DEMO — CASO REAL: Llerena Ríos 05/10/2026
// ═══════════════════════════════════════════════════════════════════════════

export function crearDemoF120LlerenaRios(): FormatoInspeccionF120 {
  // Generar todos los ítems como "S" por defecto
  const itemsEvaluados: ItemEvaluado[] = [];
  for (const seccion of CATALOGO_F120) {
    for (const item of seccion.items) {
      itemsEvaluados.push({
        codigo: item.codigo,
        calificacion: 'S',
      });
    }
  }
  // Marcar el ítem 9.3 como ER (En Riesgo) con observación
  const idx93 = itemsEvaluados.findIndex((i) => i.codigo === '9.3');
  if (idx93 >= 0) {
    itemsEvaluados[idx93] = {
      codigo: '9.3',
      calificacion: 'ER',
      observacion: 'No se realizó instrucción práctica / OPT de la tarea crítica de corte y reconexión — riesgo de quemadura eléctrica',
    };
  }

  return {
    tipo_formato: 'CHECKLIST_F120',
    codigo_documento: 'HSE-EL-F-120',
    version: '02',
    cabecera: {
      razon_social: PA_PERU_INFO.razon_social,
      ruc: PA_PERU_INFO.ruc,
      domicilio: PA_PERU_INFO.domicilio,
      tipo_actividad_economica: PA_PERU_INFO.tipo_actividad_economica,
      proyecto: 'Mantenimiento de Redes Eléctricas MT/BT — Enel Distribución Perú',
      actividad: 'Corte y Reconexión de Suministro Eléctrico',
      lugar: 'Av. Los Próceres - San Juan de Lurigancho, Lima',
      supervisor_encargado: 'Ing. Marco Antonio Gutiérrez Salinas',
      responsable_area: 'Ing. Roberto Carlos Mendoza Vega',
      fecha_inspeccion: '2026-10-05',
      hora_inspeccion: '09:30',
    },
    items_evaluados: itemsEvaluados,
    se_corrigieron_hallazgos: true,
    hallazgos_y_levantamiento: [
      {
        item_ref: '9.3',
        descripcion_hallazgo: 'El operario VÍCTOR ALFONSO LLERENA RÍOS realizaba actividad de corte y reconexión sin haber recibido instrucción práctica / OPT de la tarea crítica. Se identificó riesgo de quemadura eléctrica por contacto con conductores energizados durante la maniobra.',
        accion_levantamiento: 'Se detuvo la actividad de inmediato. Se realizó instrucción práctica en campo sobre el procedimiento seguro de corte y reconexión, enfatizando la verificación de ausencia de tensión, el uso correcto de guantes dieléctricos Clase 2 y la aplicación de las 5 Reglas de Oro de seguridad eléctrica. El operario demostró comprensión y se reincorporó a la actividad bajo supervisión directa. Oportunidad de mejora atendida satisfactoriamente.',
        no_requiere_foto_correccion: false,
      },
    ],
    modalidad_inspeccion: 'CON_ACOMPANAMIENTO',
    personal_involucrado: [
      {
        nombre_completo: 'VÍCTOR ALFONSO LLERENA RÍOS',
        cargo: 'OPERARIO DE CORTE Y RECONEXIÓN',
      },
    ],
    retroalimentacion_charla: {
      tema: 'Procedimiento seguro de Corte y Reconexión — Las 5 Reglas de Oro en Seguridad Eléctrica',
      hora_desde: '10:00',
      hora_hasta: '10:20',
      num_participantes: 4,
      nombre_expositor: 'Ing. Marco Antonio Gutiérrez Salinas',
      participantes: [
        { nombre: 'VÍCTOR ALFONSO LLERENA RÍOS', cargo: 'Operario de Corte y Reconexión' },
        { nombre: 'CARLOS ANDRÉS QUISPE MAMANI', cargo: 'Técnico Electricista' },
        { nombre: 'JUAN PABLO HUAMÁN FLORES', cargo: 'Ayudante Electricista' },
        { nombre: 'MIGUEL ÁNGEL TORRES RAMOS', cargo: 'Vigía de Seguridad' },
      ],
    },
    inspector_encargado: {
      nombre: 'Ing. Marco Antonio Gutiérrez Salinas',
      cargo: 'Supervisor HSE - P.A. Perú S.A.C.',
    },
  };
}
