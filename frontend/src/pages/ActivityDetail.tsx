import React, { useState, useEffect, useCallback } from 'react';
import {
  activityService,
  type ActividadRow,
} from '../services/ActivityService';
import {
  evidenceService,
  type EvidenciaRow,
} from '../services/EvidenceService';
import { PdfExporter, type LinkedEvidenceItem } from '../components/reports/PdfExporter';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabaseClient';

export interface ActivityDetailProps {
  activity: ActividadRow;
  onBack: () => void;
  onActivityUpdated?: (activity: ActividadRow) => void;
  bucketName?: string;
}

export const ActivityDetail: React.FC<ActivityDetailProps> = ({
  activity,
  onBack,
  onActivityUpdated,
  bucketName = 'evidencias',
}) => {
  const [currentActivity, setCurrentActivity] = useState<ActividadRow>(activity);
  const [linkedItems, setLinkedItems] = useState<LinkedEvidenceItem[]>([]);
  const [loadingLinked, setLoadingLinked] = useState<boolean>(true);
  const [errorLinked, setErrorLinked] = useState<string | null>(null);

  // Estados del selector / modal de evidencias pendientes
  const [isLinkModalOpen, setIsLinkModalOpen] = useState<boolean>(false);
  const [pendingEvidences, setPendingEvidences] = useState<EvidenciaRow[]>([]);
  const [loadingPending, setLoadingPending] = useState<boolean>(false);
  const [linkingEvidenceId, setLinkingEvidenceId] = useState<string | null>(null);
  const [linkNotas, setLinkNotas] = useState<string>('');

  // Notificación local de éxito o feedback
  const [notification, setNotification] = useState<string | null>(null);

  // Cargar las evidencias ya vinculadas a esta actividad
  const fetchLinkedEvidences = useCallback(async () => {
    setLoadingLinked(true);
    setErrorLinked(null);
    try {
      const data = await activityService.getEvidenciasVinculadas(currentActivity.id);
      setLinkedItems(data);
    } catch (err: unknown) {
      console.error('[ActivityDetail] Error cargando evidencias vinculadas:', err);
      setErrorLinked(err instanceof Error ? err.message : 'Error al obtener evidencias vinculadas.');
    } finally {
      setLoadingLinked(false);
    }
  }, [currentActivity.id]);

  useEffect(() => {
    fetchLinkedEvidences();
  }, [fetchLinkedEvidences]);

  // Cargar evidencias con estado 'pendiente' para el selector
  const fetchPendingEvidences = async () => {
    setLoadingPending(true);
    try {
      const data = await evidenceService.getByEstado('pendiente');
      setPendingEvidences(data);
    } catch (err: unknown) {
      console.error('[ActivityDetail] Error cargando evidencias pendientes:', err);
    } finally {
      setLoadingPending(false);
    }
  };

  const handleOpenLinkModal = () => {
    fetchPendingEvidences();
    setLinkNotas('');
    setIsLinkModalOpen(true);
  };

  // Vinculación atómica y actualización optimista de la UI
  const handleVincularEvidencia = async (evidencia: EvidenciaRow) => {
    setLinkingEvidenceId(evidencia.id);
    const prevLinked = [...linkedItems];
    const prevPending = [...pendingEvidences];

    // Actualización optimista:
    // 1. Crear el ítem provisional vinculado
    const optimisticItem: LinkedEvidenceItem = {
      vinculo: {
        actividad_id: currentActivity.id,
        evidencia_id: evidencia.id,
        notas: linkNotas || null,
        vinculado_en: new Date().toISOString(),
        vinculado_por: null,
      },
      evidencia: {
        ...evidencia,
        estado: 'vinculada',
      },
      identificacion: null,
    };

    setLinkedItems((prev) => [optimisticItem, ...prev]);
    setPendingEvidences((prev) => prev.filter((e) => e.id !== evidencia.id));

    try {
      // Llamada real al RPC atómico a través de ActivityService
      await activityService.vincularEvidencia(
        evidencia.id,
        currentActivity.id,
        linkNotas.trim() || undefined
      );

      setNotification(`Evidencia "${evidencia.nombre_archivo}" vinculada correctamente.`);
      setTimeout(() => setNotification(null), 3500);

      // Re-sincronizar de fondo para traer identificaciones OCR si existen
      fetchLinkedEvidences();
    } catch (err: unknown) {
      console.error('[ActivityDetail] Error al vincular evidencia:', err);
      // Revertir optimismo en caso de error
      setLinkedItems(prevLinked);
      setPendingEvidences(prevPending);
      alert('No se pudo vincular la evidencia. Por favor revisa la conexión.');
    } finally {
      setLinkingEvidenceId(null);
    }
  };

  // Al terminar la exportación a PDF, actualizar estado_reporte a 'exportada'
  const handleAfterPrint = async () => {
    try {
      if (currentActivity.estado_reporte !== 'exportada') {
        const updated = await activityService.update(currentActivity.id, {
          estado_reporte: 'exportada',
        });
        setCurrentActivity(updated);
        if (onActivityUpdated) onActivityUpdated(updated);
      }
    } catch (err: unknown) {
      console.warn('[ActivityDetail] No se pudo actualizar estado_reporte a exportada:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Retorno y Cabecera de la Actividad */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Volver a la lista de actividades"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-sky-700 dark:text-sky-400 px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800">
                {currentActivity.codigo_referencia}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {currentActivity.estado_reporte}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 capitalize">
              {currentActivity.tipo_actividad.replace(/_/g, ' ')} &bull; {currentActivity.ubicacion}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Responsable: {currentActivity.responsable_nombre} &bull; Fecha: {currentActivity.fecha_operacion}
            </p>
          </div>
        </div>

        {/* Botón para Abrir Modal de Vinculación */}
        <button
          type="button"
          onClick={handleOpenLinkModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer shrink-0"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span>Vincular Evidencias Fotográficas</span>
        </button>
      </div>

      {/* Banner de Notificación */}
      {notification && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-fade-in shadow-xs">
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{notification}</span>
        </div>
      )}

      {/* Sección: Evidencias Vinculadas y Generador de Ficha PDF */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Ficha de Inspección y Evidencias Asociadas</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {linkedItems.length} vinculadas
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Previsualización interactiva de la Ficha A4 con miniaturas fotográficas, lecturas OCR y Hash SHA-256.
              </p>
            </div>
          </div>

          {loadingLinked ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium">Cargando evidencias vinculadas...</p>
            </div>
          ) : errorLinked ? (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs">
              {errorLinked}
            </div>
          ) : (
            <PdfExporter
              actividad={currentActivity}
              evidenciasVinculadas={linkedItems}
              bucketName={bucketName}
              inspectorName={currentActivity.responsable_nombre}
              onAfterPrint={handleAfterPrint}
            />
          )}
        </div>
      </div>

      {/* Modal Selector de Evidencias 'Pendientes' para Vincular */}
      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title="Vincular Evidencia a esta Actividad"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notas u observaciones de vinculación (opcional):
            </label>
            <input
              type="text"
              value={linkNotas}
              onChange={(e) => setLinkNotas(e.target.value)}
              placeholder="Ej. Foto tomada durante la verificación del portón principal..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
              Evidencias con Estado "Pendiente" ({pendingEvidences.length})
            </h4>

            {loadingPending ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Cargando bandeja de evidencias pendientes...
              </div>
            ) : pendingEvidences.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                No hay fotos pendientes de vinculación. Sube nuevas imágenes desde la bandeja.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {pendingEvidences.map((ev) => {
                  const thumbPath = ev.ruta_thumb || ev.ruta_storage;
                  const thumbUrl = thumbPath
                    ? supabase.storage.from(bucketName).getPublicUrl(thumbPath).data.publicUrl
                    : '';

                  const isLinkingThis = linkingEvidenceId === ev.id;

                  return (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {thumbUrl ? (
                            <img
                              src={thumbUrl}
                              alt={ev.nombre_archivo}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400">Sin foto</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                            {ev.nombre_archivo}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 truncate max-w-xs">
                            SHA: {ev.hash_sha256.substring(0, 16)}...
                          </p>
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                            {ev.estado}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleVincularEvidencia(ev)}
                        disabled={isLinkingThis}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1 shrink-0"
                      >
                        {isLinkingThis ? (
                          <span>Vinculando...</span>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Vincular</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsLinkModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ActivityDetail;
