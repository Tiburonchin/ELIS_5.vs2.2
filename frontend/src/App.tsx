import React, { useState } from 'react';
import { EvidenceUploader } from './components/evidence/EvidenceUploader';
import { EvidenceGrid } from './components/evidence/EvidenceGrid';
import { useEvidences } from './hooks/useEvidences';
import type { EvidenciaRow, UploadEvidenceResult } from './services/EvidenceService';
import type { ActividadRow } from './services/ActivityService';
import { ActivitiesManager } from './pages/ActivitiesManager';
import { ActivityDetail } from './pages/ActivityDetail';

type ActiveTab = 'evidencias' | 'actividades';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('evidencias');
  const [selectedActivity, setSelectedActivity] = useState<ActividadRow | null>(null);

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
                Entorno Local Inteligente y Seguro &bull; Control y Fichas Forenses
              </p>
            </div>
          </div>

          {/* Navegación por Pestañas */}
          <nav className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab('evidencias');
                setSelectedActivity(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'evidencias' && !selectedActivity
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Bandeja de Evidencias</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('actividades');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'actividades' || selectedActivity
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>Gestor de Actividades</span>
            </button>
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Módulo 5 Activo
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
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 p-1 cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {/* Vista: Pestaña Gestor de Actividades */}
        {activeTab === 'actividades' ? (
          selectedActivity ? (
            <ActivityDetail
              activity={selectedActivity}
              onBack={() => setSelectedActivity(null)}
              onActivityUpdated={(updated) => setSelectedActivity(updated)}
            />
          ) : (
            <ActivitiesManager
              onSelectActivity={(activity) => setSelectedActivity(activity)}
            />
          )
        ) : (
          /* Vista: Pestaña Bandeja de Evidencias */
          <>
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
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-16 py-6 text-center text-xs text-slate-400">
        ELIS 5.0 — Sistema de Inspección Inmutable &bull; Arquitectura Cloud-Native Supabase
      </footer>
    </div>
  );
};

export default App;
