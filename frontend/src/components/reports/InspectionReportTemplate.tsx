import React from 'react';
import type { ActividadRow } from '@/services/ActivityService';
import type { Database } from '@/types/database.types';
import {
  PA_PERU_INFO,
  CATALOGO_F120,
  type FormatoInspeccionF120,
  type CalificacionHSE,
} from '@/types/hseFormats';
import { PaPeruLogo } from './PaPeruLogo';

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

/** Estilos de impresión y celdas 1:1 Pixel-Perfect */
const cellBorder = 'border border-black';
const headerGray = 'bg-[#e5e7eb] font-bold text-black uppercase tracking-tight';

/** Membrete oficial de P.A. Perú repetido en cada página (1 a 4) */
const OfficialHeader: React.FC<{ paginaNum: number; totalPaginas?: number; fecha?: string }> = ({
  paginaNum,
  totalPaginas = 4,
  fecha = '13/01/2025',
}) => (
  <table className={`w-full border-collapse ${cellBorder} mb-1 bg-white text-black`} style={{ tableLayout: 'fixed' }}>
    <tbody>
      <tr>
        {/* Bloque Izquierdo: Logo P.A. Perú */}
        <td className={`${cellBorder} p-1 text-center align-middle`} style={{ width: '28%' }}>
          <div className="flex items-center justify-center py-0.5">
            <PaPeruLogo className="h-9" />
          </div>
        </td>

        {/* Bloque Central: FORMATO / INSPECCIÓN DE HSE */}
        <td className={`${cellBorder} p-1 text-center align-middle`} style={{ width: '47%' }}>
          <div className="font-bold text-[10px] tracking-wide leading-tight">FORMATO</div>
          <div className="font-extrabold text-[11px] uppercase tracking-wide leading-snug mt-0.5">
            INSPECCIÓN DE HSE
          </div>
        </td>

        {/* Bloque Derecho: Subtabla documental de 4 filas */}
        <td className={`${cellBorder} p-0 align-middle`} style={{ width: '25%' }}>
          <table className="w-full border-collapse text-[7.5px] leading-tight">
            <tbody>
              <tr className="border-b border-black">
                <td className="font-bold px-1 py-0.5 border-r border-black w-[45%] bg-gray-50">Código:</td>
                <td className="px-1 py-0.5 font-bold">HSE-EL-F-120</td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-bold px-1 py-0.5 border-r border-black bg-gray-50">Versión:</td>
                <td className="px-1 py-0.5">02</td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-bold px-1 py-0.5 border-r border-black bg-gray-50">Fecha:</td>
                <td className="px-1 py-0.5">{fecha}</td>
              </tr>
              <tr>
                <td className="font-bold px-1 py-0.5 border-r border-black bg-gray-50">Página:</td>
                <td className="px-1 py-0.5 font-bold">{paginaNum} de {totalPaginas}</td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
);

