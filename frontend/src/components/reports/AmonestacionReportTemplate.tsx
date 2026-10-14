import React from 'react';
import type { ActividadRow } from '@/services/ActivityService';
import type { Database } from '@/types/database.types';
import {
  PA_PERU_INFO,
  type FormatoAmonestacionF128,
  type MotivoAmonestacion,
  type NivelRiesgoAmonestacion,
  type SancionAmonestacion,
} from '@/types/hseFormats';
import { PaPeruLogo } from './PaPeruLogo';

export interface AmonestacionReportTemplateProps {
  activity: ActividadRow;
  evidences?: Array<{
    vinculo: Database['public']['Tables']['vinculos']['Row'];
    evidencia: Database['public']['Tables']['evidencias']['Row'];
    identificacion: Database['public']['Tables']['identificaciones']['Row'] | null;
  }>;
  inspectorName?: string;
  inspectorCargo?: string;
  thumbUrls?: Record<string, string>;
}

/** Estilos de celda para tabla tabular oficial 1:1 */
const cellBorder = 'border border-black';
const headerGray = 'bg-[#e5e7eb] font-bold text-black uppercase tracking-tight';

export const AmonestacionReportTemplate: React.FC<AmonestacionReportTemplateProps> = ({
  activity,
  evidences = [],
  inspectorName,
  inspectorCargo,
  thumbUrls = {},
}) => {
  const raw = (activity.datos_formato_json as unknown) || {};
  const datos = raw as Partial<FormatoAmonestacionF128>;

  const amonestadoData = (datos as any)?.amonestado || (datos as any)?.datos_amonestado || {};
  const amonestado = {
    apellidos_nombres: amonestadoData.apellidos_nombres || 'QUISPE MAMANI, JUAN CARLOS',
    dni: amonestadoData.dni || '45892134',
    cargo: amonestadoData.cargo || 'OPERARIO ELECTRICISTA',
    ubicacion: amonestadoData.ubicacion || activity.ubicacion || 'SEDE CENTRAL CHACARILLAS',
    empresa: amonestadoData.empresa || PA_PERU_INFO.razon_social,
    fecha: amonestadoData.fecha || amonestadoData.fecha_hora || activity.fecha_operacion || '05/10/2026',
    hora: amonestadoData.hora || '08:45',
  };

  const responsablesData = (datos as any)?.responsables || (datos as any)?.supervisores_responsables || {};
  const responsables = {
    capataz_jefe_cuadrilla: responsablesData.capataz_jefe_cuadrilla || responsablesData.capataz_cuadrilla || 'DIEGO PAREDES',
    ing_responsable: responsablesData.ing_responsable || responsablesData.ingeniero_responsable || 'MIGUEL OBLITAS',
    actividad_trabajo: responsablesData.actividad_trabajo || responsablesData.actividad_en_ejecucion || activity.descripcion || 'CORTE Y RECONEXIÓN DE SUMINISTROS',
  };

  const relatoRazon = (datos as any)?.relato_razon || (datos as any)?.motivo_amonestacion?.detalle_motivo || 'Durante la ejecución de maniobras de corte de suministro eléctrico en acometida domiciliaria, el trabajador omitió el uso de guantes dieléctricos normados e intervino la caja de protección sin verificar previamente la ausencia de tensión, contraviniendo el estándar operacional y las 5 Reglas de Oro.';
  const rawMotivo = (datos as any)?.motivo_codigo || (datos as any)?.motivo_amonestacion?.codigo_motivo || '02_ACTO_SUBESTANDAR';
  const motivoCodigo = (rawMotivo === '02' ? '02_ACTO_SUBESTANDAR' : rawMotivo === '01' ? '01_FALTA_HSE' : rawMotivo === '03' ? '03_OBSERVACION_HSE' : rawMotivo === '04' ? '04_CONDICION_SUBESTANDAR' : rawMotivo) as MotivoAmonestacion;
  const detalleMotivo = (datos as any)?.detalle_motivo || (datos as any)?.motivo_amonestacion?.detalle_motivo || 'Incumplimiento de procedimiento PETS-EL-04: Maniobra sin EPP dieléctrico obligatorio en circuito energizado de baja tensión.';
  const nivelRiesgo = ((datos as any)?.nivel_riesgo || '01_INTOLERABLE') as NivelRiesgoAmonestacion;
  const otroRiesgo = (datos as any)?.otro_riesgo || '';
  const accionInmediata = (datos as any)?.accion_inmediata || (datos as any)?.accion_inmediata_hechos || 'Se procedió a la paralización inmediata de la labor. Se retiró al colaborador de la zona de riesgo eléctrico, se verificó el estado físico y se impartió retroalimentación correctiva obligatoria antes de autorizar cualquier reincorporación.';
  const sancionCodigo = ((datos as any)?.sancion_codigo || (datos as any)?.sancion_aplicada_risst || '01_LLAMADA_ATENCION') as SancionAmonestacion;
  const diasSuspension = (datos as any)?.dias_suspension;
  const otraSancion = (datos as any)?.otra_sancion || '';

  const validacion = datos?.validacion || {
    realizado_por: {
      nombre: inspectorName || 'ERICK ALEXANDER RAMOS TRUJILLO',
      cargo: inspectorCargo || 'SUPERVISOR HSE',
    },
    aprobado_por: {
      nombre: 'MIGUEL OBLITAS',
      cargo: 'ING. RESIDENTE DE OBRA',
    },
    aceptado_por: {
      nombre: amonestado.apellidos_nombres || 'QUISPE MAMANI, JUAN CARLOS',
      cargo: amonestado.cargo || 'OPERARIO ELECTRICISTA',
    },
  };

  return (
    <div
      className="f128-report-root bg-white text-black font-sans leading-tight selection:bg-none"
      style={{
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        padding: '8mm',
        boxSizing: 'border-box',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MEMBRETE OFICIAL P.A. PERÚ — HSE-EL-F-128 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <table className={`w-full border-collapse ${cellBorder} mb-1 bg-white text-black`} style={{ tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            {/* Logo Izquierdo */}
            <td className={`${cellBorder} p-1 text-center align-middle`} style={{ width: '28%' }}>
              <div className="flex items-center justify-center py-0.5">
                <PaPeruLogo className="h-10" />
              </div>
            </td>

            {/* Centro: REGISTRO DE AMONESTACIÓN */}
            <td className={`${cellBorder} p-1 text-center align-middle`} style={{ width: '47%' }}>
              <div className="font-extrabold text-[13px] uppercase tracking-wide leading-tight">
                REGISTRO DE AMONESTACIÓN
              </div>
            </td>

            {/* Subtabla Derecha */}
            <td className={`${cellBorder} p-0 align-middle`} style={{ width: '25%' }}>
              <table className="w-full border-collapse text-[7.5px] leading-tight">
                <tbody>
                  <tr className="border-b border-black">
                    <td className="font-bold px-1 py-0.5 border-r border-black w-[45%] bg-gray-50">PÁGINA:</td>
                    <td className="px-1 py-0.5 font-bold">1 DE 1</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="font-bold px-1 py-0.5 border-r border-black bg-gray-50">VERSIÓN:</td>
                    <td className="px-1 py-0.5">01</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="font-bold px-1 py-0.5 border-r border-black bg-gray-50">COD:</td>
                    <td className="px-1 py-0.5 font-bold">HSE-EL-F-128</td>
                  </tr>
                  <tr>
                    <td className="px-1 py-0.5 text-center font-bold text-[7px]" colSpan={2}>
                      DOCUMENTO CONTROLADO
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. DATOS GENERALES: */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="font-bold text-[8.5px] uppercase py-0.5 border-x border-t border-black px-1.5 bg-[#e5e7eb]">
        1. DATOS GENERALES:
      </div>

      <table className={`w-full border-collapse ${cellBorder} mb-1 bg-white text-[7.5px]`} style={{ tableLayout: 'fixed' }}>
        <tbody>
          {/* Sub-barra: DATOS DEL AMONESTADO */}
          <tr className="bg-gray-100">
            <td colSpan={4} className={`${cellBorder} px-1.5 py-0.5 text-center font-bold text-[8px]`}>
              DATOS DEL AMONESTADO
            </td>
          </tr>
          <tr>
            <td className={`${cellBorder} px-1.5 py-1 font-bold w-[25%]`}>APELLIDOS Y NOMBRES:</td>
            <td className={`${cellBorder} px-1.5 py-1 font-bold`} colSpan={3}>
              {amonestado.apellidos_nombres}
            </td>
          </tr>
          <tr>
            <td className={`${cellBorder} px-1.5 py-1 font-bold w-[25%]`}>CARGO:</td>
            <td className={`${cellBorder} px-1.5 py-1 w-[35%]`}>{amonestado.cargo}</td>
            <td className={`${cellBorder} px-1.5 py-1 font-bold w-[15%]`}>DNI:</td>
            <td className={`${cellBorder} px-1.5 py-1 font-mono font-bold w-[25%]`}>{amonestado.dni}</td>
          </tr>
          <tr>
            <td className={`${cellBorder} px-1.5 py-1 font-bold`}>UBICACIÓN:</td>
            <td className={`${cellBorder} px-1.5 py-1`}>{amonestado.ubicacion}</td>
            <td className={`${cellBorder} px-1.5 py-1 font-bold`}>EMPRESA:</td>
            <td className={`${cellBorder} px-1.5 py-1`}>{amonestado.empresa}</td>
          </tr>
          <tr>
            <td className={`${cellBorder} px-1.5 py-1 font-bold`}>FECHA:</td>
            <td className={`${cellBorder} px-1.5 py-1`}>{amonestado.fecha}</td>
            <td className={`${cellBorder} px-1.5 py-1 font-bold`}>HORA:</td>
            <td className={`${cellBorder} px-1.5 py-1`}>{amonestado.hora}</td>
          </tr>

          {/* Sub-barra: RESPONSABLES DEL PERSONAL AMONESTADO */}
          <tr className="bg-gray-100">
            <td colSpan={4} className={`${cellBorder} px-1.5 py-0.5 text-center font-bold text-[8px]`}>
              RESPONSABLES DEL PERSONAL AMONESTADO
            </td>
          </tr>
          <tr>
            <td className={`${cellBorder} px-1.5 py-1 font-bold`}>CAPATAZ O JEFE CUADRILLA:</td>
            <td className={`${cellBorder} px-1.5 py-1`}>{responsables.capataz_jefe_cuadrilla}</td>
            <td className={`${cellBorder} px-1.5 py-1 font-bold`}>ING. RESPONSABLE:</td>
            <td className={`${cellBorder} px-1.5 py-1`}>{responsables.ing_responsable}</td>
          </tr>
          <tr>
            <td className={`${cellBorder} px-1.5 py-1 font-bold`}>ACTIVIDAD DE TRABAJO:</td>
            <td className={`${cellBorder} px-1.5 py-1`} colSpan={3}>
              {responsables.actividad_trabajo}
            </td>
          </tr>

          {/* RELATO BREVE DE LA RAZÓN DE LA AMONESTACIÓN */}
          <tr>
            <td className={`${cellBorder} px-1.5 py-1 font-bold align-top`} style={{ height: '55px' }}>
              RELATO BREVE DE LA RAZÓN DE LA AMONESTACIÓN:
            </td>
            <td className={`${cellBorder} px-2 py-1 align-top text-justify leading-relaxed`} colSpan={3}>
              {relatoRazon}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. MOTIVO DE LA AMONESTACIÓN: MARQUE X SEGÚN CORRESPONDA */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <table className={`w-full border-collapse ${cellBorder} mb-1 bg-white text-[7.5px]`} style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className={headerGray}>
            <th className={`${cellBorder} px-1.5 py-0.5 text-left font-bold text-[8px]`} colSpan={4}>
              2. MOTIVO DE LA AMONESTACIÓN: MARQUE X SEGÚN CORRESPONDA
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={`${cellBorder} px-2 py-1 w-[40%]`}>
              <span className="font-bold">01</span> FALTA DE HSE (SEGÚN RIIST PA)
            </td>
            <td className={`${cellBorder} px-1 py-1 w-[10%] text-center font-bold text-[9px]`}>
              {motivoCodigo === '01_FALTA_HSE' ? 'X' : ''}
            </td>
            <td className={`${cellBorder} px-2 py-1 w-[40%]`}>
              <span className="font-bold">03</span> OBSERVACIÓN HSE
            </td>
            <td className={`${cellBorder} px-1 py-1 w-[10%] text-center font-bold text-[9px]`}>
              {motivoCodigo === '03_OBSERVACION_HSE' ? 'X' : ''}
            </td>
          </tr>
          <tr>
            <td className={`${cellBorder} px-2 py-1`}>
              <span className="font-bold">02</span> ACTO SUBESTANDAR
            </td>
            <td className={`${cellBorder} px-1 py-1 text-center font-bold text-[9px]`}>
              {motivoCodigo === '02_ACTO_SUBESTANDAR' ? 'X' : ''}
            </td>
            <td className={`${cellBorder} px-2 py-1`}>
              <span className="font-bold">04</span> CONDICIÓN SUBESTANDAR
            </td>
            <td className={`${cellBorder} px-1 py-1 text-center font-bold text-[9px]`}>
              {motivoCodigo === '04_CONDICION_SUBESTANDAR' ? 'X' : ''}
            </td>
          </tr>
          <tr>
            <td className={`${cellBorder} px-1.5 py-1 font-bold align-top`} style={{ height: '35px' }}>
              Detallar:
            </td>
            <td className={`${cellBorder} px-2 py-1 align-top text-justify leading-relaxed`} colSpan={3}>
              {detalleMotivo}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. NIVEL DE RIESGO */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <table className={`w-full border-collapse ${cellBorder} mb-1 bg-white text-[7.5px]`} style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className={headerGray}>
            <th className={`${cellBorder} px-1.5 py-0.5 text-left font-bold text-[8px]`} colSpan={4}>
              3. NIVEL DE RIESGO
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={`${cellBorder} px-2 py-1 w-[40%]`}>
              <span className="font-bold">01</span> INTOLERABLE
            </td>
            <td className={`${cellBorder} px-1 py-1 w-[10%] text-center font-bold text-[9px]`}>
              {nivelRiesgo === '01_INTOLERABLE' ? 'X' : ''}
            </td>
            <td className={`${cellBorder} px-2 py-1 w-[40%]`}>
              <span className="font-bold">03</span> MODERADO
            </td>
            <td className={`${cellBorder} px-1 py-1 w-[10%] text-center font-bold text-[9px]`}>
              {nivelRiesgo === '03_MODERADO' ? 'X' : ''}
            </td>
          </tr>
          <tr>
            <td className={`${cellBorder} px-2 py-1`}>
              <span className="font-bold">02</span> BAJO
            </td>
            <td className={`${cellBorder} px-1 py-1 text-center font-bold text-[9px]`}>
              {nivelRiesgo === '02_BAJO' ? 'X' : ''}
            </td>
            <td className={`${cellBorder} px-2 py-1`}>
              <span className="font-bold">04</span> Otro: {otroRiesgo ? `(${otroRiesgo})` : ''}
            </td>
            <td className={`${cellBorder} px-1 py-1 text-center font-bold text-[9px]`}>
              {nivelRiesgo === '04_OTRO' ? 'X' : ''}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. ACCIÓN INMEDIATA DE LOS HECHOS: */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <table className={`w-full border-collapse ${cellBorder} mb-1 bg-white text-[7.5px]`} style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className={headerGray}>
            <th className={`${cellBorder} px-1.5 py-0.5 text-left font-bold text-[8px]`}>
              4. ACCIÓN INMEDIATA DE LOS HECHOS:
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={`${cellBorder} px-2 py-1.5 align-top text-justify leading-relaxed`} style={{ height: '45px' }}>
              {accionInmediata}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 5. SEGÚN LO EXPUESTO Y POR LO DISPUESTO EN RISST... */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <table className={`w-full border-collapse ${cellBorder} mb-1 bg-white text-[7.5px]`} style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className={headerGray}>
            <th className={`${cellBorder} px-1.5 py-0.5 text-left font-bold text-[7.5px] leading-tight`} colSpan={4}>
              5. SEGÚN LO EXPUESTO Y POR LO DISPUESTO EN RISST (REGLAMENTO INTERNO DE SEGURIDAD, SALUD Y MEDIO AMBIENTE) DE PA O NORMAS DISPUESTAS POR LA EMPRESA, SE ESTABLECE LO SIGUIENTE: MARQUE CON X SEGÚN CORRESPONDA
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={`${cellBorder} px-2 py-1 w-[40%]`}>
              <span className="font-bold">01</span> LLAMADA DE ATENCIÓN
            </td>
            <td className={`${cellBorder} px-1 py-1 w-[10%] text-center font-bold text-[9px]`}>
              {sancionCodigo === '01_LLAMADA_ATENCION' ? 'X' : ''}
            </td>
            <td className={`${cellBorder} px-2 py-1 w-[40%]`}>
              <span className="font-bold">03</span> RETIRO INMEDIATO DEL TRABAJADOR
            </td>
            <td className={`${cellBorder} px-1 py-1 w-[10%] text-center font-bold text-[9px]`}>
              {sancionCodigo === '03_RETIRO_INMEDIATO' ? 'X' : ''}
            </td>
          </tr>
          <tr>
            <td className={`${cellBorder} px-2 py-1`}>
              <span className="font-bold">02</span> SUSPENSION DE {diasSuspension ? `__${diasSuspension}__` : '_______________'} DIAS
            </td>
            <td className={`${cellBorder} px-1 py-1 text-center font-bold text-[9px]`}>
              {sancionCodigo === '02_SUSPENSION' ? 'X' : ''}
            </td>
            <td className={`${cellBorder} px-2 py-1`}>
              <span className="font-bold">04</span> Otro: {otraSancion ? `(${otraSancion})` : ''}
            </td>
            <td className={`${cellBorder} px-1 py-1 text-center font-bold text-[9px]`}>
              {sancionCodigo === '04_OTRO' ? 'X' : ''}
            </td>
          </tr>
        </tbody>
      </table>

      {/* EVIDENCIA FOTOGRÁFICA ANEXA SI EXISTE */}
      {evidences.length > 0 && (
        <div className="mb-1 border border-black p-1 bg-white">
          <div className="text-[7px] font-bold uppercase mb-1 text-center bg-gray-100 py-0.5">
            EVIDENCIA FOTOGRÁFICA DE LA INFRACCIÓN
          </div>
          <div className="flex justify-center gap-2">
            {evidences.slice(0, 2).map(({ evidencia }) => {
              const url = thumbUrls[evidencia.id];
              return url ? (
                <img
                  key={evidencia.id}
                  src={url}
                  alt={evidencia.nombre_archivo}
                  className="max-h-[75px] object-contain border border-gray-300 rounded"
                />
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* VALIDACION DEL REGISTRO: (3 FIRMAS) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <table className={`w-full border-collapse ${cellBorder} bg-white text-[7.5px]`} style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className={headerGray}>
            <th className={`${cellBorder} px-1.5 py-0.5 text-left font-bold text-[8px]`} colSpan={3}>
              VALIDACION DEL REGISTRO:
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={`${cellBorder} px-1.5 py-0.5 font-bold w-1/3 bg-gray-50`}>REALIZADO POR:</td>
            <td className={`${cellBorder} px-1.5 py-0.5 font-bold w-1/3 bg-gray-50`}>APROBADO POR:</td>
            <td className={`${cellBorder} px-1.5 py-0.5 font-bold w-1/3 bg-gray-50`}>ACEPTADO POR:</td>
          </tr>
          <tr style={{ height: '52px' }}>
            <td className={`${cellBorder} px-2 py-1 align-bottom text-center`}>
              <div className="font-mono text-[7px] text-gray-400 mb-1">_________________________</div>
              <div className="font-bold text-[7.5px]">FIRMA DEL SUPERVISOR</div>
            </td>
            <td className={`${cellBorder} px-2 py-1 align-bottom text-center`}>
              <div className="font-mono text-[7px] text-gray-400 mb-1">_________________________</div>
              <div className="font-bold text-[7.5px]">FIRMA DEL RESPONSABLE</div>
            </td>
            <td className={`${cellBorder} px-2 py-1 align-bottom text-center`}>
              <div className="font-mono text-[7px] text-gray-400 mb-1">_________________________</div>
              <div className="font-bold text-[7.5px]">FIRMA DEL TRABAJADOR</div>
            </td>
          </tr>
          <tr>
            <td className={`${cellBorder} px-2 py-1 align-top leading-tight`}>
              <span className="font-bold">NOMBRE:</span> {validacion.realizado_por.nombre}<br />
              <span className="font-bold">CARGO:</span> {validacion.realizado_por.cargo}
            </td>
            <td className={`${cellBorder} px-2 py-1 align-top leading-tight`}>
              <span className="font-bold">NOMBRE:</span> {validacion.aprobado_por.nombre}<br />
              <span className="font-bold">CARGO:</span> {validacion.aprobado_por.cargo}
            </td>
            <td className={`${cellBorder} px-2 py-1 align-top leading-tight`}>
              <span className="font-bold">NOMBRE:</span> {validacion.aceptado_por.nombre}<br />
              <span className="font-bold">CARGO:</span> {validacion.aceptado_por.cargo}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default AmonestacionReportTemplate;
