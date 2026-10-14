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
    nombre: "INSTALACION/ESTRUCTURA/ALMACEN",
    items: [
      { codigo: "1.1", descripcion: "El suelo/piso y pasillo se encuentra limpio, sin grietas y sin obstáculos." },
      { codigo: "1.2", descripcion: "Las paredes se encuentran limpias y sin grietas." },
      { codigo: "1.3", descripcion: "Las ventanas se encuentran limpias, sin fisuras o rotas." },
      { codigo: "1.4", descripcion: "Las escaleras se encuentran limpias y sin obstáculos" },
      { codigo: "1.5", descripcion: "Los peldaños de las escaleras tienen cinta antideslizante (adheridas y sin roturas)" },
      { codigo: "1.6", descripcion: "El techo se encuentra, se encuentran libre, grietas o sin objetos colgando" },
      { codigo: "1.7", descripcion: "Las herramientas o equipos se encuentran clasificados y ordenados." },
      { codigo: "1.8", descripcion: "Las instalaciones eléctricas como son: interruptores, tomacorrientes y luminarias, se encuentran sin daño o alteración." },
      { codigo: "1.9", descripcion: "La zona designada al grupo electrógeno cuenta con Rombo NFPA y con Kit de contención de derrames" },
      { codigo: "1.10", descripcion: "El piso donde se encuentran los equipos de poder de combustible se encuentra en piso de cemento pulido y no tiene grietas ni rajaduras o bandeja antiderrames." },
      { codigo: "1.11", descripcion: "La zona de almacenamiento de residuos peligrosos se encuentra impermeabilizada, ventilada y techada" },
      { codigo: "1.12", descripcion: "Las bobinas de cable con grasa se encuentran sin presencia de pérdidas de grasa visible sobre el piso" },
      { codigo: "1.13", descripcion: "Personal cuenta con medios de comunicación (teléfono) en caso de emergencia." },
      { codigo: "1.14", descripcion: "El sistema de control para la iluminación tiene buen funcionamiento" },
      { codigo: "1.15", descripcion: "Los gabinetes, estantes, archivadores se encuentran anclados a la pared." },
      { codigo: "1.16", descripcion: "La vía de tránsito peatonal se encuentra libre de obstáculos" },
      { codigo: "1.17", descripcion: "Los cables de computadoras, impresoras, etc., están atados y ordenados" },
    ],
  },
  {
    id: 2,
    nombre: "PREVENCIÓN Y CONTROL DE INCENDIOS Y PRIMEROS AUXILIOS",
    items: [
      { codigo: "2.1", descripcion: "Los extintores cuentan con tarjeta de inspección y registro mensual" },
      { codigo: "2.2", descripcion: "Los extintores cuentan con precinto de seguridad sin alteración" },
      { codigo: "2.3", descripcion: "Los gabinetes de extintores se encuentran sin grietas, sin oxido y sin corrosión" },
      { codigo: "2.4", descripcion: "Los extintores se encuentran libres de obstáculos para ser retirados y utilizados" },
      { codigo: "2.5", descripcion: "Los equipos contra incendio cuentan con señalética y son visibles" },
      { codigo: "2.6", descripcion: "La señalética de los extintores se encuentra sin daño o alteración." },
      { codigo: "2.7", descripcion: "La señalética de evacuación se encuentra sin daño o alteración" },
      { codigo: "2.8", descripcion: "Se cuenta con un mapa de ruta de evacuación y es legible" },
      { codigo: "2.9", descripcion: "El botiquín se encuentra con tarjeta de inspección y registro mensual" },
      { codigo: "2.10", descripcion: "Las medicinas del botiquín registran su vigencia en el envase o empaque" },
      { codigo: "2.11", descripcion: "Las salidas de emergencia o vías de evacuación se encuentran despejadas y señalizadas" },
      { codigo: "2.12", descripcion: "Se cuenta con iluminación de emergencia en las vías de evacuación" },
      { codigo: "2.13", descripcion: "La camilla se encuentra señalizada y limpia" },
    ],
  },
  {
    id: 3,
    nombre: "COMEDOR",
    items: [
      { codigo: "3.1", descripcion: "Las sillas y mesas se encuentran limpias" },
      { codigo: "3.2", descripcion: "Los pisos se encuentran limpios." },
      { codigo: "3.3", descripcion: "Los contenedores de residuos orgánicos se encuentran en un área alejada del almacenamiento de alimentos" },
      { codigo: "3.4", descripcion: "Las tomas y corrientes del comedor se encuentran en buen estado." },
    ],
  },
  {
    id: 4,
    nombre: "MEDIO AMBIENTE",
    items: [
      { codigo: "4.1", descripcion: "Se cuenta con contenedores y bolsas de colores para la segregación de residuos sólidos." },
      { codigo: "4.2", descripcion: "Los contenedores de residuos peligrosos se encuentran sobre una superficie que impida el contacto directo con el suelo." },
      { codigo: "4.3", descripcion: "Los contenedores de residuos se encuentran rotulados y con tapas." },
      { codigo: "4.4", descripcion: "Los contenedores de residuos se encuentran en zonas definidas para ellos y con techo de protección que evite su deterioro" },
      { codigo: "4.5", descripcion: "El material excedente/ desmonte acopiado ha sido regado o cubierto con malla para evitar la dispersión de material particulado" },
      { codigo: "4.6", descripcion: "Los empleados segregan y clasifican los residuos sólidos en contenedores de colores" },
    ],
  },
  {
    id: 5,
    nombre: "PRODUCTOS QUÍMICOS",
    items: [
      { codigo: "5.1", descripcion: "Los productos químicos se encuentran rotulados." },
      { codigo: "5.2", descripcion: "El lugar de almacenamiento de los productos químicos se encuentra con señalética, cercado y con ventilación." },
      { codigo: "5.3", descripcion: "El lugar de almacenamiento de productos químicos cuenta con una superficie impermeabilizada o libre de obstáculos." },
      { codigo: "5.4", descripcion: "Las sustancias han sido almacenadas considerando el cuadro de incompatibilidad con otras sustancias" },
      { codigo: "5.5", descripcion: "Los recipientes de productos químicos e inflamables se encuentran señalizados (rombo NFPA, Sistema SGA símbolos de peligro)" },
      { codigo: "5.6", descripcion: "Las hojas MSDS se encuentran en español, legibles y en el lugar de almacenamiento." },
      { codigo: "5.7", descripcion: "Se cuenta con un Kit de contingencia antiderrame y libre de obstrucciones" },
      { codigo: "5.8", descripcion: "Las áreas donde se almacenan materiales inflamables o donde las operaciones presentan riesgo de incendio cuentan con avisos de “No fumar, peligro de incendio”" },
    ],
  },
  {
    id: 6,
    nombre: "VESTIDORES Y DUCHAS",
    items: [
      { codigo: "6.1", descripcion: "Los casilleros se encuentran sin signos de corrosión" },
      { codigo: "6.2", descripcion: "Los pasadizos en vestuarios se mantienen limpios y sin obstáculos" },
      { codigo: "6.3", descripcion: "Las duchas se encuentran limpias y libres de hongos" },
      { codigo: "6.4", descripcion: "Los accesorios de ducha como: grifo toallero, jabonera, se encuentran en buenas condiciones libres de hongos y oxido" },
    ],
  },
  {
    id: 7,
    nombre: "ZONA DE TRABAJO",
    items: [
      { codigo: "7.1", descripcion: "El área de trabajo se encuentra cercado con mallas, parantes y cinta de señalización" },
      { codigo: "7.2", descripcion: "El área de trabajo cuenta con señales verticales preventivas y/o restrictivas" },
      { codigo: "7.3", descripcion: "La zona de trabajo se encuentra libre de piedras, botellas, maderas, objetos punzantes en un radio mínimo de 10 metros" },
      { codigo: "7.4", descripcion: "La vía de tránsito peatonal se encuentra definida y libre de obstáculos" },
      { codigo: "7.5", descripcion: "La superficie de terreno donde se realiza actividades ha sido humedecida para evitar emisión de material particulado" },
      { codigo: "7.6", descripcion: "Los letreros de señalización respetan la distancia correspondiente de un letrero a otro." },
    ],
  },
  {
    id: 8,
    nombre: "EQUIPOS DE PROTECCIÓN PERSONAL",
    items: [
      { codigo: "8.1", descripcion: "El empleado ha completado el check list de inspección de equipos de protección personal y se registró en el mismo." },
      { codigo: "8.2", descripcion: "El empleado utiliza los equipos de protección personal apropiados para la actividad que ejecutar." },
      { codigo: "8.3", descripcion: "El empleado utiliza guantes dieléctricos con guantes protectores de cuero cuando interviene en circuitos eléctricos energizados." },
      { codigo: "8.4", descripcion: "El empleado utiliza protección facial contra relámpago de arco cuando interviene en circuitos eléctricos energizados" },
      { codigo: "8.5", descripcion: "El empleado utiliza balaclava cuando lo establece el procedimiento de trabajo en circuitos eléctricos energizados" },
      { codigo: "8.6", descripcion: "El empleado utiliza ropa contra relámpago de arco sin daños (como cortes o manchados de químicos) al manipular circuitos eléctricos energizados" },
      { codigo: "8.7", descripcion: "El empleado utiliza sistema personal de protección contra caídas (arnés de seguridad, estrobo de posicionamiento, línea con absorbedor de energía y/o bloque retráctil, eslinga o punto de anclaje) al realizar actividades a una altura mayor a 1.8 metros" },
      { codigo: "8.8", descripcion: "El empleado utiliza casco de seguridad clase E con certificación ANSI Z89.1; asimismo, complementa su utilización con el barbiquejo" },
      { codigo: "8.9", descripcion: "El empleado utiliza calzado de seguridad con puntera reforzada con certificación ASTM F 2412/ASTM F 2413 o NTP ISO 20345" },
      { codigo: "8.10", descripcion: "El empleado utiliza guantes de protección con certificación EN 388 o ANSI/ISEA 105 al manipular por ejemplo cascotes, otros." },
      { codigo: "8.11", descripcion: "El empleado utiliza ropa de trabajo convencional cuando realiza actividades operativas que no involucran trabajos en circuitos eléctricos energizados." },
      { codigo: "8.12", descripcion: "El empleado utiliza protección visual con certificación ANSI Z87.1+ cuando realiza labores operativas" },
      { codigo: "8.13", descripcion: "El empleado utiliza chaleco reflectante con certificación ANSI SEA 107 o NTP ISO 20471 al exponerse al tránsito vehicular" },
      { codigo: "8.14", descripcion: "El empleado utiliza protección respiratoria con certificación NIOSH al exponerse a gases o polvo" },
      { codigo: "8.15", descripcion: "El empleado utiliza careta de protección facial con certificación ANSI Z87.1 o EN ISO 16321-1 cuando se expone a la proyección de partículas y líquidos" },
      { codigo: "8.16", descripcion: "El empleado utiliza protectores auditivos NRR 23dB(A) al exponerse al ruido del entorno de trabajo" },
      { codigo: "8.17", descripcion: "El empleado utiliza tapa nuca al exponerse a la radiación solar, bloqueador solar y repelente contra insectos" },
    ],
  },
  {
    id: 9,
    nombre: "INSTRUCCIÓN PREVIA EN CAMPO",
    items: [
      { codigo: "9.1", descripcion: "El empleado porta credencial de identificación" },
      { codigo: "9.2", descripcion: "El registro de instrucción previa en campo (cuando aplique) cuenta con la validación del responsable en el área de trabajo." },
      { codigo: "9.3", descripcion: "El registro presente en la actividad de trabajo cuenta con los peligro y controles de acuerdo a la fuente de energía que los mueve." },
      { codigo: "9.4", descripcion: "El registro cuenta con los aspectos ambientales de la actividad y sus medidas de control." },
      { codigo: "9.5", descripcion: "El registro cuenta con la firma de todos los empleados que se encuentran en la actividad." },
      { codigo: "9.6", descripcion: "El registro cuenta con los números de emergencia en caso de incidente y el centro de atención más cercano." },
      { codigo: "9.7", descripcion: "Se cuenta con orden o autorización para realizar las actividades" },
    ],
  },
  {
    id: 10,
    nombre: "PROCEDIMIENTOS",
    items: [
      { codigo: "10.1", descripcion: "Se cuenta con documentación en la zona de trabajo de forma virtual o física." },
      { codigo: "10.2", descripcion: "Los documentos utilizados para realizar la actividad se encuentran vigentes." },
      { codigo: "10.3", descripcion: "Se dispone de planos o guías (planos: eléctricos, gas, redes de fibra) al realizar trabajos de excavación." },
    ],
  },
  {
    id: 11,
    nombre: "MÁQUINAS, EQUIPOS Y HERRAMIENTAS",
    items: [
      { codigo: "11.1", descripcion: "Los equipos de poder (vibrador de concreto, máquina cortadora de pavimento, compresora, grupo electrógeno, etc.) se encuentran con su registro de verificación de pre uso y con su bandeja contra derrames." },
      { codigo: "11.2", descripcion: "El ahuyentador de canes se encuentra cargado y a la mano para su uso" },
      { codigo: "11.3", descripcion: "Los equipos de poder cuentan con su manual del fabricante en la zona de trabajo" },
      { codigo: "11.4", descripcion: "Los equipos (revelador de tensión, pinza volta perimétrica, pértiga aislada, línea puesta a tierra) cuentan con su registro de inspección de pre uso." },
      { codigo: "11.5", descripcion: "Las herramientas de uso manual (picos, palas, barreta, otros) cuentan con su registro de inspección de pre uso y su cinta inspección del mes" },
      { codigo: "11.6", descripcion: "Los equipos utilizados para cortar (amoladora, otros) poseen guardas de protección." },
      { codigo: "11.7", descripcion: "Los equipos defectuosos han sido etiquetados y retirados de la zona de trabajo." },
      { codigo: "11.8", descripcion: "Las escaleras cuentan con sticker (etiqueta) de revisión semestral vigente." },
      { codigo: "11.9", descripcion: "Las escaleras cuentan con su registro de inspección de pre uso." },
      { codigo: "11.10", descripcion: "El grupo electrógeno se encuentra sin pérdida de combustible, grasa o aceite y con su puesta a tierra." },
    ],
  },
  {
    id: 12,
    nombre: "VEHICULOS (PESADO y LIVIANO)",
    items: [
      { codigo: "12.1", descripcion: "El vehículo cuenta con documentación exigida por el Reglamento nacional de tránsito (SOAT, Tarjeta de propiedad y revisión técnica)" },
      { codigo: "12.2", descripcion: "El vehículo cuenta con asientos y su número está en función a lo que autoriza la tarjeta de propiedad vehicular" },
      { codigo: "12.3", descripcion: "El vehículo cuenta con cinturones de seguridad para cada asiento" },
      { codigo: "12.4", descripcion: "El vehículo cuenta con extintor operativo y con su inspección semestral" },
      { codigo: "12.5", descripcion: "El vehículo cuenta con botiquín de primeros auxilios y con su inspección semestral." },
      { codigo: "12.6", descripcion: "El vehículo tiene instalados la cantidad de tacos de madera o metal (según aplique) cuando se encuentra estacionado o en una pendiente." },
      { codigo: "12.7", descripcion: "El vehículo tiene instalados los conos de seguridad cuando se encuentra estacionado en la vía pública" },
      { codigo: "12.8", descripcion: "El vehículo cuenta con un kit de contingencia ante derrames" },
      { codigo: "12.9", descripcion: "El conductor realizó la inspección de la unidad registrando los datos en su check list." },
    ],
  },
  {
    id: 13,
    nombre: "EQUIPO DE IZAJE Y GRÚA",
    items: [
      { codigo: "13.1", descripcion: "Los equipos de izaje cuentan con registro de inspección de pre uso realizada por el operador de grúa" },
      { codigo: "13.2", descripcion: "El brazo hidráulico y/o grúa cuenta con certificado de operatividad emitido por el fabricante autorizado" },
      { codigo: "13.3", descripcion: "La canastilla cuenta con un registro de inspección de pre uso" },
      { codigo: "13.4", descripcion: "La canastilla cuenta con certificado de operatividad emitido por el fabricante o centro autorizado" },
      { codigo: "13.5", descripcion: "La tabla o diagrama de carga se encuentra disponible en la grúa" },
      { codigo: "13.6", descripcion: "Las eslingas y aparejos se encuentran en buenas condiciones y correctamente almacenadas." },
      { codigo: "13.7", descripcion: "Se a verificado el uso la capacidad de carga de la grúa y eslingas para el levantamiento de la carga." },
    ],
  },
  {
    id: 14,
    nombre: "EXCAVACIONES, HOYOS, ZANJAS",
    items: [
      { codigo: "14.1", descripcion: "La excavación, hoyo o zanja cuenta con entibado o métodos de protección equivalentes (taludes, banquetas o escudos) cuando su profundidad es mayor o igual a 1.5m." },
      { codigo: "14.2", descripcion: "En caso que se dejen excavaciones abiertas, mientras no se trabaje en ellas, éstas se protegerán con tableros de madera con letreros que indiquen “NO PISAR”" },
      { codigo: "14.3", descripcion: "Para el ingreso y salida de la excavación se cuenta con escalera (Madera o fibra de vidrio)." },
      { codigo: "14.4", descripcion: "La ubicación de la escalera dentro de la zanja se encuentra a una distancia máxima de 7 metros de cada trabajador" },
      { codigo: "14.5", descripcion: "La excavación de profundidad de 1.50 m, tiene personal que cuenta con arnés y línea de vida" },
      { codigo: "14.6", descripcion: "Las excavaciones de zanja se encuentran señalizadas y delimitadas con parantes, cintas, mallas y carteles de entrada y salida para el control de personas." },
      { codigo: "14.7", descripcion: "En las excavaciones de zanja se cuenta con una estación de emergencia, vehículo de contingencia y estación para segregación de residuos" },
      { codigo: "14.8", descripcion: "Para la excavación de zanja, se cuenta con lavaojos con solución medica del lavaojos es crucial para la protección ocular en situaciones de emergencia" },
      { codigo: "14.9", descripcion: "Para la compactación de zanja se tiene equipos vibropisonadores con su certificado de operatividad, operador capacitado, bandeja derrame del equipo y tanque de combustible con rombo NFPA" },
      { codigo: "14.10", descripcion: "El material, producto de excavación, a no menos de 2.00 m del borde de la excavación. Cuando no se puede cumplir esta distancia (por falta de espacio) entonces se puede colocar el material temporalmente a menos de 2 m, siempre y cuando esté restringido el ingreso de personal a la zona de trabajo y a la excavación." },
      { codigo: "14.11", descripcion: "Al terminar la jornada, esta señalizada la zona de trabajo para evitar el ingreso de terceros, colocando un cerco de malla y cinta señalizadora a 1m de distancia (mínimo) del borde de la excavación (o según recomendaciones del estudio de suelos)." },
      { codigo: "14.12", descripcion: "Antes de realizar excavaciones se revisaron los planos de interferencia y se cuenta con ellos en obra" },
      { codigo: "14.13", descripcion: "En caso de uso retroexcavadora para excavación de zanja se mantiene al personal a una distancia mínima de 1.5 veces la longitud del brazo extendido de la retroexcavadora o excavadora en operación" },
    ],
  },
  {
    id: 15,
    nombre: "Riesgos Psicosociales",
    items: [
      { codigo: "15.1.", descripcion: "Los trabajadores se encuentran en condiciones físicas o mentales (sin daños Psicológicos o emocional) aptos para trabajar." },
      { codigo: "15.2", descripcion: "Los trabajadores desempeñan su trabajo cumpliendo las políticas de la empresa P.A. Perú (Anticorrupción, alcohol y drogas, seguridad vial, HSEQ, Energética y Stop Work)" },
    ],
  },
];

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
      observacion: 'El operario no había repasado la actuación ante una quemadura eléctrica. Se identifica oportunidad de mejora en conocimiento preventivo.',
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
      proyecto: 'CORTE Y RECONEXIÓN, LECTURA Y REPARTO DE SUMINISTROS',
      actividad: 'CORTE Y RECONEXIÓN',
      lugar: 'CHACARILLAS',
      supervisor_encargado: 'DIEGO PAREDES',
      responsable_area: 'MIGUEL OBLITAS',
      fecha_inspeccion: '05/10/2026',
      hora_inspeccion: '06:30',
    },
    items_evaluados: itemsEvaluados,
    se_corrigieron_hallazgos: true,
    hallazgos_y_levantamiento: [
      {
        item_ref: '9.3 - Instrucción previa en campo: refuerzo sobre actuación ante quemadura eléctrica.',
        descripcion_hallazgo: 'Durante la supervisión se identificó que el operario no había repasado qué hacer ante una quemadura eléctrica. Se registra como oportunidad de mejora de conocimiento.',
        accion_levantamiento: '9.3 - Se realiza retroalimentación inmediata sobre actuación ante quemadura eléctrica, considerando el antecedente de evento en la sucursal. OPORTUNIDAD DE MEJORA ATENDIDA.',
        no_requiere_foto_correccion: true,
      },
    ],
    modalidad_inspeccion: 'SIN_ACOMPANAMIENTO',
    personal_involucrado: [
      {
        nombre_completo: 'VÍCTOR ALFONSO LLERENA RÍOS',
        cargo: 'OPERARIO DE CORTE Y RECONEXIÓN',
      },
    ],
    retroalimentacion_charla: {
      tema: 'Actuación ante quemadura eléctrica y respuesta inicial frente a emergencias eléctricas.',
      hora_desde: '06:45',
      hora_hasta: '07:05',
      num_participantes: 1,
      nombre_expositor: 'ERICK ALEXANDER RAMOS TRUJILLO',
      participantes: [
        { nombre: 'VÍCTOR ALFONSO LLERENA RÍOS', cargo: 'OPERARIO DE CORTE Y RECONEXIÓN' },
      ],
    },
    inspector_encargado: {
      nombre: 'ERICK ALEXANDER RAMOS TRUJILLO',
      cargo: 'SUPERVISOR HSE',
    },
  };
}