/** Subcomponente para renderizar una sección o partición de sección en una columna */
const ChecklistColumnSection: React.FC<{
  seccionId: number;
  seccionNombre: string;
  items: Array<{ codigo: string; descripcion: string }>;
  itemsMap: Map<string, { calificacion: CalificacionHSE; observacion?: string }>;
  isContinuation?: boolean;
}> = ({ seccionId, seccionNombre, items, itemsMap, isContinuation }) => {
  return (
    <div className="mb-1 border-t border-black">
      <table className="w-full border-collapse text-[7px] leading-[9px]" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className={headerGray}>
            <th
              className={`${cellBorder} px-0.5 py-0.5 text-left font-bold uppercase truncate`}
              style={{ width: '74%' }}
            >
              {seccionId} {seccionNombre} {isContinuation ? '(Cont.)' : ''}
            </th>
            <th className={`${cellBorder} p-0 text-center font-bold`} colSpan={4} style={{ width: '26%' }}>
              <div className="border-b border-black py-0.2 text-[6.5px]">ESTADO</div>
              <div className="grid grid-cols-4 text-[6.5px]">
                <span className="border-r border-black">S</span>
                <span className="border-r border-black">ER</span>
                <span className="border-r border-black">PI</span>
                <span>NA</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const eval_ = itemsMap.get(item.codigo);
            const calif = eval_?.calificacion || 'S';
            const isER = calif === 'ER';
            const isPI = calif === 'PI';

            return (
              <tr key={item.codigo} className={isER ? 'bg-amber-50' : isPI ? 'bg-red-50' : ''}>
                <td className={`${cellBorder} px-1 py-0.5 text-left align-top font-normal text-[6.8px]`}>
                  <strong className="font-semibold">{item.codigo}</strong> {item.descripcion}
                </td>
                <td className={`${cellBorder} text-center align-middle font-bold text-[7.5px] p-0`} style={{ width: '6.5%' }}>
                  {calif === 'S' ? 'X' : ''}
                </td>
                <td className={`${cellBorder} text-center align-middle font-bold text-[7.5px] p-0 ${isER ? 'bg-amber-200 text-black' : ''}`} style={{ width: '6.5%' }}>
                  {isER ? 'X' : ''}
                </td>
                <td className={`${cellBorder} text-center align-middle font-bold text-[7.5px] p-0 ${isPI ? 'bg-red-200 text-black' : ''}`} style={{ width: '6.5%' }}>
                  {isPI ? 'X' : ''}
                </td>
                <td className={`${cellBorder} text-center align-middle font-bold text-[7.5px] p-0`} style={{ width: '6.5%' }}>
                  {calif === 'NA' ? 'X' : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

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
    proyecto: activity.ubicacion || 'CORTE Y RECONEXIÓN, LECTURA Y REPARTO DE SUMINISTROS',
    actividad: activity.tipo_actividad || 'CORTE Y RECONEXIÓN',
    lugar: activity.ubicacion || 'CHACARILLAS',
    supervisor_encargado: activity.responsable_nombre || 'DIEGO PAREDES',
    responsable_area: 'MIGUEL OBLITAS',
    fecha_inspeccion: activity.fecha_operacion || '05/10/2026',
    hora_inspeccion: '06:30',
  };

  // Mapa de ítems evaluados
  const itemsMap = new Map<string, { calificacion: CalificacionHSE; observacion?: string }>();
  if (isF120 && datos.items_evaluados) {
    for (const it of datos.items_evaluados) {
      itemsMap.set(it.codigo, { calificacion: it.calificacion, observacion: it.observacion });
    }
  } else {
    // Si no tiene evaluación previa, marcar 9.3 como ER si es el caso demo, o todo S
    itemsMap.set('9.3', { calificacion: 'ER', observacion: 'Oportunidad de mejora en conocimiento' });
  }

  const hallazgos = isF120 ? (datos.hallazgos_y_levantamiento || []) : [
    {
      item_ref: '9.3 - Instrucción previa en campo: refuerzo sobre actuación ante quemadura eléctrica.',
      descripcion_hallazgo: 'Durante la supervisión se identificó que el operario no había repasado qué hacer ante una quemadura eléctrica. Se registra como oportunidad de mejora de conocimiento.',
      accion_levantamiento: '9.3 - Se realiza retroalimentación inmediata sobre actuación ante quemadura eléctrica, considerando el antecedente de evento en la sucursal. OPORTUNIDAD DE MEJORA ATENDIDA.',
      no_requiere_foto_correccion: true,
    },
  ];

  const personal = isF120 && datos.personal_involucrado?.length ? datos.personal_involucrado : [
    {
      nombre_completo: 'VÍCTOR ALFONSO LLERENA RÍOS',
      cargo: 'OPERARIO DE CORTE Y RECONEXIÓN',
    },
  ];

  const charla = isF120 && datos.retroalimentacion_charla ? datos.retroalimentacion_charla : {
    tema: 'Actuación ante quemadura eléctrica y respuesta inicial frente a emergencias eléctricas.',
    hora_desde: '06:45',
    hora_hasta: '07:05',
    num_participantes: 1,
    nombre_expositor: 'ERICK ALEXANDER RAMOS TRUJILLO',
    participantes: [
      { nombre: 'VÍCTOR ALFONSO LLERENA RÍOS', cargo: 'OPERARIO DE CORTE Y RECONEXIÓN' },
    ],
  };

  const inspector = isF120 && datos.inspector_encargado ? datos.inspector_encargado : {
    nombre: inspectorName || 'ERICK ALEXANDER RAMOS TRUJILLO',
    cargo: 'SUPERVISOR HSE',
  };

  const modalidad = isF120 ? datos.modalidad_inspeccion : 'SIN_ACOMPANAMIENTO';

  // Catálogo indexado
  const secMap = new Map<number, (typeof CATALOGO_F120)[0]>();
  for (const s of CATALOGO_F120) {
    secMap.set(s.id, s);
  }

  // Partición de Sección 8:
  // P1 Columna Derecha: 8.1 al 8.3
  // P2 Columna Izquierda: 8.4 al 8.17
  const sec8 = secMap.get(8)!;
  const sec8_p1 = sec8 ? { ...sec8, items: sec8.items.slice(0, 3) } : { id: 8, nombre: 'EQUIPOS DE PROTECCIÓN PERSONAL', items: [] };
  const sec8_p2 = sec8 ? { ...sec8, items: sec8.items.slice(3) } : { id: 8, nombre: 'EQUIPOS DE PROTECCIÓN PERSONAL', items: [] };

  return (
    <div
      className="f120-report-root bg-white text-black font-sans leading-tight selection:bg-none"
      style={{
        width: '210mm',
        margin: '0 auto',
        padding: '0',
        boxSizing: 'border-box',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PÁGINA 1 DE 4 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="page-container page-1"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '8mm',
          boxSizing: 'border-box',
          pageBreakAfter: 'always',
          breakAfter: 'page',
        }}
      >
        <OfficialHeader paginaNum={1} />

        {/* Bloque 1: DATOS DE LA EMPRESA QUE REALIZA LA INSPECCIÓN */}
        <table className={`w-full border-collapse ${cellBorder} mb-1 bg-white text-[7.5px]`}>
          <thead>
            <tr className={headerGray}>
              <th className={`${cellBorder} px-1.5 py-0.5 text-center font-bold`} colSpan={4}>
                DATOS DE LA EMPRESA QUE REALIZA LA INSPECCIÓN
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={`${cellBorder} px-1.5 py-0.5 w-[25%]`}>
                <span className="font-bold">RAZÓN SOCIAL:</span><br />
                {PA_PERU_INFO.razon_social}
              </td>
              <td className={`${cellBorder} px-1.5 py-0.5 w-[15%]`}>
                <span className="font-bold">RUC:</span><br />
                {PA_PERU_INFO.ruc}
              </td>
              <td className={`${cellBorder} px-1.5 py-0.5 w-[35%]`}>
                <span className="font-bold">DOMICILIO:</span><br />
                {PA_PERU_INFO.domicilio}
              </td>
              <td className={`${cellBorder} px-1.5 py-0.5 w-[25%]`}>
                <span className="font-bold">TIPO DE ACTIVIDAD ECONÓMICA:</span><br />
                {PA_PERU_INFO.tipo_actividad_economica}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Bloque 2: DATOS DE LA EMPRESA INSPECCIONADA */}
        <table className={`w-full border-collapse ${cellBorder} mb-1 bg-white text-[7.5px]`}>
          <thead>
            <tr className={headerGray}>
              <th className={`${cellBorder} px-1.5 py-0.5 text-center font-bold`} colSpan={4}>
                DATOS DE LA EMPRESA INSPECCIONADA
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={`${cellBorder} px-1.5 py-0.5`} colSpan={3}>
                <span className="font-bold">PROYECTO:</span> {cabecera.proyecto}
              </td>
              <td className={`${cellBorder} px-1.5 py-0.5 w-[30%]`}>
                <span className="font-bold">LUGAR:</span> {cabecera.lugar}
              </td>
            </tr>
            <tr>
              <td className={`${cellBorder} px-1.5 py-0.5 w-[25%]`}>
                <span className="font-bold">ACTIVIDAD:</span><br />
                {cabecera.actividad}
              </td>
              <td className={`${cellBorder} px-1.5 py-0.5`} colSpan={2}>
                <span className="font-bold">RESPONSABLE DEL ÁREA O ACTIVIDAD INSPECCIONADA:</span><br />
                {cabecera.responsable_area}
              </td>
              <td className={`${cellBorder} px-1.5 py-0.5`}>
                <span className="font-bold">SUPERVISOR DEL TRABAJO ENCARGADO:</span><br />
                {cabecera.supervisor_encargado}
              </td>
            </tr>
            <tr>
              <td className={`${cellBorder} px-1.5 py-0.5`} colSpan={2}>
                <span className="font-bold">FECHA DE LA INSPECCIÓN:</span> {cabecera.fecha_inspeccion}
              </td>
              <td className={`${cellBorder} px-1.5 py-0.5`} colSpan={2}>
                <span className="font-bold">HORA DE LA INSPECCIÓN:</span> {cabecera.hora_inspeccion}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Barra de Leyenda */}
        <div className="border border-black px-1.5 py-0.5 text-[7px] font-bold bg-white mb-1">
          LEYENDA: S: Seguro, ER: En riesgo, PI: Peligro inminente, NA: No aplica
        </div>

        {/* Grilla a Doble Columna (Página 1) */}
        <div className="grid grid-cols-2 gap-1 items-start">
          {/* Columna Izquierda: Sección 1, 2, 3 */}
          <div>
            <ChecklistColumnSection
              seccionId={1}
              seccionNombre={secMap.get(1)!.nombre}
              items={secMap.get(1)!.items}
              itemsMap={itemsMap}
            />
            <ChecklistColumnSection
              seccionId={2}
              seccionNombre={secMap.get(2)!.nombre}
              items={secMap.get(2)!.items}
              itemsMap={itemsMap}
            />
            <ChecklistColumnSection
              seccionId={3}
              seccionNombre={secMap.get(3)!.nombre}
              items={secMap.get(3)!.items}
              itemsMap={itemsMap}
            />
          </div>

          {/* Columna Derecha: Sección 4, 5, 6, 7, 8 (8.1 al 8.3) */}
          <div>
            <ChecklistColumnSection
              seccionId={4}
              seccionNombre={secMap.get(4)!.nombre}
              items={secMap.get(4)!.items}
              itemsMap={itemsMap}
            />
            <ChecklistColumnSection
              seccionId={5}
              seccionNombre={secMap.get(5)!.nombre}
              items={secMap.get(5)!.items}
              itemsMap={itemsMap}
            />
            <ChecklistColumnSection
              seccionId={6}
              seccionNombre={secMap.get(6)!.nombre}
              items={secMap.get(6)!.items}
              itemsMap={itemsMap}
            />
            <ChecklistColumnSection
              seccionId={7}
              seccionNombre={secMap.get(7)!.nombre}
              items={secMap.get(7)!.items}
              itemsMap={itemsMap}
            />
            <ChecklistColumnSection
              seccionId={8}
              seccionNombre={sec8_p1.nombre}
              items={sec8_p1.items}
              itemsMap={itemsMap}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PÁGINA 2 DE 4 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="page-container page-2"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '8mm',
          boxSizing: 'border-box',
          pageBreakBefore: 'always',
          pageBreakAfter: 'always',
          breakBefore: 'page',
          breakAfter: 'page',
        }}
      >
        <OfficialHeader paginaNum={2} />

        {/* Grilla a Doble Columna (Página 2) */}
        <div className="grid grid-cols-2 gap-1 items-start mt-1">
          {/* Columna Izquierda: Continuación Sección 8 (8.4 al 8.17), 9, 10, 11 */}
          <div>
            <ChecklistColumnSection
              seccionId={8}
              seccionNombre={sec8_p2.nombre}
              items={sec8_p2.items}
              itemsMap={itemsMap}
              isContinuation={true}
            />
            <ChecklistColumnSection
              seccionId={9}
              seccionNombre={secMap.get(9)!.nombre}
              items={secMap.get(9)!.items}
              itemsMap={itemsMap}
            />
            <ChecklistColumnSection
              seccionId={10}
              seccionNombre={secMap.get(10)!.nombre}
              items={secMap.get(10)!.items}
              itemsMap={itemsMap}
            />
            <ChecklistColumnSection
              seccionId={11}
              seccionNombre={secMap.get(11)!.nombre}
              items={secMap.get(11)!.items}
              itemsMap={itemsMap}
            />
          </div>

          {/* Columna Derecha: Sección 12, 13, 14, 15 */}
          <div>
            <ChecklistColumnSection
              seccionId={12}
              seccionNombre={secMap.get(12)!.nombre}
              items={secMap.get(12)!.items}
              itemsMap={itemsMap}
            />
            <ChecklistColumnSection
              seccionId={13}
              seccionNombre={secMap.get(13)!.nombre}
              items={secMap.get(13)!.items}
              itemsMap={itemsMap}
            />
            <ChecklistColumnSection
              seccionId={14}
              seccionNombre={secMap.get(14)!.nombre}
              items={secMap.get(14)!.items}
              itemsMap={itemsMap}
            />
            <ChecklistColumnSection
              seccionId={15}
              seccionNombre={secMap.get(15)!.nombre}
              items={secMap.get(15)!.items}
              itemsMap={itemsMap}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PÁGINA 3 DE 4 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="page-container page-3"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '8mm',
          boxSizing: 'border-box',
          pageBreakBefore: 'always',
          pageBreakAfter: 'always',
          breakBefore: 'page',
          breakAfter: 'page',
        }}
      >
        <OfficialHeader paginaNum={3} />

        {/* Tabla RESULTADOS DE LA INSPECCIÓN */}
        <table className={`w-full border-collapse ${cellBorder} mb-2 bg-white text-[8px]`}>
          <thead>
            <tr className={headerGray}>
              <th className={`${cellBorder} px-2 py-1 text-center font-bold`} colSpan={2}>
                RESULTADOS DE LA INSPECCIÓN
              </th>
            </tr>
            <tr>
              <th className={`${cellBorder} px-2 py-1 text-center font-normal italic text-[7.5px] bg-gray-50`} colSpan={2}>
                ¿Se han corregido los hallazgos en riesgo y de peligro inminente? Indique nro. de hallazgos en riesgo o peligro inminente encontrados colocando o referenciando el Ítem correspondiente a su observación.
              </th>
            </tr>
          </thead>
          <tbody>
            {hallazgos.map((h, idx) => (
              <tr key={idx}>
                <td className={`${cellBorder} px-2 py-2 text-justify`} colSpan={2}>
                  <div className="font-bold mb-1 text-[8.5px]">{h.item_ref}</div>
                  <div className="text-[8px] leading-relaxed">{h.descripcion_hallazgo}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Tabla ACCIONES PARA EL LEVANTAMIENTO DE LA OBSERVACION */}
        <table className={`w-full border-collapse ${cellBorder} mb-2 bg-white text-[8px]`}>
          <thead>
            <tr className={headerGray}>
              <th className={`${cellBorder} px-2 py-1 text-center font-bold`}>
                ACCIONES PARA EL LEVANTAMIENTO DE LA OBSERVACION
              </th>
            </tr>
          </thead>
          <tbody>
            {hallazgos.map((h, idx) => (
              <tr key={idx}>
                <td className={`${cellBorder} px-2 py-2 text-justify text-[8px] leading-relaxed`}>
                  {h.accion_levantamiento}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Barra PERSONAL A INSPECCIONAR (MARCAR CON X) */}
        <table className={`w-full border-collapse ${cellBorder} mb-2 bg-white text-[8px]`}>
          <thead>
            <tr className={headerGray}>
              <th className={`${cellBorder} px-2 py-0.5 text-center font-bold`} colSpan={4}>
                PERSONAL A INSPECCIONAR (MARCAR CON X)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={`${cellBorder} px-2 py-1 w-[35%] font-medium`}>Con acompañamiento</td>
              <td className={`${cellBorder} px-2 py-1 w-[15%] text-center font-bold text-[9px]`}>
                {modalidad === 'CON_ACOMPANAMIENTO' ? 'X' : ''}
              </td>
              <td className={`${cellBorder} px-2 py-1 w-[35%] font-medium`}>Sin Acompañamiento</td>
              <td className={`${cellBorder} px-2 py-1 w-[15%] text-center font-bold text-[9px]`}>
                {modalidad === 'SIN_ACOMPANAMIENTO' ? 'X' : ''}
              </td>
            </tr>
          </tbody>
        </table>

        {/* RESPECTO A LO OBSERVADO SE REALIZÓ UNA RETROALIMENTACIÓN AL PERSONAL INVOLUCRADO */}
        <table className={`w-full border-collapse ${cellBorder} mb-2 bg-white text-[8px]`}>
          <thead>
            <tr className={headerGray}>
              <th className={`${cellBorder} px-2 py-1 text-center font-bold`} colSpan={4}>
                RESPECTO A LO OBSERVADO SE REALIZÓ UNA RETROALIMENTACIÓN AL PERSONAL INVOLUCRADO PARA APORTAR CONOCIMIENTOS OPORTUNOS
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={`${cellBorder} px-2 py-1 font-bold w-[30%]`}>Tema de la charla o capacitación:</td>
              <td className={`${cellBorder} px-2 py-1`} colSpan={3}>{charla.tema}</td>
            </tr>
            <tr>
              <td className={`${cellBorder} px-2 py-1 font-bold`}>Hora: Desde: {charla.hora_desde} Hasta: {charla.hora_hasta}</td>
              <td className={`${cellBorder} px-2 py-1 font-bold`}>N.º Participantes: {charla.num_participantes}</td>
              <td className={`${cellBorder} px-2 py-1 font-bold`} colSpan={2}>Nombre Expositor: {charla.nombre_expositor}</td>
            </tr>
            <tr className="bg-gray-100 font-bold text-[7.5px]">
              <td className={`${cellBorder} px-2 py-0.5`} colSpan={2}>Nombre de los participantes:</td>
              <td className={`${cellBorder} px-2 py-0.5 text-center`} colSpan={2}>Firma del participante:</td>
            </tr>
            {Array.from({ length: 7 }).map((_, i) => {
              const part = charla.participantes[i];
              return (
                <tr key={i} style={{ height: '18px' }}>
                  <td className={`${cellBorder} px-2 py-0.5 text-[7.5px]`} colSpan={2}>
                    {i + 1}. {part?.nombre || ''}
                  </td>
                  <td className={`${cellBorder} px-2 py-0.5 text-center`} colSpan={2}>
                    {part ? <span className="font-mono text-[7px] text-gray-400">___________________</span> : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* PERSONAL INVOLUCRADO EN LA OBSERVACIÓN */}
        <table className={`w-full border-collapse ${cellBorder} mb-2 bg-white text-[8px]`}>
          <thead>
            <tr className={headerGray}>
              <th className={`${cellBorder} px-2 py-0.5 text-center font-bold`} colSpan={2}>
                PERSONAL INVOLUCRADO EN LA OBSERVACIÓN.
              </th>
            </tr>
          </thead>
          <tbody>
            {personal.map((p, idx) => (
              <tr key={idx}>
                <td className={`${cellBorder} px-2 py-1 w-1/2`}>
                  <span className="font-bold">NOMBRE:</span> {p.nombre_completo}
                </td>
                <td className={`${cellBorder} px-2 py-1 w-1/2`}>
                  <span className="font-bold">CARGO:</span> {p.cargo}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* DATOS DEL INSPECTOR Y RESPONSABLE DE LA ACTIVIDAD */}
        <table className={`w-full border-collapse ${cellBorder} bg-white text-[8px]`}>
          <thead>
            <tr className={headerGray}>
              <th className={`${cellBorder} px-2 py-0.5 text-center font-bold`} colSpan={2}>
                DATOS DEL INSPECTOR Y RESPONSABLE DE LA ACTIVIDAD
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={`${cellBorder} px-2 py-1 w-1/2`}>
                <span className="font-bold">NOMBRE DEL INSPECTOR ENCARGADO:</span><br />
                {inspector.nombre}
              </td>
              <td className={`${cellBorder} px-2 py-1 w-1/2`}>
                <span className="font-bold">CARGO:</span><br />
                {inspector.cargo}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PÁGINA 4 DE 4 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="page-container page-4"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '8mm',
          boxSizing: 'border-box',
          pageBreakBefore: 'always',
          breakBefore: 'page',
        }}
      >
        <OfficialHeader paginaNum={4} />

        {/* Título de sección fotográfica */}
        <div className="font-bold text-[9px] uppercase tracking-wide py-1 text-center border-x border-t border-black bg-[#e5e7eb]">
          EVIDENCIA FOTOGRAFICA DE LA INSPECCIÓN
        </div>

        {/* Tabla de 4 columnas exactas */}
        <table className={`w-full border-collapse ${cellBorder} bg-white text-[7.5px]`} style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className={headerGray}>
              <th className={`${cellBorder} p-1 text-center font-bold`} style={{ width: '8%' }}>
                ÍTEM
              </th>
              <th className={`${cellBorder} p-1 text-center font-bold`} style={{ width: '38%' }}>
                REGISTROS FOTOGRÁFICO HALLAZGOS
              </th>
              <th className={`${cellBorder} p-1 text-center font-bold`} style={{ width: '27%' }}>
                MEDIDAS CORRECTIVAS
              </th>
              <th className={`${cellBorder} p-1 text-center font-bold`} style={{ width: '27%' }}>
                REGISTROS FOTOGRÁFICOS DE LAS MEDIDAS CORRECTIVAS
              </th>
            </tr>
          </thead>
          <tbody>
            {hallazgos.map((h, idx) => {
              const fotoHallazgoUrl = h.evidencia_hallazgo_id
                ? thumbUrls[h.evidencia_hallazgo_id]
                : '/demo-hallazgo-llerena.jpg';

              const fotoCorreccionUrl = h.evidencia_correccion_id
                ? thumbUrls[h.evidencia_correccion_id]
                : undefined;

              return (
                <tr key={idx}>
                  <td className={`${cellBorder} p-1 text-center font-bold align-top text-[8.5px]`}>
                    {h.item_ref.split(' ')[0] || '9.3'}
                  </td>
                  <td className={`${cellBorder} p-1.5 align-top`}>
                    <div className="mb-1 text-[7px] text-gray-700 italic">
                      Evidencia de supervisión — {cabecera.fecha_inspeccion}
                    </div>
                    <div className="text-[7.5px] leading-tight mb-2">
                      {h.descripcion_hallazgo}
                    </div>
                    <div className="flex justify-center border border-gray-300 p-1 bg-gray-50 rounded">
                      <img
                        src={fotoHallazgoUrl}
                        alt="Evidencia hallazgo"
                        className="max-h-[360px] w-auto object-contain rounded"
                      />
                    </div>
                  </td>
                  <td className={`${cellBorder} p-1.5 align-top text-[7.5px] leading-relaxed`}>
                    {h.accion_levantamiento}
                  </td>
                  <td className={`${cellBorder} p-2 text-center align-middle`}>
                    {h.no_requiere_foto_correccion ? (
                      <div className="font-bold text-[8px] text-gray-700 uppercase leading-snug px-1">
                        NO REQUIERE REGISTRO FOTOGRÁFICO ADICIONAL.
                      </div>
                    ) : fotoCorreccionUrl ? (
                      <div className="flex justify-center border border-gray-300 p-1 bg-gray-50 rounded">
                        <img
                          src={fotoCorreccionUrl}
                          alt="Evidencia corrección"
                          className="max-h-[260px] w-auto object-contain rounded"
                        />
                      </div>
                    ) : (
                      <div className="font-bold text-[8px] text-gray-500 uppercase leading-snug px-1">
                        NO REQUIERE REGISTRO FOTOGRÁFICO ADICIONAL.
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Si existen evidencias adicionales vinculadas en la base de datos */}
            {evidences.length > 0 && (
              <>
                <tr>
                  <td className={`${cellBorder} p-1 font-bold text-center bg-gray-200 text-[8px]`} colSpan={4}>
                    REGISTROS FOTOGRÁFICOS ADICIONALES DE CAMPO
                  </td>
                </tr>
                {evidences.map(({ evidencia, identificacion }) => (
                  <tr key={evidencia.id}>
                    <td className={`${cellBorder} p-1 text-center font-bold align-middle`}>—</td>
                    <td className={`${cellBorder} p-1.5 text-center align-middle`}>
                      <div className="flex justify-center mb-1">
                        {thumbUrls[evidencia.id] ? (
                          <img
                            src={thumbUrls[evidencia.id]}
                            alt={evidencia.nombre_archivo}
                            className="max-h-[140px] w-auto object-contain rounded"
                          />
                        ) : (
                          <span className="text-[7.5px] text-gray-400">{evidencia.nombre_archivo}</span>
                        )}
                      </div>
                      <div className="text-[6.5px] font-mono text-gray-500 break-all">
                        SHA-256: {evidencia.hash_sha256}
                      </div>
                    </td>
                    <td className={`${cellBorder} p-1.5 align-top text-[7.5px]`}>
                      {identificacion && (
                        <div>
                          <strong>Personal:</strong> {identificacion.nombres} {identificacion.apellido_paterno}
                          <br />
                          <strong>Cargo:</strong> {identificacion.cargo || 'Operario'}
                        </div>
                      )}
                    </td>
                    <td className={`${cellBorder} p-1 text-center align-middle text-[7.5px] text-gray-400 italic`}>
                      Registro de archivo
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
