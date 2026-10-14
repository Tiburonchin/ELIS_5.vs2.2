import React, { useState, useEffect } from 'react';
import { type EvidenciaRow, evidenceService } from '../../services/EvidenceService';
import { StatusBadge } from '../ui/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '../ui/Modal';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CropCanvas } from '../ocr/CropCanvas';
import { OcrResultEditor } from '../ocr/OcrResultEditor';
import { runOcrOnCrop, type OcrExtractedData } from '../../utils/ocrClient';
import type { IdentificacionRow } from '../../services/OcrService';
import { Eye, Copy, Check, FileText, Image as ImageIcon } from 'lucide-react';

export interface EvidenceCardProps {
  evidence: EvidenciaRow;
  bucketName?: string;
  onSelect?: (evidence: EvidenciaRow) => void;
  onIdentificacionSaved?: (identificacion: IdentificacionRow) => void;
  className?: string;
}

type OcrStep = 'crop' | 'ocr_running' | 'edit' | 'saved';

export const EvidenceCard: React.FC<EvidenceCardProps> = React.memo(({
  evidence,
  bucketName = 'evidencias',
  onSelect,
  onIdentificacionSaved,
  className = '',
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [imgLoading, setImgLoading] = useState<boolean>(true);
  const [imgError, setImgError] = useState<boolean>(false);
  const [activeImgUrl, setActiveImgUrl] = useState<string>('');
  const [fallbackAttempted, setFallbackAttempted] = useState<boolean>(false);

  // Estados de modales
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [ocrStep, setOcrStep] = useState<OcrStep>('crop');
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStatusText, setOcrStatusText] = useState<string>('');
  const [extractedData, setExtractedData] = useState<OcrExtractedData | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string>('');
  const [savedIdentificacion, setSavedIdentificacion] = useState<IdentificacionRow | null>(null);

  // Resolución inicial de URL de imagen con método dual y limpieza de ruta
  useEffect(() => {
    let isMounted = true;
    const resolveUrl = async () => {
      setImgLoading(true);
      setImgError(false);
      setFallbackAttempted(false);

      try {
        const url = await evidenceService.getEvidenceImageUrl(evidence, {
          type: 'thumb',
          bucketName,
        });
        if (isMounted) {
          setActiveImgUrl(url);
          setImgLoading(false);
        }
      } catch {
        if (isMounted) {
          setImgLoading(false);
          setImgError(true);
        }
      }
    };

    resolveUrl();
    return () => {
      isMounted = false;
    };
  }, [evidence, bucketName]);

  // Manejador de error con fallback automático de miniatura a original
  const handleImageError = async () => {
    if (!fallbackAttempted && evidence.ruta_storage && evidence.ruta_thumb) {
      setFallbackAttempted(true);
      try {
        const originalUrl = await evidenceService.getEvidenceImageUrl(evidence, {
          type: 'original',
          bucketName,
        });
        if (originalUrl && originalUrl !== activeImgUrl) {
          setActiveImgUrl(originalUrl);
          return;
        }
      } catch {
        // Fallback falló
      }
    }
    setImgError(true);
  };

  // Formatear fecha
  const formattedDate = evidence.fecha_captura
    ? new Date(evidence.fecha_captura).toLocaleString('es-PE', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : evidence.fecha_ingesta
    ? new Date(evidence.fecha_ingesta).toLocaleString('es-PE', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'Sin fecha';

  // Truncar hash SHA-256 (e.g. e3b0c4...b855)
  const shortHash =
    evidence.hash_sha256.length > 16
      ? `${evidence.hash_sha256.slice(0, 8)}...${evidence.hash_sha256.slice(-6)}`
      : evidence.hash_sha256;

  const handleCopyHash = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(evidence.hash_sha256);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Error al copiar hash:', err);
    }
  };

  const handleOpenOcrModal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsLightboxOpen(false);
    setOcrStep('crop');
    setExtractedData(null);
    setCroppedPreviewUrl('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCropComplete = async (_area: unknown, croppedBlob: Blob) => {
    const previewUrl = URL.createObjectURL(croppedBlob);
    setCroppedPreviewUrl(previewUrl);
    setOcrStep('ocr_running');
    setOcrProgress(0);
    setOcrStatusText('Iniciando motor OCR...');

    try {
      const result = await runOcrOnCrop(croppedBlob, (progress, status) => {
        setOcrProgress(Math.round(progress * 100));
        setOcrStatusText(status);
      });

      setExtractedData(result);
      setOcrStep('edit');
    } catch (err) {
      console.error('[EvidenceCard] Error ejecutando OCR:', err);
      setExtractedData({
        nombres: '',
        apellido_paterno: '',
        apellido_materno: '',
        cargo: '',
        texto_crudo_ocr: '',
        nivel_confianza: 0,
      });
      setOcrStep('edit');
    }
  };

  const handleSaved = (identificacion: IdentificacionRow) => {
    setSavedIdentificacion(identificacion);
    setOcrStep('saved');
    if (onIdentificacionSaved) {
      onIdentificacionSaved(identificacion);
    }
    setTimeout(() => {
      setIsModalOpen(false);
    }, 1800);
  };

  return (
    <>
      <Card
        className={`group relative flex flex-col overflow-hidden py-0 border-border shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer ${className}`}
        onClick={() => onSelect?.(evidence)}
      >
        {/* Contenedor de la miniatura con h-48 aspect-video y Skeleton de carga */}
        <div
          className="relative aspect-video sm:h-48 w-full bg-muted flex items-center justify-center overflow-hidden cursor-zoom-in"
          onClick={(e) => {
            e.stopPropagation();
            setIsLightboxOpen(true);
          }}
          title="Toca para ver en alta resolución"
        >
          {imgLoading && (
            <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
          )}

          {activeImgUrl && !imgError ? (
            <img
              src={activeImgUrl}
              alt={evidence.nombre_archivo}
              loading="lazy"
              onLoad={() => setImgLoading(false)}
              onError={handleImageError}
              className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                imgLoading ? 'opacity-0' : 'opacity-100'
              }`}
            />
          ) : !imgLoading && (
            <div className="flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
              <ImageIcon className="w-10 h-10 mb-1 opacity-60" />
              <span className="text-xs">Sin vista previa</span>
            </div>
          )}

          {/* Badge de estado superpuesto */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <StatusBadge status={evidence.estado} />
          </div>

          {/* Icono de lupa discreto en hover */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="bg-background/80 text-foreground text-[11px] px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5 shadow-sm font-medium">
              <Eye className="w-3.5 h-3.5 text-primary" />
              Ver alta resolución
            </span>
          </div>
        </div>

        {/* Contenido / Metadatos */}
        <CardContent className="p-3.5 flex flex-col flex-1 justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <h4
              className="text-sm font-semibold text-foreground truncate block"
              title={evidence.nombre_archivo}
            >
              {evidence.nombre_archivo}
            </h4>

            {/* Fecha y tamaño */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1 truncate">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formattedDate}
              </span>
              <span className="shrink-0">{(evidence.tamano_bytes / 1024).toFixed(1)} KB</span>
            </div>

            {/* Hash SHA-256 truncado con acción de copiar */}
            <div className="flex items-center justify-between text-[11px] bg-muted/60 rounded px-2 py-1 text-foreground/80 font-mono">
              <span title={evidence.hash_sha256} className="truncate">
                SHA: {shortHash}
              </span>
              <button
                type="button"
                onClick={handleCopyHash}
                className="ml-2 text-primary hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
                title="Copiar SHA-256 completo"
              >
                {copied ? (
                  <span className="text-emerald-500 font-medium flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> ¡Copiado!
                  </span>
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Botón de acción: Modal de Recorte y OCR */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenOcrModal}
            title="Extraer fotocheck y procesar con OCR en navegador"
            className="w-full mt-1 text-xs font-semibold gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Extraer Fotocheck (OCR)
          </Button>
        </CardContent>
      </Card>

      {/* Visor Lightbox / Modal de Vista Previa en Alta Resolución */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-sm sm:text-base font-bold truncate flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">{evidence.nombre_archivo}</span>
            </DialogTitle>
            <DialogDescription className="text-xs font-mono text-muted-foreground break-all">
              SHA-256: {evidence.hash_sha256}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-[250px] max-h-[60vh] bg-black/90 rounded-xl overflow-hidden flex items-center justify-center p-2 my-2">
            {activeImgUrl && !imgError ? (
              <img
                src={activeImgUrl}
                alt={evidence.nombre_archivo}
                className="max-h-full max-w-full object-contain rounded"
              />
            ) : (
              <div className="text-center text-white/60 text-xs p-6">
                No se pudo cargar la imagen en alta resolución
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t gap-2 flex-wrap">
            <div className="text-xs text-muted-foreground">
              <span>{(evidence.tamano_bytes / 1024).toFixed(1)} KB</span> &bull; <span>{evidence.mime_type}</span> &bull; <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyHash}
                className="text-xs gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado' : 'Copiar Hash'}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleOpenOcrModal()}
                className="text-xs gap-1.5 font-semibold"
              >
                <FileText className="w-4 h-4" />
                Extraer Fotocheck (OCR)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal interactivo de Recorte y OCR */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          ocrStep === 'crop'
            ? 'Recortar Credencial / Fotocheck'
            : ocrStep === 'ocr_running'
            ? 'Procesando OCR con Tesseract en Navegador'
            : ocrStep === 'edit'
            ? 'Validación Humana del Fotocheck'
            : 'Identificación Guardada'
        }
        maxWidth="2xl"
      >
        {ocrStep === 'crop' && (
          <CropCanvas
            imageSrc={activeImgUrl}
            onCropComplete={handleCropComplete}
            onCancel={handleCloseModal}
          />
        )}

        {ocrStep === 'ocr_running' && (
          <div className="py-10 flex flex-col items-center justify-center text-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-sky-200 dark:border-sky-950 border-t-sky-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-sky-600 dark:text-sky-400">
                {ocrProgress}%
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Extrayendo texto en cliente...
              </h4>
              <p className="text-xs text-slate-500 capitalize">{ocrStatusText || 'Reconociendo caracteres'}</p>
            </div>
          </div>
        )}

        {ocrStep === 'edit' && extractedData && (
          <OcrResultEditor
            evidenciaId={evidence.id}
            initialData={extractedData}
            croppedImagePreviewUrl={croppedPreviewUrl}
            onSaved={handleSaved}
            onCancel={handleCloseModal}
          />
        )}

        {ocrStep === 'saved' && savedIdentificacion && (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              ¡Fotocheck Validado y Guardado!
            </h4>
            <p className="text-xs text-slate-500">
              {savedIdentificacion.nombres} {savedIdentificacion.apellido_paterno}{' '}
              {savedIdentificacion.apellido_materno}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
});

export default EvidenceCard;