export function crearDemoF128Amonestacion(): FormatoAmonestacionF128 {
  return {
    tipo_formato: 'HSE_EL_F_128',
    codigo_documento: 'HSE-EL-F-128',
    version: '01',
    amonestado: {
      apellidos_nombres: 'QUISPE MAMANI, JUAN CARLOS',
      dni: '45892134',
      cargo: 'OPERARIO ELECTRICISTA',
      ubicacion: 'SEDE CENTRAL CHACARILLAS',
      empresa: PA_PERU_INFO.razon_social,
      fecha: '05/10/2026',
      hora: '08:45',
    },
    responsables: {
      capataz_jefe_cuadrilla: 'DIEGO PAREDES',
      ing_responsable: 'MIGUEL OBLITAS',
      actividad_trabajo: 'CORTE Y RECONEXIÓN DE SUMINISTROS',
    },
    relato_razon: 'Durante la ejecución de maniobras de corte de suministro eléctrico en acometida domiciliaria, el trabajador omitió el uso de guantes dieléctricos normados e intervino la caja de protección sin verificar previamente la ausencia de tensión, contraviniendo el estándar operacional y las 5 Reglas de Oro.',
    motivo_codigo: '02_ACTO_SUBESTANDAR',
    detalle_motivo: 'Incumplimiento de procedimiento PETS-EL-04: Maniobra sin EPP dieléctrico obligatorio en circuito energizado de baja tensión.',
    nivel_riesgo: '01_INTOLERABLE',
    otro_riesgo: '',
    accion_inmediata: 'Se procedió a la paralización inmediata de la labor. Se retiró al colaborador de la zona de riesgo eléctrico, se verificó el estado físico y se impartió retroalimentación correctiva obligatoria antes de autorizar cualquier reincorporación.',
    sancion_codigo: '01_LLAMADA_ATENCION',
    dias_suspension: undefined,
    otra_sancion: '',
    validacion: {
      realizado_por: {
        nombre: 'ERICK ALEXANDER RAMOS TRUJILLO',
        cargo: 'SUPERVISOR HSE',
      },
      aprobado_por: {
        nombre: 'MIGUEL OBLITAS',
        cargo: 'ING. RESIDENTE DE OBRA',
      },
      aceptado_por: {
        nombre: 'QUISPE MAMANI, JUAN CARLOS',
        cargo: 'OPERARIO ELECTRICISTA',
      },
    },
  };
}
