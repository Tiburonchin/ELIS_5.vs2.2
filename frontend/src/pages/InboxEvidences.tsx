import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EvidenceUploader } from '@/components/evidence/EvidenceUploader';
import { EvidenceGrid } from '@/components/evidence/EvidenceGrid';
import { useEvidences } from '@/hooks/useEvidences';
import type { EvidenciaRow, UploadEvidenceResult } from '@/services/EvidenceService';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
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
      {/* Sección 1: Carga e Ingesta Forense */}
      <Card className="border-border shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
          <div className="space-y-1">
            <CardTitle className="text-base sm:text-lg font-semibold tracking-tight">
              Ingesta de Evidencias Fotográficas
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">
              Cálculo SHA-256 en cliente, sanitización EXIF sin coordenadas GPS y compresión WebP.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsSmartModalOpen(true)}
            className="gap-1.5 cursor-pointer border-amber-500/40 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold shrink-0"
            title="Generar informe pre-llenado a partir de capturas de WhatsApp o fotos con OCR"
          >
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
            <span className="hidden sm:inline">Generar Informe desde</span> Captura WhatsApp / Fotos
          </Button>
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
