import React, { useRef, useState } from 'react';
import { evidenceService, type UploadEvidenceResult } from '../../services/EvidenceService';

export interface EvidenceUploaderProps {
  onUploadSuccess?: (result: UploadEvidenceResult) => void;
  className?: string;
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({
  onUploadSuccess,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [duplicateAlert, setDuplicateAlert] = useState<{
    show: boolean;
    hash: string;
    filename: string;
    evidenceId: string;
  } | null>(null);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    if (!file) return;

    // Resetear estados anteriores
    setDuplicateAlert(null);
    setErrorAlert(null);
    setIsProcessing(true);
    setProgressStep('Calculando SHA-256 y sanitizando EXIF...');

    try {
      // Llamada directa al servicio EvidenceService
      setProgressStep('Verificando duplicados y procesando...');
      const result = await evidenceService.uploadAndRegisterEvidence(file);

      if (result.isDuplicate) {
        setDuplicateAlert({
          show: true,
          hash: result.hash,
          filename: file.name,
          evidenceId: result.evidence.id,
        });
      } else {
        onUploadSuccess?.(result);
      }
    } catch (err: unknown) {
      console.error('[EvidenceUploader] Error en la subida:', err);
      setErrorAlert(err instanceof Error ? err.message : 'Error inesperado al subir la evidencia');
    } finally {
      setIsProcessing(false);
      setProgressStep('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
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
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleProcessFile(file);
    } else if (file) {
      setErrorAlert('Por favor selecciona únicamente archivos de imagen.');
    }
  };

  return (
    <div className={`w-full space-y-3 ${className}`}>
      {/* Alerta de duplicado criptográfico */}
      {duplicateAlert?.show && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-sm transition-all"
        >
          <div className="p-1 rounded-full bg-amber-200 dark:bg-amber-800/60 shrink-0 text-amber-700 dark:text-amber-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Alerta de Error */}
      {errorAlert && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 flex items-start gap-3 shadow-sm"
        >
          <div className="p-1 rounded-full bg-rose-200 dark:bg-rose-800 shrink-0 text-rose-700 dark:text-rose-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Inputs ocultos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
        disabled={isProcessing}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileChange}
        className="hidden"
        disabled={isProcessing}
      />

      {/* Zona de Drop responsiva */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
          isDragging
            ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/30 scale-[0.99]'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
        } ${isProcessing ? 'pointer-events-none opacity-80' : ''}`}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{progressStep}</p>
            <p className="text-xs text-slate-500">Procesando criptográficamente en el dispositivo...</p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Arrastra y suelta tu evidencia fotográfica aquí
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Formatos compatibles: JPG, PNG, WEBP (se extraen dimensiones y fecha, eliminando GPS)
              </p>
            </div>

            {/* Botones de acción rápida adaptados a móviles y escritorio */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Seleccionar de Galería
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-sky-600 hover:bg-sky-500 text-white shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Capturar con Cámara
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EvidenceUploader;
