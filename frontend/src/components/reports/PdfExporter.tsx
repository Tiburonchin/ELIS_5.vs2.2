import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { InspectionReportTemplate } from './InspectionReportTemplate';
import { AmonestacionReportTemplate } from './AmonestacionReportTemplate';
import type { ActividadRow } from '@/services/ActivityService';
import type { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Printer, FileText, AlertTriangle } from 'lucide-react';
import { evidenceService } from '@/services/EvidenceService';

export type LinkedEvidenceItem = {
  vinculo: Database['public']['Tables']['vinculos']['Row'];
  evidencia: Database['public']['Tables']['evidencias']['Row'];
  identificacion: Database['public']['Tables']['identificaciones']['Row'] | null;
};

export interface PdfExporterProps {
  actividad: ActividadRow;
  evidenciasVinculadas: LinkedEvidenceItem[];
  bucketName?: string;
  inspectorName?: string;
  inspectorCargo?: string;
  onAfterPrint?: () => void;
  className?: string;
  /** Permite forzar el formato o alternarlo dinámicamente */
  forcedFormat?: 'INSPECCION' | 'AMONESTACION';
}

export const PdfExporter: React.FC<PdfExporterProps> = ({
  actividad,
  evidenciasVinculadas,
  bucketName = 'evidencias',
  inspectorName,
  inspectorCargo,
  onAfterPrint,
  className = '',
  forcedFormat,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [activeFormat, setActiveFormat] = useState<'INSPECCION' | 'AMONESTACION'>(
    forcedFormat || (actividad.tipo_actividad === 'AMONESTACION' ? 'AMONESTACION' : 'INSPECCION')
  );

  useEffect(() => {
    if (forcedFormat) {
      setActiveFormat(forcedFormat);
    }
  }, [forcedFormat]);

  const isAmonestacion = activeFormat === 'AMONESTACION';
  const documentTitle = isAmonestacion
    ? `Amonestacion_HSE_EL_F_128_${actividad.codigo_referencia || 'F128'}`
    : `Inspeccion_HSE_EL_F_120_${actividad.codigo_referencia || 'F120'}`;

  // Resuelve URLs de Storage de forma dual
  useEffect(() => {
    let isMounted = true;
    const fetchUrls = async () => {
      const items = evidenciasVinculadas.map((item) => item.evidencia);
      const batchMap = await evidenceService.getEvidenceBatchImageUrls(items, {
        type: 'thumb',
        bucketName,
      });
      if (isMounted) {
        setThumbUrls(batchMap);
      }
    };

    fetchUrls();
    return () => {
      isMounted = false;
    };
  }, [evidenciasVinculadas, bucketName]);

  const handlePrint = useReactToPrint({
    contentRef: contentRef as any,
    documentTitle,
    onAfterPrint: () => {
      if (onAfterPrint) onAfterPrint();
    },
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 8mm;
      }
      @media print {
        html, body {
          width: 210mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          color: black !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .page-container {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      }
    `,
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Botón de Acción Principal y Selector de Modelo para Exportar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-muted/30 print:hidden">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isAmonestacion ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
            {isAmonestacion ? <AlertTriangle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-tight">
              {isAmonestacion ? 'Formato Oficial HSE-EL-F-128 (1 Página)' : 'Formato Oficial HSE-EL-F-120 (4 Páginas)'}
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {isAmonestacion
                ? 'Registro de Amonestación laboral con estructura tabular normativa de P.A. Perú.'
                : 'Inspección de HSE en doble columna, levantamiento de hallazgos y evidencia fotográfica.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector interactivo de plantilla */}
          <div className="inline-flex rounded-lg border border-border bg-background p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveFormat('INSPECCION')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                !isAmonestacion
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              F-120 Inspección (4 Págs)
            </button>
            <button
              type="button"
              onClick={() => setActiveFormat('AMONESTACION')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                isAmonestacion
                  ? 'bg-destructive text-destructive-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              F-128 Amonestación (1 Pág)
            </button>
          </div>

          <Button
            type="button"
            onClick={() => handlePrint()}
            className="cursor-pointer gap-2 text-xs font-semibold h-9 shrink-0 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Descargar / Imprimir PDF Oficial</span>
          </Button>
        </div>
      </div>

      {/* Contenedor de la Ficha: Visible como previsualización interactiva y fuente de impresión */}
      <div className="overflow-x-auto bg-gray-100 p-2 sm:p-6 rounded-xl border border-border flex justify-center">
        <div ref={contentRef} className="shadow-2xl print:shadow-none bg-white">
          {isAmonestacion ? (
            <AmonestacionReportTemplate
              activity={actividad}
              evidences={evidenciasVinculadas}
              inspectorName={inspectorName || actividad.responsable_nombre}
              inspectorCargo={inspectorCargo || 'SUPERVISOR HSE'}
              thumbUrls={thumbUrls}
            />
          ) : (
            <InspectionReportTemplate
              activity={actividad}
              evidences={evidenciasVinculadas}
              inspectorName={inspectorName || actividad.responsable_nombre}
              inspectorCargo={inspectorCargo || 'SUPERVISOR HSE'}
              thumbUrls={thumbUrls}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfExporter;
