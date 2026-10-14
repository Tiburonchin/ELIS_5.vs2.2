import React, { useState, lazy, Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { EvidenciaRow } from '@/services/EvidenceService';
import type { ActividadRow } from '@/services/ActivityService';
import { CheckCircle2, X, Loader2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

// Code Splitting (Vite / React.lazy): Fragmentación del bundle principal
const InboxEvidencesLazy = lazy(() => import('@/pages/InboxEvidences'));
const ActivitiesManagerLazy = lazy(() => import('@/pages/ActivitiesManager'));
const ActivityDetailLazy = lazy(() => import('@/pages/ActivityDetail'));

// Componente de fallback unificado con Skeleton visual de shadcn/ui
const ModuleSuspenseFallback: React.FC<{ label: string }> = ({ label }) => (
  <div className="w-full space-y-4 py-8 animate-in fade-in duration-300">
    <div className="flex items-center gap-2.5 text-muted-foreground text-sm font-medium">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <span>{label}</span>
    </div>
    <div className="rounded-xl border border-border p-6 bg-card space-y-4">
      <div className="h-6 w-1/3 bg-muted rounded-md animate-pulse" />
      <div className="h-4 w-2/3 bg-muted/60 rounded-md animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
        <div className="h-40 bg-muted/50 rounded-lg animate-pulse" />
        <div className="h-40 bg-muted/50 rounded-lg animate-pulse" />
        <div className="h-40 bg-muted/50 rounded-lg animate-pulse hidden md:block" />
      </div>
    </div>
  </div>
);

type ActiveTab = 'evidencias' | 'actividades';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('evidencias');
  const [selectedActivity, setSelectedActivity] = useState<ActividadRow | null>(null);

  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'info';
  } | null>(null);

  const handleShowNotification = (notif: { message: string; type: 'success' | 'info' }) => {
    setNotification(notif);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === 'evidencias') {
      setSelectedActivity(null);
    }
  };

  return (
    <ErrorBoundary>
      <ProtectedRoute>
        <DashboardLayout
          activeTab={activeTab}
          onTabChange={handleTabChange}
        >
          {/* Banner de Notificación shadcn style */}
          {notification && (
            <div
              role="status"
              className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-medium">{notification.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="text-emerald-700 dark:text-emerald-400 hover:opacity-80 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Renderizado condicional de vistas bajo Code Splitting */}
          <Suspense fallback={<ModuleSuspenseFallback label="Cargando módulo de operaciones..." />}>
            {activeTab === 'actividades' ? (
              selectedActivity ? (
                <ActivityDetailLazy
                  activity={selectedActivity}
                  onBack={() => setSelectedActivity(null)}
                  onActivityUpdated={(updated) => setSelectedActivity(updated)}
                />
              ) : (
                <ActivitiesManagerLazy
                  onSelectActivity={(activity) => setSelectedActivity(activity)}
                />
              )
            ) : (
              <InboxEvidencesLazy
                onSelectEvidence={(evidence: EvidenciaRow) => {
                  console.log('[App] Evidencia seleccionada:', evidence);
                }}
                onNotification={handleShowNotification}
              />
            )}
          </Suspense>
        </DashboardLayout>
      </ProtectedRoute>
    </ErrorBoundary>
  );
};

export default App;
