import React from 'react';
import type { ActividadRow } from '@/services/ActivityService';
import type { Database } from '@/types/database.types';
import {
  PA_PERU_INFO,
  CATALOGO_F120,
  CALIFICACIONES_HSE,
  type FormatoInspeccionF120,
  type CalificacionHSE,
} from '@/types/hseFormats';

export interface InspectionReportTemplateProps {
  activity: ActividadRow;
  evidences?: Array<{
    vinculo: Database['public']['Tables']['vinculos']['Row'];
    evidencia: Database['public']['Tables']['evidencias']['Row'];
    identificacion: Database['public']['Tables']['identificaciones']['Row'] | null;
  }>;
  inspectorName?: string;
  inspectorCargo?: string;
  /** URLs precomputadas de thumbnails indexadas por evidencia.id */
  thumbUrls?: Record<string, string>;
}

/** Estilo de celda reutilizable para la tabla tabular */
const cell = 'border border-black px-1.5 py-1 text-[9px] leading-tight';
const cellCenter = `${cell} text-center`;
const headerCell = `${cell} font-bold bg-gray-100 text-[8px] uppercase`;

/** Encabezado PA Perú con tabla de control documental */
const DocumentHeader: React.FC<{ datos?: FormatoInspeccionF120; codigo: string; pagina: string; fechaFallback?: string }> = ({ datos, codigo, pagina, fechaFallback }) => (
  <table className="w-full border-collapse border border-black mb-0" style={{ tableLayout: 'fixed' }}>
    <tbody>
      <tr>
        <td rowSpan={4} className="border border-black w-[140px] p-2 text-center align-middle">
          <div className="font-black text-sm leading-none tracking-tighter">P.A.</div>
          <div className="font-bold text-[8px] leading-tight mt-0.5">PROFESIONALES<br />ASOCIADOS</div>
        </td>
        <td rowSpan={4} className="border border-black p-2 text-center align-middle">
          <div className="font-bold text-[10px] uppercase leading-tight">
            INSPECCIÓN DE SEGURIDAD, SALUD EN EL TRABAJO Y MEDIO AMBIENTE
          </div>
          <div className="text-[8px] text-gray-600 mt-0.5">
            {PA_PERU_INFO.razon_social} — RUC {PA_PERU_INFO.ruc}
          </div>
        </td>
        <td className={`${headerCell} w-[70px]`}>Código</td>
        <td className={`${cell} w-[100px] font-mono text-[8px]`}>{codigo}</td>
      </tr>
      <tr>
        <td className={headerCell}>Versión</td>
        <td className={`${cell} font-mono text-[8px]`}>{datos?.version || '01'}</td>
      </tr>
      <tr>
        <td className={headerCell}>Fecha</td>
        <td className={`${cell} text-[8px]`}>{datos?.cabecera?.fecha_inspeccion || fechaFallback || '—'}</td>
      </tr>
      <tr>
        <td className={headerCell}>Página</td>
        <td className={`${cell} text-[8px]`}>{pagina}</td>
      </tr>
    </tbody>
  </table>
);

