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

/** Estilos de celda para tabla tabular oficial */
const cell = 'border border-black px-2 py-1.5 text-[9px] leading-tight';
const cellCenter = `${cell} text-center`;
const headerCell = `${cell} font-bold bg-gray-100 text-[8px] uppercase`;
const sectionTitleCell = 'border border-black px-2 py-1 font-bold bg-gray-200 text-[9px] uppercase tracking-wide';

/** Encabezado Oficial PA Perú para Amonestación HSE-EL-F-128 */
const DocumentHeader: React.FC<{ fecha: string }> = ({ fecha }) => (
  <table className="w-full border-collapse border border-black mb-0" style={{ tableLayout: 'fixed' }}>
    <tbody>
      <tr>
        <td rowSpan={4} className="border border-black w-[130px] p-2 text-center align-middle">
          <div className="font-black text-sm leading-none tracking-tighter">P.A.</div>
          <div className="font-bold text-[8px] leading-tight mt-0.5">PROFESIONALES<br />ASOCIADOS</div>
        </td>
        <td rowSpan={4} className="border border-black p-2 text-center align-middle">
          <div className="font-bold text-[11px] uppercase leading-tight">
            REGISTRO DE AMONESTACIÓN
          </div>
          <div className="text-[8px] text-gray-600 mt-0.5">
            {PA_PERU_INFO.razon_social} — RUC {PA_PERU_INFO.ruc}
          </div>
          <div className="text-[7.5px] text-gray-500">
            {PA_PERU_INFO.tipo_actividad_economica}
          </div>
        </td>
        <td className={`${headerCell} w-[70px]`}>Código</td>
        <td className={`${cell} w-[90px] font-mono text-[8px]`}>HSE-EL-F-128</td>
      </tr>
      <tr>
        <td className={headerCell}>Versión</td>
        <td className={`${cell} font-mono text-[8px]`}>01</td>
      </tr>
      <tr>
        <td className={headerCell}>Fecha</td>
        <td className={`${cell} text-[8px]`}>{fecha}</td>
      </tr>
      <tr>
        <td className={headerCell}>Página</td>
        <td className={`${cell} text-[8px]`}>1 de 1</td>
      </tr>
    </tbody>
  </table>
);

