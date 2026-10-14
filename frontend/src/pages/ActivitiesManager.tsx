import React, { useState, useEffect, useCallback } from 'react';
import {
  activityService,
  type ActividadRow,
  type ActividadInsert,
  type ActividadUpdate,
} from '../services/ActivityService';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { DataNodeOrb } from '../components/voice/DataNodeOrb';
import { Modal } from '../components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  RefreshCw,
  MapPin,
  Calendar,
  User,
  ArrowRight,
  Layers,
  LayoutGrid,
  TableProperties,
  Edit2,
  CloudCheck,
  Sparkles,
} from 'lucide-react';
import { SmartReportGeneratorModal } from '../components/reports/SmartReportGeneratorModal';
import { toast } from 'sonner';

export interface ActivitiesManagerProps {
  onSelectActivity?: (activity: ActividadRow) => void;
}

export const ActivitiesManager: React.FC<ActivitiesManagerProps> = ({ onSelectActivity }) => {
  const [activities, setActivities] = useState<ActividadRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Estados del modal de Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingActivity, setEditingActivity] = useState<ActividadRow | null>(null);

  // Estado del Asistente Generador Inteligente desde WhatsApp / Fotos
  const [isSmartModalOpen, setIsSmartModalOpen] = useState<boolean>(false);

  // Campos del formulario con tipos estrictos alineados a Database['public']['Tables']['actividades']
  const [formData, setFormData] = useState<{
    codigo_referencia: string;
    tipo_actividad: 'INSPECCION' | 'CAPACITACION' | 'AUDITORIA' | 'AMONESTACION';
    ubicacion: string;
    fecha_operacion: string;
    responsable_nombre: string;
    descripcion: string;
    estado_reporte: 'pendiente' | 'exportada' | 'publicada';
    amonestado_nombre: string;
    amonestado_dni: string;
    amonestado_cargo: string;
    amonestado_empresa: string;
    motivo_codigo: '01' | '02' | '03' | '04';
    nivel_riesgo: '01_INTOLERABLE' | '02_BAJO' | '03_MODERADO' | '04_OTRO';
    sancion_tipo: '01_LLAMADA_ATENCION' | '02_SUSPENSION' | '03_RETIRO_INMEDIATO' | '04_OTRO';
    accion_inmediata: string;
  }>({
    codigo_referencia: '',
    tipo_actividad: 'INSPECCION',
    ubicacion: '',
    fecha_operacion: new Date().toISOString().split('T')[0],
    responsable_nombre: '',
    descripcion: '',
    estado_reporte: 'pendiente',
    amonestado_nombre: '',
    amonestado_dni: '',
    amonestado_cargo: '',
    amonestado_empresa: '',
    motivo_codigo: '02',
    nivel_riesgo: '02_BAJO',
    sancion_tipo: '01_LLAMADA_ATENCION',
    accion_inmediata: '',
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Campo actualmente en foco para dictado inteligente
  const [activeVoiceField, setActiveVoiceField] = useState<'descripcion' | 'accion_inmediata'>('descripcion');

  // Integración de Asistente de Voz con useVoiceAssistant para el formulario
  const {
    isListening,
    interimTranscript,
    isSupported: isSpeechSupported,
    startSession,
    stopSession,
    resetSession,
  } = useVoiceAssistant({
    lang: 'es-PE',
    onResult: (dictatedText) => {
      setFormData((prev) => {
        if (activeVoiceField === 'accion_inmediata') {
          return {
            ...prev,
            accion_inmediata: prev.accion_inmediata
              ? `${prev.accion_inmediata} ${dictatedText}`.trim()
              : dictatedText,
          };
        }
        return {
          ...prev,
          descripcion: prev.descripcion
            ? `${prev.descripcion} ${dictatedText}`.trim()
            : dictatedText,
        };
      });
    },
  });

  // Cargar actividades
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await activityService.getAll();
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
      tipo_actividad: 'INSPECCION',
      ubicacion: '',
      fecha_operacion: new Date().toISOString().split('T')[0],
      responsable_nombre: '',
      descripcion: '',
      estado_reporte: 'pendiente',
      amonestado_nombre: '',
      amonestado_dni: '',
      amonestado_cargo: '',
      amonestado_empresa: '',
      motivo_codigo: '02',
      nivel_riesgo: '02_BAJO',
      sancion_tipo: '01_LLAMADA_ATENCION',
      accion_inmediata: '',
    });
    resetSession();
    setFormError(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleOpenEdit = (act: ActividadRow) => {
    setEditingActivity(act);
    const datosHse = (act.datos_formato_json as any) || {};
    const amon = datosHse.datos_amonestado || {};
    const mot = datosHse.motivo_amonestacion || {};
    setFormData({
      codigo_referencia: act.codigo_referencia,
      tipo_actividad: (act.tipo_actividad as 'INSPECCION' | 'CAPACITACION' | 'AUDITORIA' | 'AMONESTACION') || 'INSPECCION',
      ubicacion: act.ubicacion,
      fecha_operacion: act.fecha_operacion ? act.fecha_operacion.split('T')[0] : '',
      responsable_nombre: act.responsable_nombre,
      descripcion: act.descripcion || '',
      estado_reporte: (act.estado_reporte as 'pendiente' | 'exportada' | 'publicada') || 'pendiente',
      amonestado_nombre: amon.apellidos_nombres || '',
      amonestado_dni: amon.dni || '',
      amonestado_cargo: amon.cargo || '',
      amonestado_empresa: amon.empresa || '',
      motivo_codigo: mot.codigo_motivo || '02',
      nivel_riesgo: datosHse.nivel_riesgo || '02_BAJO',
      sancion_tipo: datosHse.sancion_aplicada_risst || '01_LLAMADA_ATENCION',
      accion_inmediata: datosHse.accion_inmediata_hechos || '',
    });
    resetSession();
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

    // Sanitización general para entradas de texto libre
    const cleanStr = (s: string) => s.replace(/<[^>]*>?/gm, '').trim();

    try {
      // Construir objeto JSONB según tipo de actividad con strings higienizados
      let formatoJson: Record<string, unknown> = {};
      if (formData.tipo_actividad === 'AMONESTACION') {
        formatoJson = {
          tipo_formato: 'HSE_EL_F_128',
          datos_amonestado: {
            apellidos_nombres: cleanStr(formData.amonestado_nombre),
            dni: cleanStr(formData.amonestado_dni),
            cargo: cleanStr(formData.amonestado_cargo),
            empresa: cleanStr(formData.amonestado_empresa),
            ubicacion: cleanStr(formData.ubicacion),
            fecha_hora: `${formData.fecha_operacion} 08:00`,
          },
          supervisores_responsables: {
            capataz_cuadrilla: 'Capataz de Turno',
            ingeniero_responsable: cleanStr(formData.responsable_nombre),
            actividad_en_ejecucion: cleanStr(formData.descripcion) || 'Operación en campo',
          },
          motivo_amonestacion: {
            codigo_motivo: formData.motivo_codigo,
            descripcion_motivo: formData.motivo_codigo === '01' ? 'Falta RIIST' : formData.motivo_codigo === '02' ? 'Acto Subestándar' : formData.motivo_codigo === '03' ? 'Observación HSE' : 'Condición Subestándar',
            detalle_motivo: cleanStr(formData.descripcion) || 'Infracción a normas de seguridad y salud en el trabajo.',
          },
          nivel_riesgo: formData.nivel_riesgo,
          accion_inmediata_hechos: cleanStr(formData.accion_inmediata) || 'Paralización de labor e instrucción inmediata.',
          sancion_aplicada_risst: formData.sancion_tipo,
          dias_suspension: formData.sancion_tipo === '02_SUSPENSION' ? 3 : undefined,
          validaciones_firmas: {
            realizado_por: cleanStr(formData.responsable_nombre),
            aprobado_por: 'Ing. Jefe HSE',
            aceptado_por: cleanStr(formData.amonestado_nombre) || 'Trabajador Notificado',
          },
        };
      } else {
        formatoJson = {
          tipo_formato: 'CHECKLIST_15_SECCIONES',
          items_evaluados: {},
        };
      }

      if (editingActivity) {
        const changes: ActividadUpdate = {
          tipo_actividad: formData.tipo_actividad,
          ubicacion: formData.ubicacion,
          fecha_operacion: formData.fecha_operacion,
          responsable_nombre: formData.responsable_nombre,
          descripcion: formData.descripcion || null,
          estado_reporte: formData.estado_reporte,
          datos_formato_json: formatoJson as any,
        };
        const updated = await activityService.update(editingActivity.id, changes);
        setActivities((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        toast.success('Actividad actualizada', {
          description: `Se guardaron los cambios para ${updated.codigo_referencia}.`,
        });
      } else {
        const newAct: ActividadInsert = {
          codigo_referencia: formData.codigo_referencia.trim(),
          tipo_actividad: formData.tipo_actividad,
          ubicacion: formData.ubicacion.trim(),
          fecha_operacion: formData.fecha_operacion,
          responsable_nombre: formData.responsable_nombre.trim(),
          descripcion: formData.descripcion || null,
          estado_reporte: formData.estado_reporte,
          datos_formato_json: formatoJson as any,
        };
        const created = await activityService.create(newAct);
        setActivities((prev) => [created, ...prev]);
        toast.success('Actividad creada exitosamente', {
          description: `Código: ${created.codigo_referencia} sincronizado en la nube.`,
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      console.error('[ActivitiesManager] Error guardando actividad:', err);
      const msg = err instanceof Error ? err.message : 'Error inesperado al guardar actividad en Supabase.';
      setFormError(msg);
      toast.error('Error al guardar actividad', { description: msg });
    } finally {
      setSaving(false);
    }
  };

  const toggleVoiceDictation = (field?: 'descripcion' | 'accion_inmediata') => {
    if (field) {
      setActiveVoiceField(field);
    }
    if (isListening) {
      stopSession();
    } else {
      startSession();
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'aprobado':
      case 'emitido':
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">Emitido</Badge>;
      case 'en_revision':
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">En Revisión</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Borrador</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Corporativa con Card */}
      <Card className="border-border shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                Gestor de Actividades e Inspecciones
              </CardTitle>
              <Badge variant="secondary" className="font-mono text-xs">
                {activities.length} registradas
              </Badge>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CloudCheck className="w-3.5 h-3.5" />
                <span>Nube Conectada</span>
              </span>
            </div>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">
              Administra órdenes de trabajo operativas, asocia evidencias fotográficas forenses y genera fichas de inspección inmutables.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle de vistas: Tabla / Tarjetas */}
            <div className="inline-flex rounded-lg border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Vista en Tabla"
              >
                <TableProperties className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Vista en Tarjetas"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSmartModalOpen(true)}
              className="gap-1.5 cursor-pointer border-amber-500/40 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold"
              title="Generar automáticamente informe pre-llenado desde captura de WhatsApp o lote de fotos con OCR"
            >
              <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
              <span className="hidden sm:inline">Generar Informe desde</span> Captura WhatsApp / Fotos
            </Button>

            <Button
              type="button"
              onClick={handleOpenCreate}
              className="gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Actividad</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Estado: Loading */}
      {loading ? (
        <Card className="p-12 text-center border-border">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Cargando actividades desde Supabase...</p>
        </Card>
      ) : error ? (
        <Card className="p-4 border-destructive/40 bg-destructive/10 text-destructive text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchActivities}
            className="cursor-pointer gap-1.5"
          >
            <RefreshCw className="h-3 w-3" />
            Reintentar
          </Button>
        </Card>
      ) : activities.length === 0 ? (
        <Card className="p-12 text-center border-2 border-dashed border-border bg-muted/20">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">No hay actividades creadas</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Crea la primera orden de inspección para comenzar a vincular evidencias.
          </p>
          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Crear Actividad Inicial
          </Button>
        </Card>
      ) : viewMode === 'table' ? (
        /* Vista en Tabla shadcn con scroll horizontal fluido en móvil */
        <Card className="border-border overflow-hidden">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[140px] font-semibold">Código Ref.</TableHead>
                <TableHead className="font-semibold">Tipo de Actividad</TableHead>
                <TableHead className="font-semibold">Ubicación</TableHead>
                <TableHead className="font-semibold">Fecha</TableHead>
                <TableHead className="font-semibold">Responsable</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="text-right font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((act) => {
                const formattedDate = act.fecha_operacion
                  ? new Date(act.fecha_operacion).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Sin fecha';

                return (
                  <TableRow key={act.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono font-semibold text-xs text-primary">
                      {act.codigo_referencia}
                    </TableCell>
                    <TableCell className="capitalize font-medium text-xs">
                      {act.tipo_actividad.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate max-w-[180px]">{act.ubicacion}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span>{formattedDate}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate max-w-[150px]">{act.responsable_nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(act.estado_reporte)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(act)}
                          className="h-8 px-2 text-xs cursor-pointer"
                          title="Editar actividad"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSelectActivity && onSelectActivity(act)}
                          className="h-8 px-2.5 text-xs gap-1 cursor-pointer font-medium"
                        >
                          <span>Detalle</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </Card>
      ) : (
        /* Vista en Tarjetas shadcn Card */
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
              <Card
                key={act.id}
                className="border-border hover:shadow-md hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-muted">
                      {act.codigo_referencia}
                    </span>
                    {getStatusBadge(act.estado_reporte)}
                  </div>
                  <CardTitle className="text-sm font-semibold capitalize text-foreground">
                    {act.tipo_actividad.replace(/_/g, ' ')}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-2 text-xs text-muted-foreground py-0">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{act.ubicacion}</span>
                  </p>

                  <p className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span>{formattedDate}</span>
                  </p>

                  <p className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">Resp: <b>{act.responsable_nombre}</b></span>
                  </p>

                  {act.descripcion && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2 italic bg-muted/40 p-2 rounded-md">
                      "{act.descripcion}"
                    </p>
                  )}
                </CardContent>

                <CardFooter className="pt-3 mt-3 border-t border-border flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(act)}
                    className="h-8 text-xs cursor-pointer"
                  >
                    Editar
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectActivity && onSelectActivity(act)}
                    className="h-8 text-xs gap-1.5 cursor-pointer font-medium"
                  >
                    <span>Ver Detalle y Evidencias</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
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
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-foreground">
                Código de Referencia
              </label>
              <Input
                type="text"
                value={formData.codigo_referencia}
                onChange={(e) => setFormData({ ...formData, codigo_referencia: e.target.value })}
                className="font-mono text-xs"
                placeholder="ACT-2026-0001"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-foreground">
                Tipo de Actividad
              </label>
              <select
                value={formData.tipo_actividad}
                onChange={(e) => setFormData({ ...formData, tipo_actividad: e.target.value as 'INSPECCION' | 'CAPACITACION' | 'AUDITORIA' | 'AMONESTACION' })}
                className="w-full h-9 px-3 py-1 text-xs rounded-md border border-input bg-background text-foreground shadow-xs focus:ring-1 focus:ring-ring focus:outline-none"
              >
                <option value="INSPECCION">Inspección de Seguridad</option>
                <option value="CAPACITACION">Capacitación / Charla</option>
                <option value="AUDITORIA">Auditoría en Campo</option>
                <option value="AMONESTACION">Registro de Amonestación (F-128)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-foreground">
                Ubicación / Sector
              </label>
              <Input
                type="text"
                value={formData.ubicacion}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                className="text-xs"
                placeholder="Planta Principal - Sector B"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-foreground">
                Fecha de Operación
              </label>
              <Input
                type="date"
                value={formData.fecha_operacion}
                onChange={(e) => setFormData({ ...formData, fecha_operacion: e.target.value })}
                className="text-xs"
                required
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-semibold text-foreground">
                Responsable de Operación
              </label>
              <Input
                type="text"
                value={formData.responsable_nombre}
                onChange={(e) => setFormData({ ...formData, responsable_nombre: e.target.value })}
                className="text-xs"
                placeholder="Ing. Carlos Mendoza"
                required
              />
            </div>
          </div>

          {/* Sección de Campos HSE-EL-F-128 si la actividad es de tipo AMONESTACION */}
          {formData.tipo_actividad === 'AMONESTACION' && (
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-destructive uppercase tracking-tight">
                  Datos del Formato de Amonestación HSE-EL-F-128
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-foreground">
                    Trabajador Amonestado (Apellidos y Nombres)
                  </label>
                  <Input
                    type="text"
                    value={formData.amonestado_nombre}
                    onChange={(e) => setFormData({ ...formData, amonestado_nombre: e.target.value })}
                    className="text-xs h-8"
                    placeholder="Quispe Mamani Juan"
                    required={formData.tipo_actividad === 'AMONESTACION'}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-foreground">
                    DNI / Documento de Identidad
                  </label>
                  <Input
                    type="text"
                    value={formData.amonestado_dni}
                    onChange={(e) => setFormData({ ...formData, amonestado_dni: e.target.value })}
                    className="text-xs h-8 font-mono"
                    placeholder="45892134"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-foreground">
                    Cargo / Ocupación
                  </label>
                  <Input
                    type="text"
                    value={formData.amonestado_cargo}
                    onChange={(e) => setFormData({ ...formData, amonestado_cargo: e.target.value })}
                    className="text-xs h-8"
                    placeholder="Andamiero / Operador"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-foreground">
                    Empresa Contratista
                  </label>
                  <Input
                    type="text"
                    value={formData.amonestado_empresa}
                    onChange={(e) => setFormData({ ...formData, amonestado_empresa: e.target.value })}
                    className="text-xs h-8"
                    placeholder="Contratista Minera SAC"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-foreground">
                    Motivo de Amonestación
                  </label>
                  <select
                    value={formData.motivo_codigo}
                    onChange={(e) => setFormData({ ...formData, motivo_codigo: e.target.value as any })}
                    className="w-full h-8 px-2 text-xs rounded-md border border-input bg-background text-foreground shadow-xs focus:ring-1 focus:ring-ring focus:outline-none"
                  >
                    <option value="01">01. Falta HSE (RIIST)</option>
                    <option value="02">02. Acto Subestándar</option>
                    <option value="03">03. Observación HSE</option>
                    <option value="04">04. Condición Subestándar</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-foreground">
                    Nivel de Riesgo
                  </label>
                  <select
                    value={formData.nivel_riesgo}
                    onChange={(e) => setFormData({ ...formData, nivel_riesgo: e.target.value as any })}
                    className="w-full h-8 px-2 text-xs rounded-md border border-input bg-background text-foreground shadow-xs focus:ring-1 focus:ring-ring focus:outline-none"
                  >
                    <option value="01_INTOLERABLE">01. Intolerable</option>
                    <option value="02_BAJO">02. Bajo</option>
                    <option value="03_MODERADO">03. Moderado</option>
                    <option value="04_OTRO">04. Otro</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[11px] font-medium text-foreground">
                    Sanción Aplicada (según RISST)
                  </label>
                  <select
                    value={formData.sancion_tipo}
                    onChange={(e) => setFormData({ ...formData, sancion_tipo: e.target.value as any })}
                    className="w-full h-8 px-2 text-xs rounded-md border border-input bg-background text-foreground shadow-xs focus:ring-1 focus:ring-ring focus:outline-none"
                  >
                    <option value="01_LLAMADA_ATENCION">01. Llamada de Atención Escrita</option>
                    <option value="02_SUSPENSION">02. Suspensión de Labores (3 días)</option>
                    <option value="03_RETIRO_INMEDIATO">03. Retiro Inmediato del Proyecto</option>
                    <option value="04_OTRO">04. Otra Medida Disciplinaria</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-foreground">
                      Acción Inmediata Adoptada en Sitio
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleVoiceDictation('accion_inmediata')}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium cursor-pointer transition-all ${
                        isListening && activeVoiceField === 'accion_inmediata'
                          ? 'bg-emerald-500 text-white animate-pulse shadow-md shadow-emerald-500/30'
                          : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                      }`}
                      title="Dictar acción inmediata"
                    >
                      <DataNodeOrb
                        size="sm"
                        state={isListening && activeVoiceField === 'accion_inmediata' ? 'listening' : 'idle'}
                        className="w-4 h-4"
                      />
                      <span>
                        {isListening && activeVoiceField === 'accion_inmediata'
                          ? 'Dictando Acción...'
                          : 'Dictar Acción'}
                      </span>
                    </button>
                  </div>
                  <Input
                    type="text"
                    value={formData.accion_inmediata}
                    onFocus={() => setActiveVoiceField('accion_inmediata')}
                    onChange={(e) => setFormData({ ...formData, accion_inmediata: e.target.value })}
                    className="text-xs h-8"
                    placeholder="Paralización de labor y re-inducción al trabajador"
                  />
                  {isListening && activeVoiceField === 'accion_inmediata' && interimTranscript && (
                    <p className="text-[11px] text-emerald-500 italic mt-0.5 font-mono">
                      Dictando acción: {interimTranscript}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Campo Descripción con Orbe y Dictado por Voz */}
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-foreground">
                Descripción / Observaciones
              </label>

              {/* Botón de Dictado con DataNodeOrb */}
              <button
                type="button"
                onClick={() => toggleVoiceDictation('descripcion')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
                  isListening && activeVoiceField === 'descripcion'
                    ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                    : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                }`}
                title={isSpeechSupported ? 'Dictar por voz en español' : 'Voz no soportada'}
              >
                <DataNodeOrb
                  size="sm"
                  state={isListening && activeVoiceField === 'descripcion' ? 'listening' : 'idle'}
                  className="w-4 h-4"
                />
                <span>
                  {isListening && activeVoiceField === 'descripcion'
                    ? 'Escuchando (es-PE)...'
                    : 'Dictar Descripción'}
                </span>
              </button>
            </div>

            <textarea
              rows={3}
              value={formData.descripcion}
              onFocus={() => setActiveVoiceField('descripcion')}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-md border border-input bg-background text-foreground shadow-xs focus:ring-1 focus:ring-ring focus:outline-none"
              placeholder="Dicta o escribe notas de campo sobre la inspección..."
            />

            {isListening && activeVoiceField === 'descripcion' && interimTranscript && (
              <p className="text-[11px] text-primary italic mt-1 font-mono">
                Dictando descripción: {interimTranscript}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="cursor-pointer"
            >
              {saving ? 'Guardando...' : editingActivity ? 'Actualizar' : 'Crear Actividad'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Asistente Visual Inteligente desde WhatsApp / Fotos */}
      <SmartReportGeneratorModal
        isOpen={isSmartModalOpen}
        onClose={() => setIsSmartModalOpen(false)}
        onActivityCreated={(created) => {
          setActivities((prev) => [created, ...prev]);
          if (onSelectActivity) {
            onSelectActivity(created);
          }
        }}
      />
    </div>
  );
};

export default ActivitiesManager;
