import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { InspectionReportTemplate, type LinkedEvidenceItem } from './InspectionReportTemplate';
import type { ActividadRow } from '../../services/ActivityService';

export interface PdfExporterProps {
  actividad: ActividadRow;
  evidenciasVinculadas: LinkedEvidenceItem[];
  bucketName?: string;
  inspectorName?: string;
  onAfterPrint?: () => void;
  className?: string;
}

/**
 * Componente PdfExporter: Envuelve a InspectionReportTemplate y proporciona el botón
 * para disparar la exportación/impresión oficial a PDF mediante react-to-print.
 */
export const PdfExporter: React.FC<PdfExporterProps> = ({
  actividad,
  evidenciasVinculadas,
  bucketName = 'evidencias',
  inspectorName,
  onAfterPrint,
  className = '',
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: contentRef as any,
    documentTitle: `Ficha_Inspeccion_${actividad.codigo_referencia}`,
    onAfterPrint: () => {
      if (onAfterPrint) onAfterPrint();
    },
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 12mm 10mm 15mm 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          background: white !important;
        }
        .page-break-inside-avoid {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
      }
    `,
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Botón de Acción Principal para Exportar */}
      <div className="flex items-center gap-3 print:hidden">
        <button
          type="button"
          onClick={() => handlePrint()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-md shadow-sky-500/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Descargar / Imprimir Ficha PDF</span>
        </button>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          Formato oficial A4 con Hash SHA-256 inmutable y lecturas OCR
        </span>
      </div>

      {/* Contenedor de la Ficha: Visible como previsualización y como fuente de impresión */}
      <div className="overflow-x-auto bg-slate-100 dark:bg-slate-900/60 p-2 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <InspectionReportTemplate
          ref={contentRef}
          actividad={actividad}
          evidenciasVinculadas={evidenciasVinculadas}
          bucketName={bucketName}
          inspectorName={inspectorName}
        />
      </div>
    </div>
  );
};

export default PdfExporter;