export const AmonestacionReportTemplate: React.FC<AmonestacionReportTemplateProps> = ({
  activity,
  evidences = [],
  inspectorName,
  inspectorCargo,
  thumbUrls = {},
}) => {
  const raw = (activity.datos_formato_json as unknown) || {};
  const datos = raw as Partial<FormatoAmonestacionF128>;

  // Fallbacks seguros para datos del amonestado y la empresa (soporta formato estricto y formato compatible)
  const amonestadoData = (datos as any)?.amonestado || (datos as any)?.datos_amonestado || {};
  const amonestado = {
    apellidos_nombres: amonestadoData.apellidos_nombres || '',
    dni: amonestadoData.dni || '',
    cargo: amonestadoData.cargo || '',
    ubicacion: amonestadoData.ubicacion || activity.ubicacion || '',
    empresa: amonestadoData.empresa || PA_PERU_INFO.razon_social,
    fecha: amonestadoData.fecha || amonestadoData.fecha_hora || activity.fecha_operacion,
    hora: amonestadoData.hora || '',
  };

  const responsablesData = (datos as any)?.responsables || (datos as any)?.supervisores_responsables || {};
  const responsables = {
    capataz_jefe_cuadrilla: responsablesData.capataz_jefe_cuadrilla || responsablesData.capataz_cuadrilla || '',
    ing_responsable: responsablesData.ing_responsable || responsablesData.ingeniero_responsable || '',
    actividad_trabajo: responsablesData.actividad_trabajo || responsablesData.actividad_en_ejecucion || activity.descripcion || '',
  };

  const relatoRazon = (datos as any)?.relato_razon || (datos as any)?.motivo_amonestacion?.detalle_motivo || activity.descripcion || '';
  const rawMotivo = (datos as any)?.motivo_codigo || (datos as any)?.motivo_amonestacion?.codigo_motivo || '02_ACTO_SUBESTANDAR';
  const motivoCodigo = (rawMotivo === '02' ? '02_ACTO_SUBESTANDAR' : rawMotivo === '01' ? '01_FALTA_HSE' : rawMotivo === '03' ? '03_OBSERVACION_HSE' : rawMotivo === '04' ? '04_CONDICION_SUBESTANDAR' : rawMotivo) as MotivoAmonestacion;
  const detalleMotivo = (datos as any)?.detalle_motivo || (datos as any)?.motivo_amonestacion?.detalle_motivo || '';
  const nivelRiesgo = ((datos as any)?.nivel_riesgo || '02_BAJO') as NivelRiesgoAmonestacion;
  const otroRiesgo = (datos as any)?.otro_riesgo || '';
  const accionInmediata = (datos as any)?.accion_inmediata || (datos as any)?.accion_inmediata_hechos || '';
  const sancionCodigo = ((datos as any)?.sancion_codigo || (datos as any)?.sancion_aplicada_risst || '01_LLAMADA_ATENCION') as SancionAmonestacion;
  const diasSuspension = (datos as any)?.dias_suspension;
  const otraSancion = (datos as any)?.otra_sancion || '';

  const validacion = datos?.validacion || {
    realizado_por: {
      nombre: inspectorName || activity.responsable_nombre,
      cargo: inspectorCargo || 'Inspector HSE',
    },
    aprobado_por: {
      nombre: 'Ing. Residente / Jefe HSE',
      cargo: 'Supervisión Técnica HSE',
    },
    aceptado_por: {
      nombre: amonestado.apellidos_nombres || 'Trabajador Notificado',
      cargo: amonestado.cargo || 'Trabajador',
    },
  };

  const motivosList: Array<{ codigo: MotivoAmonestacion; label: string }> = [
    { codigo: '01_FALTA_HSE', label: '01. Falta de HSE (según RIIST PA)' },
    { codigo: '02_ACTO_SUBESTANDAR', label: '02. Acto Subestándar' },
    { codigo: '03_OBSERVACION_HSE', label: '03. Observación HSE' },
    { codigo: '04_CONDICION_SUBESTANDAR', label: '04. Condición Subestándar' },
  ];

  const riesgosList: Array<{ codigo: NivelRiesgoAmonestacion; label: string }> = [
    { codigo: '01_INTOLERABLE', label: '01. Intolerable' },
    { codigo: '02_BAJO', label: '02. Bajo' },
    { codigo: '03_MODERADO', label: '03. Moderado' },
    { codigo: '04_OTRO', label: '04. Otro' },
  ];

  const sancionesList: Array<{ codigo: SancionAmonestacion; label: string }> = [
    { codigo: '01_LLAMADA_ATENCION', label: '01. Llamada de Atención' },
    { codigo: '02_SUSPENSION', label: '02. Suspensión' },
    { codigo: '03_RETIRO_INMEDIATO', label: '03. Retiro Inmediato' },
    { codigo: '04_OTRO', label: '04. Otra Medida' },
  ];

  return (
    <div
      className="bg-white text-black p-4 max-w-[800px] mx-auto text-[9px] font-sans leading-tight shadow-sm print:p-0 print:max-w-none print:shadow-none"
      style={{ minHeight: '1050px' }}
    >
      {/* Encabezado */}
      <DocumentHeader fecha={amonestado.fecha || activity.fecha_operacion} />

      {/* BLOQUE 1: DATOS DEL AMONESTADO Y SUPERVISORES */}
      <table className="w-full border-collapse border border-black border-t-0" style={{ tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td colSpan={6} className={sectionTitleCell}>
              1. DATOS DEL TRABAJADOR AMONESTADO Y SUPERVISORES RESPONSABLES
            </td>
          </tr>
          <tr>
            <td className={`${headerCell} w-[15%]`}>Apellidos y Nombres:</td>
            <td colSpan={3} className={`${cell} font-bold`}>{amonestado.apellidos_nombres || '—'}</td>
            <td className={`${headerCell} w-[12%]`}>DNI:</td>
            <td className={`${cell} font-mono font-bold w-[18%]`}>{amonestado.dni || '—'}</td>
          </tr>
          <tr>
            <td className={headerCell}>Cargo / Ocupación:</td>
            <td colSpan={2} className={cell}>{amonestado.cargo || '—'}</td>
            <td className={`${headerCell} w-[15%]`}>Empresa:</td>
            <td colSpan={2} className={cell}>{amonestado.empresa || '—'}</td>
          </tr>
          <tr>
            <td className={headerCell}>Ubicación / Frente:</td>
            <td colSpan={2} className={cell}>{amonestado.ubicacion || activity.ubicacion || '—'}</td>
            <td className={headerCell}>Fecha y Hora:</td>
            <td colSpan={2} className={cell}>
              {amonestado.fecha || activity.fecha_operacion} {amonestado.hora ? `— ${amonestado.hora}` : ''}
            </td>
          </tr>
          <tr>
            <td className={headerCell}>Capataz / Jefe Cuadrilla:</td>
            <td colSpan={2} className={cell}>{responsables.capataz_jefe_cuadrilla || '—'}</td>
            <td className={headerCell}>Ing. Responsable:</td>
            <td colSpan={2} className={cell}>{responsables.ing_responsable || '—'}</td>
          </tr>
          <tr>
            <td className={headerCell}>Actividad en Ejecución:</td>
            <td colSpan={5} className={cell}>{responsables.actividad_trabajo || activity.descripcion || '—'}</td>
          </tr>
        </tbody>
      </table>

      {/* BLOQUE 2: RELATO BREVE DE LA RAZÓN DE LA AMONESTACIÓN */}
      <table className="w-full border-collapse border border-black border-t-0" style={{ tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td className={sectionTitleCell}>
              2. RELATO BREVE DE LA RAZÓN DE LA AMONESTACIÓN (HECHOS CONSTATADOS EN CAMPO)
            </td>
          </tr>
          <tr>
            <td className={`${cell} h-[90px] align-top text-justify leading-relaxed`}>
              {relatoRazon || (
                <span className="text-gray-400 italic">
                  Detalle detallado de los actos o condiciones subestándar observados en la inspección de campo...
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* BLOQUE 3: MOTIVO DE AMONESTACIÓN */}
      <table className="w-full border-collapse border border-black border-t-0" style={{ tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td colSpan={4} className={sectionTitleCell}>
              3. MOTIVO DE AMONESTACIÓN (MARCAR CON "X")
            </td>
          </tr>
          <tr>
            {motivosList.map((m) => {
              const isSelected = motivoCodigo === m.codigo;
              return (
                <td key={m.codigo} className={`${cell} w-1/4`}>
                  <div className="flex items-center justify-between">
                    <span className={isSelected ? 'font-bold' : ''}>{m.label}</span>
                    <span className="inline-block border border-black w-4 h-4 text-center font-mono font-bold leading-3 text-[10px] ml-1">
                      {isSelected ? 'X' : ''}
                    </span>
                  </div>
                </td>
              );
            })}
          </tr>
          {detalleMotivo && (
            <tr>
              <td colSpan={4} className={`${cell} bg-gray-50`}>
                <span className="font-bold">Detalle / Cláusula infringida: </span>
                {detalleMotivo}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* BLOQUE 4: NIVEL DE RIESGO Y ACCIÓN INMEDIATA */}
      <table className="w-full border-collapse border border-black border-t-0" style={{ tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td colSpan={4} className={sectionTitleCell}>
              4. NIVEL DE RIESGO EVALUADO (MARCAR CON "X")
            </td>
          </tr>
          <tr>
            {riesgosList.map((r) => {
              const isSelected = nivelRiesgo === r.codigo;
              return (
                <td key={r.codigo} className={`${cell} w-1/4`}>
                  <div className="flex items-center justify-between">
                    <span className={isSelected ? 'font-bold' : ''}>
                      {r.label}
                      {r.codigo === '04_OTRO' && otroRiesgo ? `: ${otroRiesgo}` : ''}
                    </span>
                    <span className="inline-block border border-black w-4 h-4 text-center font-mono font-bold leading-3 text-[10px] ml-1">
                      {isSelected ? 'X' : ''}
                    </span>
                  </div>
                </td>
              );
            })}
          </tr>
          <tr>
            <td colSpan={4} className={`${headerCell} text-left`}>
              ACCIÓN INMEDIATA DE LOS HECHOS (MEDIDA CORRECTIVA EN EL SITIO)
            </td>
          </tr>
          <tr>
            <td colSpan={4} className={`${cell} h-[70px] align-top text-justify leading-relaxed`}>
              {accionInmediata || (
                <span className="text-gray-400 italic">
                  Acción correctiva adoptada inmediatamente (ej. paralización del trabajo, reubicación del personal, reemplazo de EPP)...
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* BLOQUE 5: SANCIÓN APLICADA SEGÚN RISST */}
      <table className="w-full border-collapse border border-black border-t-0" style={{ tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td colSpan={4} className={sectionTitleCell}>
              5. SANCIÓN APLICADA SEGÚN RISST (REGLAMENTO INTERNO DE SEGURIDAD Y SALUD EN EL TRABAJO)
            </td>
          </tr>
          <tr>
            {sancionesList.map((s) => {
              const isSelected = sancionCodigo === s.codigo;
              let labelText = s.label;
              if (s.codigo === '02_SUSPENSION' && diasSuspension) {
                labelText = `02. Suspensión (${diasSuspension} días)`;
              } else if (s.codigo === '04_OTRO' && otraSancion) {
                labelText = `04. Otro: ${otraSancion}`;
              }

              return (
                <td key={s.codigo} className={`${cell} w-1/4`}>
                  <div className="flex items-center justify-between">
                    <span className={isSelected ? 'font-bold' : ''}>{labelText}</span>
                    <span className="inline-block border border-black w-4 h-4 text-center font-mono font-bold leading-3 text-[10px] ml-1">
                      {isSelected ? 'X' : ''}
                    </span>
                  </div>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>

      {/* BLOQUE DE EVIDENCIA FOTOGRÁFICA (SI EXISTE) */}
      {evidences.length > 0 && (
        <table className="w-full border-collapse border border-black border-t-0" style={{ tableLayout: 'fixed' }}>
          <tbody>
            <tr>
              <td colSpan={evidences.length > 1 ? 2 : 1} className={sectionTitleCell}>
                REGISTRO FOTOGRÁFICO DE LA INFRACCIÓN / EVIDENCIA INMUTABLE
              </td>
            </tr>
            <tr>
              {evidences.slice(0, 2).map(({ evidencia, identificacion }) => {
                const url = thumbUrls[evidencia.id];
                return (
                  <td key={evidencia.id} className={`${cellCenter} p-2`} style={{ height: '140px' }}>
                    {url ? (
                      <img src={url} alt={evidencia.nombre_archivo} className="max-h-[110px] mx-auto object-contain mb-1" />
                    ) : (
                      <div className="text-[8px] text-gray-400 py-6">{evidencia.nombre_archivo}</div>
                    )}
                    <div className="font-mono text-[7px] text-gray-500 break-all">SHA-256: {evidencia.hash_sha256}</div>
                    {identificacion && (
                      <div className="text-[7.5px] font-semibold text-gray-700 mt-0.5">
                        {identificacion.nombres} {identificacion.apellido_paterno} ({identificacion.cargo || 'Operario'})
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      )}

      {/* BLOQUE DE FIRMAS: 3 CASILLAS NORMATIVAS (REALIZADO POR, APROBADO POR, ACEPTADO POR) */}
      <table className="w-full border-collapse border border-black border-t-0 mt-0" style={{ tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td colSpan={3} className={sectionTitleCell}>
              6. VALIDACIÓN DEL REGISTRO (CONFORMIDAD Y FIRMAS)
            </td>
          </tr>
          <tr style={{ height: '90px' }}>
            <td className={`${cellCenter} align-bottom pb-2 w-1/3`}>
              <div className="border-b border-black w-4/5 mx-auto mb-1"></div>
              <div className="font-bold uppercase text-[8.5px]">{validacion.realizado_por.nombre || 'INSPECTOR HSE'}</div>
              <div className="text-[7.5px] text-gray-600 uppercase">{validacion.realizado_por.cargo || 'REALIZADO POR'}</div>
              <div className="text-[7px] text-gray-500 font-semibold mt-0.5">REALIZADO POR</div>
            </td>
            <td className={`${cellCenter} align-bottom pb-2 w-1/3`}>
              <div className="border-b border-black w-4/5 mx-auto mb-1"></div>
              <div className="font-bold uppercase text-[8.5px]">{validacion.aprobado_por.nombre || 'ING. RESIDENTE / JEFE HSE'}</div>
              <div className="text-[7.5px] text-gray-600 uppercase">{validacion.aprobado_por.cargo || 'APROBADO POR'}</div>
              <div className="text-[7px] text-gray-500 font-semibold mt-0.5">APROBADO POR</div>
            </td>
            <td className={`${cellCenter} align-bottom pb-2 w-1/3`}>
              <div className="border-b border-black w-4/5 mx-auto mb-1"></div>
              <div className="font-bold uppercase text-[8.5px]">{validacion.aceptado_por.nombre || amonestado.apellidos_nombres || 'TRABAJADOR AMONESTADO'}</div>
              <div className="text-[7.5px] text-gray-600 uppercase">DNI: {amonestado.dni || '—'}</div>
              <div className="text-[7px] text-gray-500 font-semibold mt-0.5">ACEPTADO POR (TRABAJADOR)</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Pie de página con nota legal */}
      <div className="mt-2 text-[7px] text-gray-500 text-center italic">
        Documento oficial emitido conforme a la Ley N° 29783 (Ley de Seguridad y Salud en el Trabajo) y el RIIST de {PA_PERU_INFO.razon_social}.
      </div>
    </div>
  );
};

export default AmonestacionReportTemplate;