export const InspectionReportTemplate: React.FC<InspectionReportTemplateProps> = ({
  activity,
  evidences = [],
  inspectorName,
  thumbUrls = {},
}) => {
  const raw = (activity.datos_formato_json as unknown) || {};
  const datos = raw as FormatoInspeccionF120;
  const isF120 = datos?.tipo_formato === 'CHECKLIST_F120';

  const cabecera = isF120 ? datos.cabecera : {
    razon_social: PA_PERU_INFO.razon_social,
    ruc: PA_PERU_INFO.ruc,
    domicilio: PA_PERU_INFO.domicilio,
    tipo_actividad_economica: PA_PERU_INFO.tipo_actividad_economica,
    proyecto: activity.ubicacion,
    actividad: activity.tipo_actividad,
    lugar: activity.ubicacion,
    supervisor_encargado: activity.responsable_nombre,
    responsable_area: '',
    fecha_inspeccion: activity.fecha_operacion,
    hora_inspeccion: '',
  };

  // Mapa de ítems evaluados para búsqueda O(1)
  const itemsMap = new Map<string, { calificacion: CalificacionHSE; observacion?: string }>();
  if (isF120 && datos.items_evaluados) {
    for (const it of datos.items_evaluados) {
      itemsMap.set(it.codigo, { calificacion: it.calificacion, observacion: it.observacion });
    }
  }

  const hallazgos = isF120 ? (datos.hallazgos_y_levantamiento || []) : [];
  const personal = isF120 ? (datos.personal_involucrado || []) : [];
  const charla = isF120 ? datos.retroalimentacion_charla : null;
  const inspector = isF120 ? datos.inspector_encargado : { nombre: inspectorName || activity.responsable_nombre, cargo: 'Inspector HSE' };
  const modalidad = isF120 ? datos.modalidad_inspeccion : 'CON_ACOMPANAMIENTO';

  const codigo = 'HSE-EL-F-120';

  return (
    <div className="font-sans text-black bg-white print:bg-white" style={{ fontSize: '10px' }}>
      {/* ═══════════════════ PÁGINA 1 y 2: Cabecera + Checklist ═══════════════════ */}
      <div className="page-break-inside-avoid">
        <DocumentHeader datos={datos} codigo={codigo} pagina="1 de 4" />

        {/* Datos de la inspección */}
        <table className="w-full border-collapse border border-black mt-0">
          <tbody>
            <tr>
              <td className={`${headerCell} w-[120px]`}>Proyecto</td>
              <td className={cell} colSpan={3}>{cabecera.proyecto}</td>
            </tr>
            <tr>
              <td className={headerCell}>Actividad</td>
              <td className={cell}>{cabecera.actividad}</td>
              <td className={`${headerCell} w-[120px]`}>Lugar</td>
              <td className={cell}>{cabecera.lugar}</td>
            </tr>
            <tr>
              <td className={headerCell}>Supervisor Encargado</td>
              <td className={cell}>{cabecera.supervisor_encargado}</td>
              <td className={headerCell}>Fecha / Hora</td>
              <td className={cell}>{cabecera.fecha_inspeccion} — {cabecera.hora_inspeccion}</td>
            </tr>
            <tr>
              <td className={headerCell}>Responsable del Área</td>
              <td className={cell} colSpan={3}>{cabecera.responsable_area}</td>
            </tr>
          </tbody>
        </table>

        {/* Leyenda */}
        <div className="flex gap-4 py-1.5 text-[8px] font-medium border-x border-b border-black px-2 bg-gray-50">
          {Object.entries(CALIFICACIONES_HSE).map(([k, v]) => (
            <span key={k}><strong>{k}</strong>: {v}</span>
          ))}
        </div>

        {/* Tabla de Checklist — Secciones 1 a 8 */}
        <table className="w-full border-collapse border border-black mt-0">
          <thead>
            <tr>
              <th className={`${headerCell} w-[40px]`}>N°</th>
              <th className={headerCell}>DESCRIPCIÓN</th>
              <th className={`${headerCell} w-[28px]`}>S</th>
              <th className={`${headerCell} w-[28px]`}>ER</th>
              <th className={`${headerCell} w-[28px]`}>PI</th>
              <th className={`${headerCell} w-[28px]`}>NA</th>
              <th className={`${headerCell} w-[180px]`}>OBSERVACIONES</th>
            </tr>
          </thead>
          <tbody>
            {CATALOGO_F120.filter((s) => s.id <= 8).map((seccion) => (
              <React.Fragment key={seccion.id}>
                {/* Encabezado de sección */}
                <tr>
                  <td className={`${cell} font-bold bg-gray-200 text-[8px]`} colSpan={7}>
                    {seccion.id}. {seccion.nombre}
                  </td>
                </tr>
                {/* Ítems de la sección */}
                {seccion.items.map((item) => {
                  const eval_ = itemsMap.get(item.codigo);
                  const calif = eval_?.calificacion;
                  return (
                    <tr key={item.codigo}>
                      <td className={cellCenter}>{item.codigo}</td>
                      <td className={`${cell} text-[8px]`}>{item.descripcion}</td>
                      <td className={cellCenter}>{calif === 'S' ? '✕' : ''}</td>
                      <td className={`${cellCenter} ${calif === 'ER' ? 'bg-amber-100 font-bold' : ''}`}>{calif === 'ER' ? '✕' : ''}</td>
                      <td className={`${cellCenter} ${calif === 'PI' ? 'bg-red-100 font-bold' : ''}`}>{calif === 'PI' ? '✕' : ''}</td>
                      <td className={cellCenter}>{calif === 'NA' ? '✕' : ''}</td>
                      <td className={`${cell} text-[7px] italic`}>{eval_?.observacion || ''}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══════════════════ PÁGINA 2: Checklist Secciones 9 a 15 ══════════════ */}
      <div className="page-break-inside-avoid mt-2" style={{ breakBefore: 'page' }}>
        <DocumentHeader datos={datos} codigo={codigo} pagina="2 de 4" />

        <table className="w-full border-collapse border border-black mt-0">
          <thead>
            <tr>
              <th className={`${headerCell} w-[40px]`}>N°</th>
              <th className={headerCell}>DESCRIPCIÓN</th>
              <th className={`${headerCell} w-[28px]`}>S</th>
              <th className={`${headerCell} w-[28px]`}>ER</th>
              <th className={`${headerCell} w-[28px]`}>PI</th>
              <th className={`${headerCell} w-[28px]`}>NA</th>
              <th className={`${headerCell} w-[180px]`}>OBSERVACIONES</th>
            </tr>
          </thead>
          <tbody>
            {CATALOGO_F120.filter((s) => s.id >= 9).map((seccion) => (
              <React.Fragment key={seccion.id}>
                {/* Encabezado de sección */}
                <tr>
                  <td className={`${cell} font-bold bg-gray-200 text-[8px]`} colSpan={7}>
                    {seccion.id}. {seccion.nombre}
                  </td>
                </tr>
                {/* Ítems de la sección */}
                {seccion.items.map((item) => {
                  const eval_ = itemsMap.get(item.codigo);
                  const calif = eval_?.calificacion;
                  return (
                    <tr key={item.codigo}>
                      <td className={cellCenter}>{item.codigo}</td>
                      <td className={`${cell} text-[8px]`}>{item.descripcion}</td>
                      <td className={cellCenter}>{calif === 'S' ? '✕' : ''}</td>
                      <td className={`${cellCenter} ${calif === 'ER' ? 'bg-amber-100 font-bold' : ''}`}>{calif === 'ER' ? '✕' : ''}</td>
                      <td className={`${cellCenter} ${calif === 'PI' ? 'bg-red-100 font-bold' : ''}`}>{calif === 'PI' ? '✕' : ''}</td>
                      <td className={cellCenter}>{calif === 'NA' ? '✕' : ''}</td>
                      <td className={`${cell} text-[7px] italic`}>{eval_?.observacion || ''}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══════════════════ PÁGINA 3: Levantamiento + Charla ═══════════════════ */}
      <div className="page-break-inside-avoid mt-2" style={{ breakBefore: 'page' }}>
        <DocumentHeader datos={datos} codigo={codigo} pagina="3 de 4" />

        {/* Se corrigieron hallazgos */}
        <table className="w-full border-collapse border border-black mt-0">
          <tbody>
            <tr>
              <td className={`${headerCell} w-[280px]`}>
                ¿SE CORRIGIERON LOS HALLAZGOS DURANTE LA INSPECCIÓN?
              </td>
              <td className={cellCenter}>
                {(isF120 && datos.se_corrigieron_hallazgos) ? '☑ SÍ' : '☐ SÍ'}
              </td>
              <td className={cellCenter}>
                {(isF120 && !datos.se_corrigieron_hallazgos) ? '☑ NO' : '☐ NO'}
              </td>
              <td className={`${headerCell} w-[100px]`}>Modalidad</td>
              <td className={cell}>
                {modalidad === 'CON_ACOMPANAMIENTO' ? 'Con acompañamiento' : 'Sin acompañamiento'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Tabla de hallazgos y levantamiento */}
        <table className="w-full border-collapse border border-black mt-0">
          <thead>
            <tr>
              <th className={`${headerCell} w-[40px]`}>ÍTEM</th>
              <th className={headerCell}>RESULTADO DE LA INSPECCIÓN (Hallazgo)</th>
              <th className={headerCell}>ACCIONES PARA EL LEVANTAMIENTO DE LA OBSERVACIÓN (Corrección)</th>
            </tr>
          </thead>
          <tbody>
            {hallazgos.length > 0 ? hallazgos.map((h, i) => (
              <tr key={i}>
                <td className={`${cellCenter} font-mono font-bold`}>{h.item_ref}</td>
                <td className={`${cell} text-[8px]`}>{h.descripcion_hallazgo}</td>
                <td className={`${cell} text-[8px]`}>{h.accion_levantamiento}</td>
              </tr>
            )) : (
              <tr>
                <td className={cellCenter}>—</td>
                <td className={cell}>Sin hallazgos registrados</td>
                <td className={cell}>—</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Personal involucrado */}
        <table className="w-full border-collapse border border-black mt-2">
          <thead>
            <tr>
              <th className={headerCell} colSpan={2}>PERSONAL INVOLUCRADO EN LA INSPECCIÓN</th>
            </tr>
            <tr>
              <th className={`${headerCell} w-1/2`}>NOMBRES Y APELLIDOS</th>
              <th className={headerCell}>CARGO / PUESTO</th>
            </tr>
          </thead>
          <tbody>
            {personal.length > 0 ? personal.map((p, i) => (
              <tr key={i}>
                <td className={`${cell} font-semibold`}>{p.nombre_completo}</td>
                <td className={cell}>{p.cargo}</td>
              </tr>
            )) : (
              <tr>
                <td className={cell}>—</td>
                <td className={cell}>—</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Retroalimentación / Charla */}
        {charla && (
          <table className="w-full border-collapse border border-black mt-2">
            <thead>
              <tr>
                <th className={headerCell} colSpan={4}>RETROALIMENTACIÓN / CHARLA DE SEGURIDAD</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={`${headerCell} w-[80px]`}>Tema</td>
                <td className={cell} colSpan={3}>{charla.tema}</td>
              </tr>
              <tr>
                <td className={headerCell}>Hora Desde</td>
                <td className={cell}>{charla.hora_desde}</td>
                <td className={headerCell}>Hora Hasta</td>
                <td className={cell}>{charla.hora_hasta}</td>
              </tr>
              <tr>
                <td className={headerCell}>N° Participantes</td>
                <td className={cell}>{charla.num_participantes}</td>
                <td className={headerCell}>Expositor</td>
                <td className={cell}>{charla.nombre_expositor}</td>
              </tr>
              {charla.participantes.length > 0 && (
                <>
                  <tr>
                    <th className={`${headerCell}`} colSpan={2}>PARTICIPANTE</th>
                    <th className={headerCell} colSpan={2}>CARGO</th>
                  </tr>
                  {charla.participantes.map((p, i) => (
                    <tr key={i}>
                      <td className={cell} colSpan={2}>{p.nombre}</td>
                      <td className={cell} colSpan={2}>{p.cargo || '—'}</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        )}

        {/* Inspector encargado */}
        <table className="w-full border-collapse border border-black mt-2">
          <tbody>
            <tr>
              <td className={`${headerCell} w-[160px]`}>INSPECTOR ENCARGADO</td>
              <td className={cell}>{inspector?.nombre || ''}</td>
              <td className={`${headerCell} w-[80px]`}>CARGO</td>
              <td className={cell}>{inspector?.cargo || ''}</td>
            </tr>
          </tbody>
        </table>

        {/* Firmas */}
        <div className="grid grid-cols-2 gap-8 mt-6 px-4">
          <div className="text-center">
            <div className="h-12 border-b border-black mb-1" />
            <p className="font-bold text-[9px]">{inspector?.nombre || inspectorName || activity.responsable_nombre}</p>
            <p className="text-[8px] text-gray-600">{inspector?.cargo || 'Inspector HSE'}</p>
          </div>
          <div className="text-center">
            <div className="h-12 border-b border-black mb-1" />
            <p className="font-bold text-[9px]">Responsable del Área</p>
            <p className="text-[8px] text-gray-600">Aprobación</p>
          </div>
        </div>
      </div>

      {/* ═══════════════════ PÁGINA 4: Evidencia Fotográfica ═══════════════════ */}
      <div className="page-break-inside-avoid mt-2" style={{ breakBefore: 'page' }}>
        <DocumentHeader datos={datos} codigo={codigo} pagina="4 de 4" />

        <table className="w-full border-collapse border border-black mt-0">
          <thead>
            <tr>
              <th className={`${headerCell} w-[40px]`}>ÍTEM</th>
              <th className={headerCell}>REGISTRO FOTOGRÁFICO HALLAZGOS</th>
              <th className={headerCell}>MEDIDAS CORRECTIVAS</th>
              <th className={headerCell}>REGISTRO FOTOGRÁFICO DE LAS MEDIDAS CORRECTIVAS</th>
            </tr>
          </thead>
          <tbody>
            {hallazgos.length > 0 ? hallazgos.map((h, i) => {
              const hallazgoUrl = h.evidencia_hallazgo_id ? thumbUrls[h.evidencia_hallazgo_id] : undefined;
              const correccionUrl = h.evidencia_correccion_id ? thumbUrls[h.evidencia_correccion_id] : undefined;

              return (
                <tr key={i}>
                  <td className={`${cellCenter} font-mono font-bold`}>{h.item_ref}</td>
                  <td className={`${cellCenter}`} style={{ height: '120px' }}>
                    {hallazgoUrl ? (
                      <img src={hallazgoUrl} alt={`Hallazgo ${h.item_ref}`} className="max-h-[110px] mx-auto object-contain" />
                    ) : (
                      <span className="text-[8px] text-gray-400 italic">Sin foto de hallazgo</span>
                    )}
                  </td>
                  <td className={`${cell} text-[8px] align-top`}>{h.accion_levantamiento}</td>
                  <td className={`${cellCenter}`} style={{ height: '120px' }}>
                    {h.no_requiere_foto_correccion ? (
                      <span className="text-[8px] text-gray-500 italic">No requiere registro fotográfico adicional</span>
                    ) : correccionUrl ? (
                      <img src={correccionUrl} alt={`Corrección ${h.item_ref}`} className="max-h-[110px] mx-auto object-contain" />
                    ) : (
                      <span className="text-[8px] text-gray-400 italic">Sin foto de corrección</span>
                    )}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td className={cellCenter} colSpan={4}>
                  <div className="py-6 text-gray-400 italic text-[9px]">
                    No se registraron hallazgos con evidencia fotográfica en esta inspección.
                  </div>
                </td>
              </tr>
            )}
            {/* Evidencias adicionales vinculadas */}
            {evidences.length > 0 && (
              <>
                <tr>
                  <td className={`${headerCell}`} colSpan={4}>EVIDENCIAS FOTOGRÁFICAS ADICIONALES VINCULADAS</td>
                </tr>
                {evidences.map(({ evidencia, identificacion }) => (
                  <tr key={evidencia.id}>
                    <td className={cellCenter}>—</td>
                    <td className={`${cellCenter}`} style={{ height: '100px' }}>
                      {thumbUrls[evidencia.id] ? (
                        <img src={thumbUrls[evidencia.id]} alt={evidencia.nombre_archivo} className="max-h-[90px] mx-auto object-contain" />
                      ) : (
                        <span className="text-[8px] text-gray-400">{evidencia.nombre_archivo}</span>
                      )}
                    </td>
                    <td className={`${cell} text-[8px]`}>
                      <div className="font-mono text-[7px] text-gray-500 break-all">SHA-256: {evidencia.hash_sha256}</div>
                      {identificacion && (
                        <div className="mt-1 font-semibold">
                          {identificacion.nombres} {identificacion.apellido_paterno} {identificacion.apellido_materno}
                          {identificacion.cargo && <span className="font-normal text-gray-600"> — {identificacion.cargo}</span>}
                        </div>
                      )}
                    </td>
                    <td className={cellCenter}>
                      <span className="text-[8px] text-gray-400 italic">N/A</span>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InspectionReportTemplate;
