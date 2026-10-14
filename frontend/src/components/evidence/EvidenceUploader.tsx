import React, { useRef, useState } from 'react';
import { evidenceService, type UploadEvidenceResult } from '../../services/EvidenceService';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  UploadCloud,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Copy,
  Loader2,
  X,
} from 'lucide-react';

export interface EvidenceUploaderProps {
  onUploadSuccess?: (result: UploadEvidenceResult) => void;
  onBatchUploadSuccess?: (results: UploadEvidenceResult[]) => void;
  className?: string;
  concurrency?: number;
}

interface UploadQueueItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'success' | 'duplicate' | 'error';
  progress: number;
  message?: string;
  result?: UploadEvidenceResult;
  error?: string;
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({
  onUploadSuccess,
  onBatchUploadSuccess,
  className = '',
  concurrency = 3,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [globalProgress, setGlobalProgress] = useState<number>(0);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  // Alerta retrocompatible para test unitario si hay un duplicado simple
  const [duplicateAlert, setDuplicateAlert] = useState<{
    show: boolean;
    hash: string;
    filename: string;
    evidenceId: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFilesBatch = async (filesList: File[]) => {
    if (!filesList || filesList.length === 0) return;

    setErrorAlert(null);
    setDuplicateAlert(null);
    setIsProcessing(true);
    setGlobalProgress(0);

    const initialQueue: UploadQueueItem[] = filesList.map((file, idx) => ({
      id: `${file.name}-${file.size}-${idx}-${Date.now()}`,
      file,
      status: 'pending',
      progress: 0,
      message: 'En espera...',
    }));

    setQueue(initialQueue);

    const successResults: UploadEvidenceResult[] = [];
    const total = filesList.length;
    let completedCount = 0;

    // Ejecución con control de concurrencia
    let nextIndex = 0;
    const worker = async () => {
      while (nextIndex < filesList.length) {
        const currentIndex = nextIndex++;
        const file = filesList[currentIndex];
        const itemId = initialQueue[currentIndex].id;

        // Actualizar item a procesando
        setQueue((prev) =>
          prev.map((q) =>
            q.id === itemId
              ? { ...q, status: 'processing', progress: 30, message: 'Calculando SHA-256 y sanitizando EXIF...' }
              : q
          )
        );

        try {
          const res = await evidenceService.uploadAndRegisterEvidence(file);

          if (res.isDuplicate) {
            setQueue((prev) =>
              prev.map((q) =>
                q.id === itemId
                  ? {
                      ...q,
                      status: 'duplicate',
                      progress: 100,
                      message: 'Ya en biblioteca (Lista para reutilizar)',
                      result: res,
                    }
                  : q
              )
            );
            // Si es un solo archivo o batch, mantener compatibilidad con alerta histórica
            if (filesList.length === 1) {
              setDuplicateAlert({
                show: true,
                hash: res.hash,
                filename: file.name,
                evidenceId: res.evidence.id,
              });
            }
          } else {
            setQueue((prev) =>
              prev.map((q) =>
                q.id === itemId
                  ? {
                      ...q,
                      status: 'success',
                      progress: 100,
                      message: 'Subida y registrada con éxito',
                      result: res,
                    }
                  : q
              )
            );
          }

          successResults.push(res);
          if (!res.isDuplicate) {
            onUploadSuccess?.(res);
          }
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : 'Error inesperado al procesar archivo';
          setQueue((prev) =>
            prev.map((q) =>
              q.id === itemId
                ? {
                    ...q,
                    status: 'error',
                    progress: 100,
                    error: errorMsg,
                    message: errorMsg,
                  }
                : q
            )
          );
        } finally {
          completedCount++;
          const currentPct = Math.round((completedCount / total) * 100);
          setGlobalProgress(currentPct);
        }
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker());
    await Promise.all(workers);

    setIsProcessing(false);
    if (successResults.length > 0) {
      onBatchUploadSuccess?.(successResults);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      processFilesBatch(files);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    const imageFiles = droppedFiles.filter((f) => f.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      processFilesBatch(imageFiles);
    } else if (droppedFiles.length > 0) {
      setErrorAlert('Por favor selecciona únicamente archivos de imagen (JPG, PNG, WEBP).');
    }
  };

  const clearQueueItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Alerta de duplicado criptográfico retrocompatible */}
      {duplicateAlert?.show && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-sm transition-all"
        >
          <div className="p-1 rounded-full bg-amber-200 dark:bg-amber-800/60 shrink-0 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs sm:text-sm">
            <h5 className="font-semibold text-amber-800 dark:text-amber-100 mb-0.5">
              Evidencia Duplicada Detectada (Ahorro de Datos)
            </h5>
            <p className="text-amber-700/90 dark:text-amber-300/90">
              El archivo <span className="font-semibold">{duplicateAlert.filename}</span> posee el hash SHA-256{' '}
              <code className="text-xs bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded font-mono">
                {duplicateAlert.hash.slice(0, 10)}...{duplicateAlert.hash.slice(-6)}
              </code>{' '}
              que ya se encuentra registrado con ID <span className="font-mono text-xs">{duplicateAlert.evidenceId.slice(0, 8)}</span>. Se omitió la subida al Storage para evitar redundancia.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDuplicateAlert(null)}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 cursor-pointer p-1"
            aria-label="Cerrar alerta"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Alerta de Error Global */}
      {errorAlert && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 flex items-start gap-3 shadow-sm"
        >
          <div className="p-1 rounded-full bg-rose-200 dark:bg-rose-800 shrink-0 text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs sm:text-sm">
            <h5 className="font-semibold text-rose-800 dark:text-rose-100">Error de Ingesta</h5>
            <p>{errorAlert}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorAlert(null)}
            className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200 cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Inputs de archivo ocultos con soporte múltiple */}
      <input
        ref={fileInputRef}
        data-testid="file-input-gallery"
        type="file"
        multiple
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
        disabled={isProcessing}
      />
      <input
        ref={cameraInputRef}
        data-testid="file-input-camera"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileChange}
        className="hidden"
        disabled={isProcessing}
      />

      {/* Zona de Drop responsiva y Multi-Upload */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
          isDragging
            ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 scale-[0.99]'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
        } ${isProcessing ? 'pointer-events-none opacity-85' : ''}`}
      >
        <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-xs">
          {isProcessing ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <UploadCloud className="w-6 h-6" />
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Arrastra y suelta tu evidencia fotográfica aquí
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Soporta subida individual o masiva (5, 10 o 20 fotos simultáneas de campo o WhatsApp). Hash SHA-256 instantáneo y sanitización EXIF sin GPS.
          </p>
        </div>

        {/* Acciones de selección rápida */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2" onClick={(e) => e.stopPropagation()}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl text-xs font-semibold gap-1.5"
          >
            <ImageIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Seleccionar de Galería</span>
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={isProcessing}
            onClick={() => cameraInputRef.current?.click()}
            className="rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white gap-1.5"
          >
            <Camera className="w-4 h-4" />
            <span>Capturar con Cámara</span>
          </Button>
        </div>
      </div>

      {/* Barra de progreso global durante procesamiento */}
      {isProcessing && (
        <div className="space-y-2 p-3.5 rounded-xl border border-border bg-card/60 backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
              Procesando cola en paralelo (lotes de {concurrency})...
            </span>
            <span className="font-mono font-bold text-sky-600">{globalProgress}%</span>
          </div>
          <Progress value={globalProgress} className="h-2 rounded-full" />
        </div>
      )}

      {/* Cola de subidas con progreso y estado individual */}
      {queue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cola de Procesamiento ({queue.filter((q) => q.status === 'success' || q.status === 'duplicate').length}/{queue.length})
            </span>
            {!isProcessing && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setQueue([])}
                className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
              >
                Limpiar lista
              </Button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {queue.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-border bg-card flex items-center justify-between gap-3 text-xs shadow-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate max-w-[200px] sm:max-w-[320px]" title={item.file.name}>
                      {item.file.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ({(item.file.size / 1024).toFixed(0)} KB)
                    </span>

                    {item.status === 'duplicate' && (
                      <Badge variant="outline" className="text-[10px] bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300">
                        <Copy className="w-2.5 h-2.5 mr-1" />
                        Ya en biblioteca (Lista para reutilizar)
                      </Badge>
                    )}
                    {item.status === 'success' && (
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                        Subida
                      </Badge>
                    )}
                    {item.status === 'error' && (
                      <Badge variant="destructive" className="text-[10px]">
                        Error
                      </Badge>
                    )}
                  </div>

                  <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {item.message || (item.status === 'processing' ? 'Procesando criptográficamente...' : '')}
                  </div>

                  {item.status === 'processing' && (
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-sky-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {!isProcessing && (
                  <button
                    type="button"
                    onClick={() => clearQueueItem(item.id)}
                    className="text-muted-foreground hover:text-foreground p-1 cursor-pointer shrink-0"
                    title="Remover de lista"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceUploader;
