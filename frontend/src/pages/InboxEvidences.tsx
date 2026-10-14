import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EvidenceUploader } from '@/components/evidence/EvidenceUploader';
import { EvidenceGrid } from '@/components/evidence/EvidenceGrid';
import { useEvidences } from '@/hooks/useEvidences';
import type { EvidenciaRow, UploadEvidenceResult } from '@/services/EvidenceService';

export interface InboxEvidencesProps {
  onSelectEvidence?: (evidence: EvidenciaRow) => void;
  onNotification?: (notification: { message: string; type: 'success' | 'info' }) => void;
}

export const InboxEvidences: React.FC<InboxEvidencesProps> = ({
  onSelectEvidence,
  onNotification,
}) => {
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
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg font-semibold tracking-tight">
            Ingesta de Evidencias Fotográficas
          </CardTitle>
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
    </div>
  );
};

export default InboxEvidences;
