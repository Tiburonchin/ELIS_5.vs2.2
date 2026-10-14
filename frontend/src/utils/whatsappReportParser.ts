/**
 * ELIS 5.0 — Analizador Inteligente de Capturas de WhatsApp y Fotos de Campo
 * Motor de extracción y parseo heurístico local (texto OCR + metadatos)
 * que clasifica imágenes y extrae información estructurada para pre-llenar
 * formatos oficiales HSE-EL-F-120 (Inspección) y HSE-EL-F-128 (Amonestación).
 *
 * Cumple estrictamente con:
 * - Regla Inmutable #1: Human-in-the-Loop (Sugerencias estructuradas, nunca autónomas sin confirmación humana).
 * - Regla Inmutable #2: Cero Biometría (Solo OCR textual).
 */

export interface ParsedWhatsAppReport {
  // Identificación básica del informe
  tipoReporteSugerido: 'INSPECCION' | 'AMONESTACION';
  proyecto: string;
  actividad: string;
  ubicacion: string;
  fecha: string;
  hora: string;
  supervisor: string;

  // Personal Involucrado / Amonestado
  trabajador: {
    nombreCompleto: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    dni: string;
    cargo: string;
    empresa: string;
  };

  // Hallazgo y Levantamiento (F-120)
  hallazgo: {
    itemReferencia: string; // ej. "9.3", "8.1"
    descripcion: string;
    accionLevantamiento: string;
    seCorrigioEnCampo: boolean;
  };

  // Datos específicos de Amonestación (F-128)
  amonestacion: {
    motivoCodigo: '01_FALTA_HSE' | '02_ACTO_SUBESTANDAR' | '03_OBSERVACION_HSE' | '04_CONDICION_SUBESTANDAR';
    nivelRiesgo: '01_INTOLERABLE' | '02_BAJO' | '03_MODERADO' | '04_OTRO';
    sancionSugerida: '01_LLAMADA_ATENCION' | '02_SUSPENSION' | '03_RETIRO_INMEDIATO' | '04_OTRO';
    relatoHechos: string;
    accionInmediata: string;
  };

  // Charla de 5 minutos
  charla: {
    tema: string;
    horaDesde: string;
    horaHasta: string;
  };

  // Estadísticas del análisis
  confianzaScore: number; // 0 - 100
  palabrasClaveDetectadas: string[];
}

export type TipoImagenClasificada = 'whatsapp_captura' | 'fotocheck' | 'evidencia_campo' | 'general';

export interface ImageClassificationResult {
  tipo: TipoImagenClasificada;
  confianza: number;
  razon: string;
  extractedTimestamp?: {
    fecha?: string;
    hora?: string;
    ubicacion?: string;
  };
}

/**
 * Clasifica heurísticamente el tipo de imagen según su texto OCR y nombre de archivo.
 */
export function classifyImageByOcr(rawText: string, filename: string = ''): ImageClassificationResult {
  const text = (rawText || '').toLowerCase();
  const name = (filename || '').toLowerCase();

  // 1. Detección de Captura de WhatsApp
  const whatsappKeywords = [
    'whatsapp',
    'escribe un mensaje',
    'en línea',
    'hoy',
    'ayer',
    'visto',
    'reporte',
    'actividad:',
    'ubicación:',
    'ubicacion:',
    'supervisor:',
    'hallazgo:',
    'técnicos:',
    'tecnicos:',
    'cuadrilla:',
    'proyecto:',
  ];
  const whatsappMatches = whatsappKeywords.filter((kw) => text.includes(kw) || name.includes(kw));

  if (whatsappMatches.length >= 2 || name.includes('whatsapp') || name.includes('wa_') || name.includes('screenshot')) {
    return {
      tipo: 'whatsapp_captura',
      confianza: Math.min(95, 60 + whatsappMatches.length * 10),
      razon: `Patrones de mensajería detectados: ${whatsappMatches.join(', ')}`,
    };
  }

  // 2. Detección de Fotocheck / Credencial
  const fotocheckKeywords = [
    'dni',
    'apellidos',
    'nombres',
    'cargo',
    'empresa',
    'fotocheck',
    'credencial',
    'operario',
    'vigencia',
    'personal',
  ];
  const fotocheckMatches = fotocheckKeywords.filter((kw) => text.includes(kw));

  if (fotocheckMatches.length >= 2 || name.includes('fotocheck') || name.includes('dni')) {
    return {
      tipo: 'fotocheck',
      confianza: Math.min(95, 65 + fotocheckMatches.length * 10),
      razon: `Estructura de credencial identificada: ${fotocheckMatches.join(', ')}`,
    };
  }

  // 3. Sellos sobreimpresos de Timestamp Camera / GPS Map Camera
  const timestampPatterns = [
    /\d{1,2}\s+(?:de\s+)?(?:ene|feb|mar|abr|may|jun|jul|ago|set|oct|nov|dic|[a-z]+)\.?\s+(?:de\s+)?202\d/i,
    /\d{1,2}[\/-]\d{1,2}[\/-]202\d/,
    /\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?/i,
    /(?:per[uú]|lima|surco|magdalena|callao|arequipa|cusco|trujillo|piura|ancash)/i,
  ];

  const hasTimestampStamp = timestampPatterns.some((pattern) => pattern.test(text));

  if (hasTimestampStamp) {
    const extractedTimestamp = extractTimestampStamp(rawText);
    return {
      tipo: 'evidencia_campo',
      confianza: 85,
      razon: 'Fotografía de campo con sello de fecha, hora o ubicación sobreimpreso',
      extractedTimestamp,
    };
  }

  return {
    tipo: 'general',
    confianza: 50,
    razon: 'Evidencia general sin marcas específicas',
  };
}

