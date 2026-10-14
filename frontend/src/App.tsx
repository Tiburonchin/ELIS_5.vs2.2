import React, { useState } from 'react';
import { EvidenceUploader } from './components/evidence/EvidenceUploader';
import { EvidenceGrid } from './components/evidence/EvidenceGrid';
import { useEvidences } from './hooks/useEvidences';
import type { EvidenciaRow, UploadEvidenceResult } from './services/EvidenceService';

export const App: React.FC = () => {
  const {
    evidences,
    loading,
    error,
    filtroEstado,
    setFiltroEstado,
    refresh,
    addEvidence,
  } = useEvidences('todas');

  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'info';
  } | null>(null);

  const handleUploadSuccess = (result: UploadEvidenceResult) => {
    // Incorporar de forma inmediata a la lista
    addEvidence(result.evidence);
    setNotification({
      message: `Evidencia "${result.evidence.nombre_archivo}" subida y registrada exitosamente.`,
      type: 'success',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-sky-500 selection:text-white">
      {/* Barra de Navegación Superior */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-sky-500/20">
              E
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white m-0 leading-tight">
                ELIS 5.0
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Entorno Local Inteligente y Seguro &bull; Ingesta de Evidencias
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Módulo 3 Activo
            </span>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Banner de Notificación de Éxito */}
        {notification && (
          <div
            role="status"
            className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-sm flex items-center justify-between shadow-sm animate-fade-in"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 p-1"
            >
              &times;
            </button>
          </div>
        )}

        {/* Sección 1: Zona de Carga e Ingesta Forense */}
        <section aria-labelledby="upload-heading" className="space-y-3">
          <div>
            <h2 id="upload-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Ingesta de Evidencias Fotográficas
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Cálculo SHA-256 en cliente, sanitización EXIF sin coordenadas GPS y compresión WebP.
            </p>
          </div>

          <EvidenceUploader onUploadSuccess={handleUploadSuccess} />
        </section>

        {/* Sección 2: Bandeja de Evidencias */}
        <section aria-labelledby="evidence-tray-heading" className="space-y-4">
          <div>
            <h2 id="evidence-tray-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Bandeja de Evidencias Registradas
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Galería sincronizada con Supabase. Permite consultar miniaturas y estados del ciclo de vida.
            </p>
          </div>

          <EvidenceGrid
            evidences={evidences}
            loading={loading}
            error={error}
            filtroEstado={filtroEstado}
            onFiltroChange={setFiltroEstado}
            onRefresh={refresh}
            onSelectEvidence={(selected: EvidenciaRow) => {
              console.log('[App] Evidencia seleccionada:', selected);
            }}
          />
        </section>
      </main>

      {/* Footer Módulo 3 */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-16 py-6 text-center text-xs text-slate-400">
        ELIS 5.0 — Sistema de Inspección Inmutable &bull; Arquitectura Cloud-Native Supabase
      </footer>
    </div>
  );
};

export default App;
