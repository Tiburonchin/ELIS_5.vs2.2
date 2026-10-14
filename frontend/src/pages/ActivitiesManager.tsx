import React, { useState, useEffect, useCallback } from 'react';
import {
  activityService,
  type ActividadRow,
  type ActividadInsert,
  type ActividadUpdate,
} from '../services/ActivityService';
import { useSpeech } from '../hooks/useSpeech';
import { Modal } from '../components/ui/Modal';

export interface ActivitiesManagerProps {
  onSelectActivity?: (activity: ActividadRow) => void;
}

export const ActivitiesManager: React.FC<ActivitiesManagerProps> = ({ onSelectActivity }) => {
  const [activities, setActivities] = useState<ActividadRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados del modal de Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingActivity, setEditingActivity] = useState<ActividadRow | null>(null);

  // Campos del formulario
  const [formData, setFormData] = useState({
    codigo_referencia: '',
    tipo_actividad: 'inspeccion_rutinaria',
    ubicacion: '',
    fecha_operacion: new Date().toISOString().split('T')[0],
    responsable_nombre: '',
    descripcion: '',
    estado_reporte: 'borrador',
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Integración de Reconocimiento por Voz para el campo "Descripción"
  const {
    isListening,
    interimTranscript,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeech({
    lang: 'es-PE',
    onResult: (dictatedText) => {
      setFormData((prev) => ({
        ...prev,
        descripcion: prev.descripcion
          ? `${prev.descripcion} ${dictatedText}`.trim()
          : dictatedText,
      }));
    },
  });

  // Cargar actividades
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await activityService.getAll();
      // Ordenar por fecha_operacion descendente
      const sorted = [...result.data].sort((a, b) => {
        return new Date(b.fecha_operacion).getTime() - new Date(a.fecha_operacion).getTime();
      });
      setActivities(sorted);
    } catch (err: unknown) {
      console.error('[ActivitiesManager] Error cargando actividades:', err);
      setError(err instanceof Error ? err.message : 'Error al obtener actividades.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Abrir modal para crear
  const handleOpenCreate = () => {
    setEditingActivity(null);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    setFormData({
      codigo_referencia: `ACT-${year}-${randomSuffix}`,
      tipo_actividad: 'inspeccion_rutinaria',
      ubicacion: '',
      fecha_operacion: new Date().toISOString().split('T')[0],
      responsable_nombre: '',
      descripcion: '',
      estado_reporte: 'borrador',
    });
    resetTranscript();
    setFormError(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleOpenEdit = (act: ActividadRow) => {
    setEditingActivity(act);
    setFormData({
      codigo_referencia: act.codigo_referencia,
      tipo_actividad: act.tipo_actividad,
      ubicacion: act.ubicacion,
      fecha_operacion: act.fecha_operacion ? act.fecha_operacion.split('T')[0] : '',
      responsable_nombre: act.responsable_nombre,
      descripcion: act.descripcion || '',
      estado_reporte: act.estado_reporte,
    });
    resetTranscript();
    setFormError(null);
    setIsModalOpen(true);
  };

  // Guardar actividad (Crear o Editar)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo_referencia.trim()) {
      setFormError('El código de referencia es obligatorio.');
      return;
    }
    if (!formData.ubicacion.trim()) {
      setFormError('La ubicación es obligatoria.');
      return;
    }
    if (!formData.responsable_nombre.trim()) {
      setFormError('El nombre del responsable es obligatorio.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (editingActivity) {
        // Actualizar
        const changes: ActividadUpdate = {
          tipo_actividad: formData.tipo_actividad,
          ubicacion: formData.ubicacion,
          fecha_operacion: formData.fecha_operacion,
          responsable_nombre: formData.responsable_nombre,
          descripcion: formData.descripcion || null,
          estado_reporte: formData.estado_reporte,
        };
        const updated = await activityService.update(editingActivity.id, changes);
        setActivities((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
      } else {
        // Crear
        const newAct: ActividadInsert = {
          codigo_referencia: formData.codigo_referencia.trim(),
          tipo_actividad: formData.tipo_actividad,
          ubicacion: formData.ubicacion.trim(),
          fecha_operacion: formData.fecha_operacion,
          responsable_nombre: formData.responsable_nombre.trim(),
          descripcion: formData.descripcion || null,
          estado_reporte: formData.estado_reporte,
        };
        const created = await activityService.create(newAct);
        setActivities((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      console.error('[ActivitiesManager] Error guardando actividad:', err);
      setFormError(err instanceof Error ? err.message : 'Error al guardar la actividad.');
    } finally {
      setSaving(false);
    }
  };

  // Dictado por voz: alternar encendido / apagado
  const toggleVoiceDictation = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera y botón de nueva actividad */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Gestor de Actividades e Inspecciones</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
              {activities.length} registradas
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Administra órdenes operativas, asocia evidencias fotográficas en campo y genera fichas técnicas inmutables.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 active:scale-[0.98] transition-all cursor-pointer shrink-0"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva Actividad</span>
        </button>
      </div>

      {/* Lista de Actividades */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium">Cargando actividades desde Supabase...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchActivities}
            className="text-xs underline font-semibold hover:text-rose-800"
          >
            Reintentar
          </button>
        </div>
      ) : activities.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/50">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No hay actividades creadas</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            Crea la primera actividad operativa para comenzar a vincular evidencias.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-500 cursor-pointer"
          >
            Crear Actividad Inicial
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((act) => {
            const formattedDate = act.fecha_operacion
              ? new Date(act.fecha_operacion).toLocaleDateString('es-PE', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Sin fecha';

            return (
              <div
                key={act.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-sky-500/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-sky-700 dark:text-sky-400 px-2.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800">
                      {act.codigo_referencia}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {act.estado_reporte}
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 capitalize">
                    {act.tipo_actividad.replace(/_/g, ' ')}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <p className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{act.ubicacion}</span>
                    </p>

                    <p className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formattedDate}</span>
                    </p>

                    <p className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="truncate">Resp: <b>{act.responsable_nombre}</b></span>
                    </p>
                  </div>

                  {act.descripcion && (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                      "{act.descripcion}"
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(act)}
                    className="p-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Editar actividad"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectActivity && onSelectActivity(act)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
                  >
                    <span>Ver Detalle y Evidencias</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Crear / Editar Actividad */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingActivity ? 'Editar Actividad' : 'Nueva Actividad Operativa'}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Código de Referencia
              </label>
              <input
                type="text"
                value={formData.codigo_referencia}
                onChange={(e) => setFormData({ ...formData, codigo_referencia: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="ACT-2026-0001"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Actividad
              </label>
              <select
                value={formData.tipo_actividad}
                onChange={(e) => setFormData({ ...formData, tipo_actividad: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="inspeccion_rutinaria">Inspección Rutinaria</option>
                <option value="supervision_seguridad">Supervisión de Seguridad</option>
                <option value="auditoria_campo">Auditoría en Campo</option>
                <option value="mantenimiento_preventivo">Mantenimiento Preventivo</option>
                <option value="incidente_operativo">Incidente Operativo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ubicación / Sector
              </label>
              <input
                type="text"
                value={formData.ubicacion}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="Planta Principal - Sector B"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fecha de Operación
              </label>
              <input
                type="date"
                value={formData.fecha_operacion}
                onChange={(e) => setFormData({ ...formData, fecha_operacion: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Responsable de Operación
              </label>
              <input
                type="text"
                value={formData.responsable_nombre}
                onChange={(e) => setFormData({ ...formData, responsable_nombre: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="Ing. Carlos Mendoza"
                required
              />
            </div>
          </div>

          {/* Campo Descripción con Botón de Dictado por Voz */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Descripción / Observaciones
              </label>

              {/* Botón Micrófono useSpeech */}
              <button
                type="button"
                onClick={toggleVoiceDictation}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                    : 'bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                }`}
                title={isSpeechSupported ? 'Dictar por voz en español' : 'Voz no soportada'}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span>{isListening ? 'Escuchando (es-PE)...' : 'Dictar por Voz'}</span>
              </button>
            </div>

            <textarea
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              placeholder="Dicta o escribe notas de campo sobre la inspección..."
            />

            {isListening && interimTranscript && (
              <p className="text-[11px] text-sky-600 dark:text-sky-400 italic mt-1">
                Dictando: {interimTranscript}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white cursor-pointer shadow-md disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editingActivity ? 'Actualizar' : 'Crear Actividad'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ActivitiesManager;
