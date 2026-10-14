import { forwardRef } from 'react';
import type { ActividadRow } from '../../services/ActivityService';
import type { EvidenciaRow } from '../../services/EvidenceService';
import type { IdentificacionRow } from '../../services/OcrService';
import type { Database } from '../../types/database.types';
import { supabase } from '../../lib/supabaseClient';

export interface LinkedEvidenceItem {
  vinculo: Database['public']['Tables']['vinculos']['Row'];
  evidencia: EvidenciaRow;
  identificacion: IdentificacionRow | null;
}

export interface InspectionReportTemplateProps {
  actividad: ActividadRow;
  evidenciasVinculadas: LinkedEvidenceItem[];
  bucketName?: string;
  inspectorName?: string;
}

/**
 * Plantilla formal de Ficha de Inspección Técnica (Hoja A4)
 * Diseñada para vista previa e impresión a PDF con react-to-print.
 * Muestra metadatos de la actividad, evidencias fotográficas, resultados OCR y Hash SHA-256 de integridad.
 */
export const InspectionReportTemplate = forwardRef<HTMLDivElement, InspectionReportTemplateProps>(
  ({ actividad, evidenciasVinculadas, bucketName = 'evidencias', inspectorName }, ref) => {
    const formattedFechaOperacion = actividad.fecha_operacion
      ? new Date(actividad.fecha_operacion).toLocaleDateString('es-PE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'No registrada';

    const fechaGeneracion = new Date().toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div
        ref={ref}
        className="w-full bg-white text-slate-900 p-8 sm:p-12 font-sans max-w-[210mm] mx-auto min-h-[297mm] shadow-lg print:shadow-none print:m-0 print:p-8 print:w-full print:max-w-none print:bg-white text-[13px] leading-relaxed"
        style={{
          boxSizing: 'border-box',
        }}
      >
        {/* Encabezado Oficial */}
        <header className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-extrabold text-xl shadow-inner">
                E
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  ELIS 5.0 — FICHA DE INSPECCIÓN TÉCNICA
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Sistema de Registro Inmutable y Evidencias Digitales &bull; Control Operativo Forense
                </p>
              </div>
            </div>

            <div className="text-right border-l-2 border-slate-200 pl-4">
              <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Código de Referencia
              </span>
              <span className="text-base font-black text-sky-700 tracking-wide font-mono">
                {actividad.codigo_referencia}
              </span>
            </div>
          </div>
        </header>

        {/* Datos Principales de la Actividad */}
        <section className="mb-6 bg-slate-50 rounded-xl p-4 border border-slate-200 page-break-inside-avoid">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 border-b border-slate-200 pb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-600" />
            1. Información General de la Actividad
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="block text-[11px] font-semibold text-slate-500">Tipo de Actividad:</span>
              <span className="font-bold text-slate-800 capitalize">{actividad.tipo_actividad}</span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-500">Ubicación / Sector:</span>
              <span className="font-bold text-slate-800">{actividad.ubicacion}</span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-500">Fecha de Operación:</span>
              <span className="font-bold text-slate-800">{formattedFechaOperacion}</span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-500">Responsable Registrado:</span>
              <span className="font-bold text-slate-800">{actividad.responsable_nombre}</span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-500">Estado del Reporte:</span>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-300">
                {actividad.estado_reporte}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-500">Inspector Emisor:</span>
              <span className="font-semibold text-slate-700">{inspectorName || 'Operario de Campo'}</span>
            </div>
          </div>

          {actividad.descripcion && (
            <div className="mt-3 pt-2 border-t border-slate-200">
              <span className="block text-[11px] font-semibold text-slate-500 mb-0.5">Descripción de Campo:</span>
              <p className="text-xs text-slate-700 whitespace-pre-line bg-white p-2.5 rounded-lg border border-slate-200 italic">
                "{actividad.descripcion}"
              </p>
            </div>
          )}
        </section>

        {/* Evidencias Fotográficas e Identificaciones OCR */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-1">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              2. Evidencias Fotográficas y Verificación de Personal ({evidenciasVinculadas.length})
            </h2>
            <span className="text-[11px] text-slate-500">Verificadas con OCR en cliente</span>
          </div>

          {evidenciasVinculadas.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
              No hay evidencias fotográficas vinculadas a esta actividad.
            </div>
          ) : (
            <div className="space-y-4">
              {evidenciasVinculadas.map((item, index) => {
                const { evidencia, identificacion, vinculo } = item;
                const thumbPath = evidencia.ruta_thumb || evidencia.ruta_storage;
                const imgUrl = thumbPath
                  ? supabase.storage.from(bucketName).getPublicUrl(thumbPath).data.publicUrl
                  : '';

                const fechaCapturaFormatted = evidencia.fecha_captura
                  ? new Date(evidencia.fecha_captura).toLocaleString('es-PE', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })
                  : 'N/A';

                return (
                  <div
                    key={evidencia.id}
                    className="border border-slate-200 rounded-xl p-3 bg-white shadow-xs page-break-inside-avoid print:break-inside-avoid"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      {/* Miniatura Fotográfica */}
                      <div className="w-full sm:w-44 shrink-0 flex flex-col items-center">
                        <div className="w-full h-36 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={evidencia.nombre_archivo}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">Sin imagen</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 truncate max-w-[170px]" title={evidencia.nombre_archivo}>
                          Item #{index + 1}: {evidencia.nombre_archivo}
                        </span>
                      </div>

                      {/* Metadatos Forenses y OCR */}
                      <div className="flex-1 w-full space-y-2">
                        {/* Fila 1: Cabecera del Item */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <div>
                            <span className="text-xs font-bold text-slate-800">
                              Evidencia Fotográfica N° {index + 1}
                            </span>
                            <span className="text-[11px] text-slate-500 ml-2">
                              Captura: {fechaCapturaFormatted}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {evidencia.estado}
                          </span>
                        </div>

                        {/* Fila 2: Identificación OCR */}
                        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80">
                          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Personal Detectado e Identificado (Fotocheck):
                          </span>
                          {identificacion ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-slate-500 text-[11px]">Nombres y Apellidos: </span>
                                <strong className="text-slate-900 font-semibold">
                                  {identificacion.nombres} {identificacion.apellido_paterno} {identificacion.apellido_materno}
                                </strong>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[11px]">Cargo Operativo: </span>
                                <span className="text-slate-800 font-medium">
                                  {identificacion.cargo || 'No consignado'}
                                </span>
                              </div>
                              <div className="sm:col-span-2 flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60 mt-1">
                                <span>
                                  Validado por: <b>{identificacion.confirmador_email || 'Inspector'}</b>
                                </span>
                                <span>
                                  Confianza OCR:{' '}
                                  <b className="text-emerald-700">
                                    {identificacion.nivel_confianza ? `${identificacion.nivel_confianza}%` : 'Validado'}
                                  </b>
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-amber-700 italic flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Sin identificación de fotocheck registrada para esta captura.
                            </p>
                          )}
                        </div>

                        {/* Fila 3: Código de Integridad Criptográfico (Hash SHA-256) */}
                        <div className="bg-slate-900 text-slate-100 p-2 rounded-lg text-[10px] font-mono flex flex-col gap-0.5">
                          <span className="text-slate-400 font-sans uppercase font-bold text-[9px] tracking-wider">
                            Código de Integridad Criptográfica (SHA-256):
                          </span>
                          <span className="break-all tracking-wider font-semibold text-sky-300">
                            {evidencia.hash_sha256}
                          </span>
                        </div>

                        {vinculo.notas && (
                          <div className="text-[11px] text-slate-600 italic">
                            <span className="font-semibold text-slate-500">Notas de vinculación: </span>
                            {vinculo.notas}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Sección de Firmas y Declaración Legal */}
        <section className="mt-8 pt-4 border-t-2 border-slate-200 page-break-inside-avoid print:break-inside-avoid">
          <div className="grid grid-cols-2 gap-8 text-center text-xs mt-12">
            <div>
              <div className="border-t border-slate-800 mx-auto w-48 mb-1" />
              <p className="font-bold text-slate-800">{actividad.responsable_nombre}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Responsable de Operación / Actividad</p>
            </div>

            <div>
              <div className="border-t border-slate-800 mx-auto w-48 mb-1" />
              <p className="font-bold text-slate-800">{inspectorName || 'Firma de Inspector Autorizado'}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Inspector Técnico ELIS 5.0</p>
            </div>
          </div>

          {/* Pie de Página del Reporte */}
          <footer className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Generado el: {fechaGeneracion}</span>
            <span>Documento generado con ELIS 5.0 Cloud-Native &bull; Hash Verificado</span>
            <span>Página 1 de 1</span>
          </footer>
        </section>
      </div>
    );
  }
);

InspectionReportTemplate.displayName = 'InspectionReportTemplate';

export default InspectionReportTemplate;
