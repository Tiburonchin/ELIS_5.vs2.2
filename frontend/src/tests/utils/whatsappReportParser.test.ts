import { describe, it, expect } from 'vitest';
import {
  classifyImageByOcr,
  extractTimestampStamp,
  parseWhatsAppReportText,
} from '../../utils/whatsappReportParser';

describe('whatsappReportParser — Motor Heurístico y Extractor Inteligente', () => {
  describe('classifyImageByOcr', () => {
    it('debe clasificar correctamente una captura de pantalla de chat de WhatsApp', () => {
      const textChat = `
        10:45 AM
        Reporte HSE - Cuadrilla 4
        Actividad: Corte y reconexión en media tensión
        Supervisor: Ing. Carlos Mendoza
        Lugar: Av. Benavides 1240, Santiago de Surco, Lima
        Trabajador: Llerena Rios Victor Alfonso
        DNI: 70823419
        Hallazgo: Personal operando sin guantes dieléctricos normados.
        Acción correctiva: Paralización inmediata y suministro de EPP clase 0.
      `;
      const res = classifyImageByOcr(textChat, 'screenshot_whatsapp_20261005.jpg');
      expect(res.tipo).toBe('whatsapp_captura');
      expect(res.confianza).toBeGreaterThanOrEqual(70);
    });

    it('debe clasificar un fotocheck o credencial laboral', () => {
      const textFotocheck = `
        FOTOCHECK DE IDENTIFICACIÓN
        APELLIDOS: QUISPE MAMANI
        NOMBRES: JUAN CARLOS
        DNI: 45892134
        CARGO: ELECTRICISTA LINÍERO
        EMPRESA: P.A. PERÚ S.A.C.
      `;
      const res = classifyImageByOcr(textFotocheck, 'credencial_juan.png');
      expect(res.tipo).toBe('fotocheck');
      expect(res.confianza).toBeGreaterThanOrEqual(65);
    });

    it('debe clasificar una fotografía de campo con sello de Timestamp Camera / GPS Camera', () => {
      const textSello = `
        5 de octubre de 2026, 14:35:10
        Santiago de Surco, Peru
        GPS Map Camera
      `;
      const res = classifyImageByOcr(textSello, 'IMG_20261005_143510.jpg');
      expect(res.tipo).toBe('evidencia_campo');
      expect(res.extractedTimestamp?.fecha).toBe('2026-10-05');
      expect(res.extractedTimestamp?.hora).toBe('14:35');
    });
  });

  describe('extractTimestampStamp', () => {
    it('extrae fecha en formato español con nombre de mes', () => {
      const stamp = extractTimestampStamp('Foto tomada el 14 de octubre de 2026 a las 09:20 AM en Lima');
      expect(stamp.fecha).toBe('2026-10-14');
      expect(stamp.hora).toBe('09:20');
    });

    it('extrae fecha en formato numérico dd/mm/aaaa', () => {
      const stamp = extractTimestampStamp('05/10/2026 15:45:00 Santiago de Surco, Peru');
      expect(stamp.fecha).toBe('2026-10-05');
      expect(stamp.hora).toBe('15:45');
      expect(stamp.ubicacion).toContain('Santiago de Surco');
    });
  });

  describe('parseWhatsAppReportText — Transformación a F-120 y F-128', () => {
    const rawWhatsAppReport = `
      *REPORTE OPERATIVO HSE - P.A. PERÚ*
      *Proyecto:* Obras Eléctricas Sur
      *Actividad:* Mantenimiento y corte en subestación
      *Lugar:* Av. Angamos Este 1850, Surco, Lima
      *Supervisor:* Ing. Carlos Mendoza
      *Trabajador:* VÍCTOR ALFONSO LLERENA RÍOS
      *DNI:* 70823419
      *Cargo:* Técnico Electricista
      *Empresa:* P.A. PERÚ
      *Hallazgo:* Se constató que el personal no portaba guantes dieléctricos ni careta facial durante la maniobra.
      *Acción correctiva:* Se suspendió la maniobra, se brindó charla de retroalimentación de 5 minutos y se suministró el EPP correspondiente antes de reanudar.
    `;

    it('genera la propuesta estructurada para HSE-EL-F-120 (Inspección)', () => {
      const parsed = parseWhatsAppReportText(rawWhatsAppReport, '2026-10-05');
      
      expect(parsed.tipoReporteSugerido).toBe('INSPECCION');
      expect(parsed.proyecto).toContain('Obras Eléctricas Sur');
      expect(parsed.actividad).toContain('Mantenimiento y corte en subestación');
      expect(parsed.ubicacion).toContain('Surco');
      expect(parsed.supervisor).toContain('Carlos Mendoza');
      
      // Personal involucrado
      expect(parsed.trabajador.nombreCompleto).toBe('VÍCTOR ALFONSO LLERENA RÍOS');
      expect(parsed.trabajador.dni).toBe('70823419');
      expect(parsed.trabajador.cargo).toBe('Técnico Electricista');

      // Hallazgo mapeado a sección de EPP (8.5 o 8.16)
      expect(parsed.hallazgo.itemReferencia).toMatch(/^(8\.5|8\.16|9\.3)$/);
      expect(parsed.hallazgo.descripcion).toContain('guantes dieléctricos');
      expect(parsed.hallazgo.accionLevantamiento).toContain('charla de retroalimentación');
      expect(parsed.hallazgo.seCorrigioEnCampo).toBe(true);

      // Charla de seguridad
      expect(parsed.charla.tema).toContain('Procedimiento de Trabajo Seguro');
    });

    it('detecta automáticamente cuando es una Amonestación (HSE-EL-F-128)', () => {
      const reportAmonestacion = `
        REGISTRO DE AMONESTACIÓN Y FALTA GRAVE HSE
        Trabajador: JUAN QUISPE MAMANI
        DNI: 45892134
        Lugar: Planta Eléctrica Sur
        Actividad: Trabajo en caliente
        Observación: Acto subestándar grave con peligro inminente de arco eléctrico.
        Acción inmediata: Suspensión de labores inmediata y retiro temporal del frente de trabajo.
      `;

      const parsed = parseWhatsAppReportText(reportAmonestacion);
      expect(parsed.tipoReporteSugerido).toBe('AMONESTACION');
      expect(parsed.trabajador.nombreCompleto).toBe('JUAN QUISPE MAMANI');
      expect(parsed.trabajador.dni).toBe('45892134');
      expect(parsed.amonestacion.nivelRiesgo).toBe('01_INTOLERABLE');
      expect(parsed.amonestacion.sancionSugerida).toBe('02_SUSPENSION');
    });
  });
});
