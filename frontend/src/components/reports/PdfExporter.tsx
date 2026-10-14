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
}

export const PdfExporter: React.FC<PdfExporterProps> = ({
  actividad,
  evidenciasVinculadas,
  bucketName = 'evidencias',
  inspectorName,
  inspectorCargo,
  onAfterPrint,
  className = '',
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});

  const isAmonestacion = actividad.tipo_actividad === 'AMONESTACION';
  const documentTitle = isAmonestacion
    ? `Amonestacion_HSE_EL_F_128_${actividad.codigo_referencia}`
    : `Checklist_Inspeccion_${actividad.codigo_referencia}`;

  // Resuelve URLs de Storage de forma dual (Signed URLs con fallback a Public URLs y limpieza de prefijo)
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
        margin: 12mm 10mm 15mm 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          background: white !important;
          color: black !important;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-muted/30 print:hidden">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isAmonestacion ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
            {isAmonestacion ? <AlertTriangle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-tight">
              {isAmonestacion ? 'Formato Oficial HSE-EL-F-128' : 'Checklist de Inspección HSE (15 Secciones)'}
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Listo para impresión directa o descarga en PDF formato A4 de alta fidelidad.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => handlePrint()}
          className="cursor-pointer gap-2 text-xs font-semibold h-9 shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>Descargar / Imprimir Reporte Oficial</span>
        </Button>
      </div>

      {/* Contenedor de la Ficha: Visible como previsualización interactiva y fuente de impresión */}
      <div className="overflow-x-auto bg-card p-2 sm:p-6 rounded-xl border border-border">
        <div ref={contentRef}>
          {isAmonestacion ? (
            <AmonestacionReportTemplate
              activity={actividad}
              evidences={evidenciasVinculadas}
              inspectorName={inspectorName || actividad.responsable_nombre}
              inspectorCargo={inspectorCargo || 'Inspector HSE'}
              thumbUrls={thumbUrls}
            />
          ) : (
            <InspectionReportTemplate
              activity={actividad}
              evidences={evidenciasVinculadas}
              inspectorName={inspectorName || actividad.responsable_nombre}
              inspectorCargo={inspectorCargo || 'Inspector HSE'}
              thumbUrls={thumbUrls}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfExporter;
