import React, { useState } from 'react';
import type { EvidenciaRow } from '../../services/EvidenceService';
import { supabase } from '../../lib/supabaseClient';
import { StatusBadge } from '../ui/StatusBadge';

export interface EvidenceCardProps {
  evidence: EvidenciaRow;
  bucketName?: string;
  onSelect?: (evidence: EvidenciaRow) => void;
  className?: string;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  evidence,
  bucketName = 'evidencias',
  onSelect,
  className = '',
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);

  // Obtener URL pública desde el bucket Supabase Storage
  const thumbPath = evidence.ruta_thumb || evidence.ruta_storage;
  const thumbnailUrl = thumbPath
    ? supabase.storage.from(bucketName).getPublicUrl(thumbPath).data.publicUrl
    : '';

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

  return (
    <div
      className={`group relative flex flex-col rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}
      onClick={() => onSelect?.(evidence)}
    >
      {/* Zona de imagen / miniatura con aspect ratio */}
      <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
        {thumbnailUrl && !imgError ? (
          <img
            src={thumbnailUrl}
            alt={evidence.nombre_archivo}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
            <svg
              className="w-10 h-10 mb-1 opacity-60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs">Sin vista previa</span>
          </div>
        )}

        {/* Badge de estado superpuesto */}
        <div className="absolute top-2.5 right-2.5">
          <StatusBadge status={evidence.estado} />
        </div>
      </div>

      {/* Contenido / Metadatos */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1.5">
          <h4
            className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate"
            title={evidence.nombre_archivo}
          >
            {evidence.nombre_archivo}
          </h4>

          {/* Fecha y tamaño */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formattedDate}
            </span>
            <span>{(evidence.tamano_bytes / 1024).toFixed(1)} KB</span>
          </div>

          {/* Hash SHA-256 truncado con acción de copiar */}
          <div className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-800/60 rounded px-2 py-1 text-slate-600 dark:text-slate-300 font-mono">
            <span title={evidence.hash_sha256} className="truncate">
              SHA: {shortHash}
            </span>
            <button
              type="button"
              onClick={handleCopyHash}
              className="ml-2 text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
              title="Copiar SHA-256 completo"
            >
              {copied ? (
                <span className="text-emerald-500 font-medium">¡Copiado!</span>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Botón de acción para Fase 4 (deshabilitado según especificación) */}
        <button
          type="button"
          disabled
          title="Función disponible en la Fase 4 (Recorte y OCR)"
          className="w-full mt-1 py-2 px-3 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center gap-1.5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
          </svg>
          Extraer Fotocheck (OCR)
        </button>
      </div>
    </div>
  );
};

export default EvidenceCard;
