import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EvidenceUploader } from '@/components/evidence/EvidenceUploader';
import { EvidenceGrid } from '@/components/evidence/EvidenceGrid';
import { useEvidences } from '@/hooks/useEvidences';
import type { EvidenciaRow, UploadEvidenceResult } from '@/services/EvidenceService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CloudCheck, Camera, ShieldCheck } from 'lucide-react';
import { SmartReportGeneratorModal } from '@/components/reports/SmartReportGeneratorModal';
import type { ActividadRow } from '@/services/ActivityService';

export interface InboxEvidencesProps {
  onSelectEvidence?: (evidence: EvidenciaRow) => void;
  onNotification?: (notification: { message: string; type: 'success' | 'info' }) => void;
  onSelectActivity?: (activity: ActividadRow) => void;
}

export const InboxEvidences: React.FC<InboxEvidencesProps> = ({
  onSelectEvidence,
  onNotification,
  onSelectActivity,
}) => {
  const [isSmartModalOpen, setIsSmartModalOpen] = useState<boolean>(false);
  const {
    evidences,
    loading,
    error,
    filtroEstado,
    setFiltroEstado,
    refresh,
    addEvidence,
  } = useEvidences('todas');

  const handleUploadSuccess = (result: UploadEvidenceResult) => {
    addEvidence(result.evidence);
    onNotification?.({
      message: `Evidencia "${result.evidence.nombre_archivo}" subida y registrada exitosamente.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      {/* ── NIVEL 1: ENCABEZADO PRINCIPAL DE INGESTA Y EVIDENCIAS ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Bloque Izquierdo */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground whitespace-nowrap">
              Bandeja de Evidencias Forenses
            </h1>
            <Badge variant="secondary" className="font-mono text-xs whitespace-nowrap shrink-0">
              {evidences.length} evidencias
            </Badge>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap shrink-0">
              <CloudCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Nube Conectada</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Ingesta forense con sanitización EXIF, hashing SHA-256 en cliente Web Crypto y extracción OCR para fichas HSE.
          </p>
        </div>

        {/* Bloque Derecho: Botón Asistente WhatsApp / Fotos */}
        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsSmartModalOpen(true)}
            className="w-full sm:w-auto justify-center gap-2 cursor-pointer border-amber-500/40 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold whitespace-nowrap shrink-0"
            title="Generar informe pre-llenado a partir de capturas de WhatsApp o fotos con OCR"
          >
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse shrink-0" />
            <span>Generar Informe desde Captura WhatsApp / Fotos</span>
          </Button>
        </div>
      </div>

      {/* Sección 1: Carga e Ingesta Forense */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary shrink-0" />
            <CardTitle className="text-base sm:text-lg font-semibold tracking-tight">
              Ingesta de Evidencias Fotográficas
            </CardTitle>
            <Badge variant="outline" className="text-[11px] font-mono border-primary/20 text-primary">
              <ShieldCheck className="h-3 w-3 mr-1" />
              SHA-256 Local
            </Badge>
          </div>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground">
            Cálculo SHA-256 en cliente, sanitización EXIF sin coordenadas GPS y compresión WebP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EvidenceUploader onUploadSuccess={handleUploadSuccess} />
        </CardContent>
      </Card>

      {/* Sección 2: Bandeja de Evidencias */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg font-semibold tracking-tight">
            Bandeja de Evidencias Registradas
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground">
            Galería sincronizada con Supabase. Permite consultar miniaturas, estados del ciclo de vida y ejecutar OCR.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EvidenceGrid
            evidences={evidences}
            loading={loading}
            error={error}
            filtroEstado={filtroEstado}
            onFiltroChange={setFiltroEstado}
            onRefresh={refresh}
            onSelectEvidence={onSelectEvidence}
          />
        </CardContent>
      </Card>

      {/* Asistente Visual Inteligente desde WhatsApp / Fotos */}
      <SmartReportGeneratorModal
        isOpen={isSmartModalOpen}
        onClose={() => setIsSmartModalOpen(false)}
        onActivityCreated={(created) => {
          refresh();
          if (onSelectActivity) {
            onSelectActivity(created);
          }
        }}
      />
    </div>
  );
};

export default InboxEvidences;
