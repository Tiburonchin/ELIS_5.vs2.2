import React from 'react';
import type { EvidenciaRow } from '../../services/EvidenceService';
import { EvidenceCard } from './EvidenceCard';
import type { EstadoFiltro } from '../../hooks/useEvidences';

export interface EvidenceGridProps {
  evidences: EvidenciaRow[];
  loading?: boolean;
  error?: Error | null;
  filtroEstado: EstadoFiltro;
  onFiltroChange: (filtro: EstadoFiltro) => void;
  onRefresh?: () => void;
  onSelectEvidence?: (evidence: EvidenciaRow) => void;
  className?: string;
}

export const EvidenceGrid: React.FC<EvidenceGridProps> = ({
  evidences,
  loading = false,
  error = null,
  filtroEstado,
  onFiltroChange,
  onRefresh,
  onSelectEvidence,
  className = '',
}) => {
  const filterOptions: { id: EstadoFiltro; label: string }[] = [
    { id: 'todas', label: 'Todas' },
    { id: 'pendiente', label: 'Pendientes' },
    { id: 'vinculada', label: 'Vinculadas' },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra superior: Filtros y conteo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
            Filtrar:
          </span>
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 text-xs font-medium">
            {filterOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onFiltroChange(opt.id)}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  filtroEstado === opt.id
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 self-end sm:self-auto">
          <span>
            Total:{' '}
            <strong className="text-slate-800 dark:text-slate-100 font-mono">
              {evidences.length}
            </strong>{' '}
            {evidences.length === 1 ? 'evidencia' : 'evidencias'}
          </span>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Refrescar bandeja"
              className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <svg
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Manejo de estados: Error */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-center justify-between"
        >
          <span>Error al sincronizar la bandeja de evidencias: {error.message}</span>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="underline font-semibold ml-2 cursor-pointer hover:text-rose-800"
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {/* Manejo de estados: Loading inicial */}
      {loading && evidences.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden animate-pulse"
            >
              <div className="aspect-4/3 bg-slate-200 dark:bg-slate-800" />
              <div className="p-3.5 space-y-2.5">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manejo de estados: Lista vacía */}
      {!loading && evidences.length === 0 && !error && (
        <div className="py-12 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No se encontraron evidencias
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {filtroEstado === 'todas'
              ? 'Aún no se ha registrado ninguna evidencia fotográfica. Utiliza la zona de carga superior para comenzar.'
              : `No existen evidencias actualmente con estado "${filtroEstado}".`}
          </p>
        </div>
      )}

      {/* Grid responsivo Mobile-First con renderizado memoizado */}
      {evidences.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {evidences.map((evidence) => (
            <EvidenceCard
              key={evidence.id}
              evidence={evidence}
              onSelect={onSelectEvidence}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EvidenceGrid;