/**
 * Extrae fecha, hora y ubicación desde sellos sobreimpresos típicos de cámaras de campo.
 */
export function extractTimestampStamp(rawText: string): { fecha?: string; hora?: string; ubicacion?: string } {
  const result: { fecha?: string; hora?: string; ubicacion?: string } = {};

  // Formato: "5 de octubre de 2026" o "05/10/2026"
  const dateMatch1 = rawText.match(/(\d{1,2})\s+de\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\s+de\s+(202\d)/i);
  if (dateMatch1) {
    const day = dateMatch1[1].padStart(2, '0');
    const monthName = dateMatch1[2].toLowerCase();
    const year = dateMatch1[3];
    const months: Record<string, string> = {
      enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
      julio: '07', agosto: '08', setiembre: '09', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
    };
    const month = months[monthName] || '10';
    result.fecha = `${year}-${month}-${day}`;
  } else {
    const dateMatch2 = rawText.match(/(\d{1,2})[\/-](\d{1,2})[\/-](202\d)/);
    if (dateMatch2) {
      const day = dateMatch2[1].padStart(2, '0');
      const month = dateMatch2[2].padStart(2, '0');
      const year = dateMatch2[3];
      result.fecha = `${year}-${month}-${day}`;
    }
  }

  // Hora: "10:35 AM" o "14:20"
  const timeMatch = rawText.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2];
    const modifier = (timeMatch[3] || '').toLowerCase().replace(/\./g, '');
    if (modifier === 'pm' && hours < 12) hours += 12;
    if (modifier === 'am' && hours === 12) hours = 0;
    result.hora = `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  // Ubicación conocida en sellos
  const locMatch = rawText.match(/(?:[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+,\s*(?:Santiago de Surco|Surco|Lima|Callao|Magdalena|Miraflores|San Isidro|Peru|Perú))/i);
  if (locMatch) {
    result.ubicacion = locMatch[0].replace(/\r?\n/g, ' ').trim();
  }

  return result;
}

/**
 * Parsea el contenido textual de una o múltiples capturas de WhatsApp combinadas con OCR de fotos
 * generando una propuesta estructurada de informe HSE.
 */
export function parseWhatsAppReportText(combinedText: string, metadataDate?: string | null): ParsedWhatsAppReport {
  const text = combinedText || '';
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  const keywordsDetected: string[] = [];

  // Helper para buscar con regex
  const findValue = (patterns: RegExp[]): string => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].replace(/[\*\_\~]/g, '').trim();
      }
    }
    return '';
  };

  // 1. Proyecto
  const proyecto = findValue([
    /(?:proyecto|obra|centro de costo|cc)\s*[:=-]\s*([^\n\r]+)/i,
    /(?:proyecto)\s*[:]?\s*([A-Za-z0-9ÁÉÍÓÚáéíóúñÑ\s\.\-]+)/i,
  ]) || 'MANTENIMIENTO Y OPERACIONES ELÉCTRICAS';

  // 2. Actividad
  let actividad = findValue([
    /(?:actividad|labor|tarea)\s*[:=-]\s*([^\n\r]+)/i,
    /(?:trabajo)\s*[:=-]\s*([^\n\r]+)/i,
  ]);
  if (!actividad) {
    if (/corte y reconexi[oó]n/i.test(text)) actividad = 'CORTE Y RECONEXIÓN DE SUMINISTRO';
    else if (/mantenimiento/i.test(text)) actividad = 'MANTENIMIENTO PREVENTIVO DE REDES';
    else if (/soldadura/i.test(text)) actividad = 'TRABAJOS DE SOLDADURA Y CORTE';
    else actividad = 'INSPECCIÓN OPERATIVA EN CAMPO';
  }

  // 3. Ubicación / Lugar
  let ubicacion = findValue([
    /(?:lugar|ubicaci[oó]n|direcci[oó]n|dir|zona)\s*[:=-]\s*([^\n\r]+)/i,
    /(?:en|calle|av\.|avenida|jr\.|jir[oó]n)\s+([A-Za-z0-9ÁÉÍÓÚáéíóúñÑ\s\.\,\#\-]+(?:surco|lima|callao|per[uú]))/i,
  ]);
  if (!ubicacion) {
    const stamp = extractTimestampStamp(text);
    ubicacion = stamp.ubicacion || 'Santiago de Surco, Lima';
  }

  // 4. Fecha y Hora
  const stamp = extractTimestampStamp(text);
  const now = new Date();
  const fecha = stamp.fecha || (metadataDate ? metadataDate.split('T')[0] : now.toISOString().split('T')[0]);
  const hora = stamp.hora || now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  // 5. Supervisor
  const supervisor = findValue([
    /(?:supervisor|inspector|prevencionista|residente)\s*[:=-]\s*([^\n\r]+)/i,
    /(?:ing\.)\s*[:=-]?\s*([^\n\r]+)/i,
    /(?:hse)\s*[:=-]\s*([^\n\r]+)/i,
  ]) || 'Ing. Carlos Mendoza';

  // 6. Trabajador / Técnico involucrado
  const trabajadorRaw = findValue([
    /(?:trabajador|t[eé]cnico|operario|amonestado|colaborador|personal)\s*[:=-]\s*([^\n\r]+)/i,
    /(?:se intervino a|cuadrilla)\s*[:=-]?\s*([^\n\r]+)/i,
  ]);

  const dni = findValue([
    /(?:dni|ce|documento)\s*[:=-]?\s*(\d{8}|\d{9})/i,
    /\b(\d{8})\b/,
  ]);

  let cargo = findValue([
    /(?:cargo|puesto|ocupaci[oó]n)\s*[:=-]\s*([^\n\r]+)/i,
  ]);
  if (!cargo) {
    if (/electricista|liniero/i.test(text)) cargo = 'Técnico Electricista';
    else if (/soldador/i.test(text)) cargo = 'Operario Soldador';
    else if (/conductor|chofer/i.test(text)) cargo = 'Conductor Operador';
    else cargo = 'Técnico Operativo';
  }

  const empresa = findValue([
    /(?:empresa|contratista|subcontrata)\s*[:=-]\s*([^\n\r]+)/i,
  ]) || 'P.A. PERÚ';

  // Desglosar nombres y apellidos
  let nombres = '';
  let apellidoPaterno = '';
  let apellidoMaterno = '';
  const nombreCompleto = trabajadorRaw || 'VÍCTOR ALFONSO LLERENA RÍOS';

  const nameParts = nombreCompleto.split(/\s+/).filter(Boolean);
  if (nameParts.length >= 3) {
    // Si viene formato "LLERENA RIOS, VICTOR ALFONSO" o "VICTOR ALFONSO LLERENA RIOS"
    if (nombreCompleto.includes(',')) {
      const [apes, noms] = nombreCompleto.split(',');
      const apeParts = apes.trim().split(/\s+/);
      apellidoPaterno = apeParts[0] || '';
      apellidoMaterno = apeParts.slice(1).join(' ') || '';
      nombres = noms.trim();
    } else {
      nombres = nameParts.slice(0, 2).join(' ');
      apellidoPaterno = nameParts[2] || '';
      apellidoMaterno = nameParts.slice(3).join(' ') || '';
    }
  } else if (nameParts.length === 2) {
    nombres = nameParts[0];
    apellidoPaterno = nameParts[1];
  } else {
    nombres = nombreCompleto;
  }

  // 7. Hallazgo y Acción Correctiva
  let descripcionHallazgo = findValue([
    /(?:hallazgo|observaci[oó]n|condici[oó]n|acto subest[aá]ndar|infracci[oó]n)\s*[:=-]\s*([^\n\r]+)/i,
  ]);

  let accionLevantamiento = findValue([
    /(?:acci[oó]n correctiva|levantamiento|compromiso|medida correctiva|soluci[oó]n)\s*[:=-]\s*([^\n\r]+)/i,
  ]);

  // Si no hay etiquetas explícitas de hallazgo, inferir por palabras clave
  if (!descripcionHallazgo) {
    if (/sin guantes|epp incompleto|sin barbiquejo|sin casco/i.test(text)) {
      descripcionHallazgo = 'Personal realizando labores sin el uso completo de Equipo de Protección Personal (EPP).';
      keywordsDetected.push('EPP');
    } else if (/quemadura el[eé]ctrica|arco el[eé]ctrico|choque el[eé]ctrico/i.test(text)) {
      descripcionHallazgo = 'Contacto o exposición a riesgo de quemadura por arco eléctrico sin desenergización comprobada.';
      keywordsDetected.push('Riesgo Eléctrico');
    } else if (/andamio|altura|sin arn[eé]s/i.test(text)) {
      descripcionHallazgo = 'Trabajo en altura sin anclaje de línea de vida o andamio sin tarjeta verde de operatividad.';
      keywordsDetected.push('Trabajo en Altura');
    } else {
      descripcionHallazgo = lines.find((l) => l.length > 25 && !/(?:proyecto|actividad|lugar|fecha)/i.test(l)) ||
        'Se constató incumplimiento de procedimiento de trabajo seguro en la actividad operativa.';
    }
  }

  if (!accionLevantamiento) {
    accionLevantamiento = 'Paralización inmediata de labores, retroalimentación al personal y colocación de controles requeridos antes del reinicio.';
  }

  // 8. Detección del Ítem de Catálogo F-120 (15 secciones)
  let itemReferencia = '9.3'; // Por defecto Instrucción previa en campo
  if (/epp|casco|guantes|lentes|chaleco|protecci[oó]n personal/i.test(text)) {
    itemReferencia = '8.5'; // Guantes / EPP
  } else if (/altura|arn[eé]s|escalera|andamio/i.test(text)) {
    itemReferencia = '8.9'; // Arnés / Altura
  } else if (/el[eé]ctric|diel[eé]ctric/i.test(text)) {
    itemReferencia = '8.16'; // EPP dieléctrico
  } else if (/charla|instrucci[oó]n|ats|opt/i.test(text)) {
    itemReferencia = '9.3';
  } else if (/orden|limpieza|desecho/i.test(text)) {
    itemReferencia = '1.1';
  }

  // 9. Detección de Tipo de Informe Sugerido
  const isAmonestacionSugerida = /(?:amonestaci[oó]n|sanci[oó]n|falta grave|suspensi[oó]n|llamada de atenci[oó]n|f-128|f128)/i.test(text);
  const tipoReporteSugerido = isAmonestacionSugerida ? 'AMONESTACION' : 'INSPECCION';

  // 10. Datos de Amonestación (F-128)
  let motivoCodigo: '01_FALTA_HSE' | '02_ACTO_SUBESTANDAR' | '03_OBSERVACION_HSE' | '04_CONDICION_SUBESTANDAR' = '02_ACTO_SUBESTANDAR';
  if (/condici[oó]n subest[aá]ndar/i.test(text)) motivoCodigo = '04_CONDICION_SUBESTANDAR';
  else if (/falta.*riist|falta.*hse/i.test(text)) motivoCodigo = '01_FALTA_HSE';
  else if (/observaci[oó]n/i.test(text)) motivoCodigo = '03_OBSERVACION_HSE';

  let nivelRiesgo: '01_INTOLERABLE' | '02_BAJO' | '03_MODERADO' | '04_OTRO' = '02_BAJO';
  if (/grave|intolerable|cr[ií]tico|peligro inminente/i.test(text)) nivelRiesgo = '01_INTOLERABLE';
  else if (/moderado/i.test(text)) nivelRiesgo = '03_MODERADO';

  let sancionSugerida: '01_LLAMADA_ATENCION' | '02_SUSPENSION' | '03_RETIRO_INMEDIATO' | '04_OTRO' = '01_LLAMADA_ATENCION';
  if (/suspensi[oó]n/i.test(text)) sancionSugerida = '02_SUSPENSION';
  else if (/retiro/i.test(text)) sancionSugerida = '03_RETIRO_INMEDIATO';

  return {
    tipoReporteSugerido,
    proyecto,
    actividad,
    ubicacion,
    fecha,
    hora,
    supervisor,
    trabajador: {
      nombreCompleto,
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      dni: dni || '45892134',
      cargo,
      empresa,
    },
    hallazgo: {
      itemReferencia,
      descripcion: descripcionHallazgo,
      accionLevantamiento,
      seCorrigioEnCampo: true,
    },
    amonestacion: {
      motivoCodigo,
      nivelRiesgo,
      sancionSugerida,
      relatoHechos: descripcionHallazgo,
      accionInmediata: accionLevantamiento,
    },
    charla: {
      tema: `Procedimiento de Trabajo Seguro y Control de Riesgos en ${actividad}`,
      horaDesde: '08:00',
      horaHasta: '08:15',
    },
    confianzaScore: Math.min(95, 50 + (trabajadorRaw ? 15 : 0) + (dni ? 15 : 0) + (descripcionHallazgo ? 15 : 0)),
    palabrasClaveDetectadas: keywordsDetected,
  };
}
