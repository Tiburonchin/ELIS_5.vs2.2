import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InboxEvidences } from '@/pages/InboxEvidences';
import { ActivitiesManager } from '@/pages/ActivitiesManager';
import { ActivityDetail } from '@/pages/ActivityDetail';
import type { EvidenciaRow } from '@/services/EvidenceService';
import type { ActividadRow } from '@/services/ActivityService';
import { CheckCircle2, X } from 'lucide-react';

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

      {/* Renderizado condicional de vistas */}
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
        <InboxEvidences
          onSelectEvidence={(evidence: EvidenciaRow) => {
            console.log('[App] Evidencia seleccionada:', evidence);
          }}
          onNotification={handleShowNotification}
        />
      )}
    </DashboardLayout>
  );
};

export default App;
