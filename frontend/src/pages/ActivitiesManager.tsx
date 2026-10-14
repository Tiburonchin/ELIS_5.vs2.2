import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
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
  Search,
  ClipboardCheck,
  AlertTriangle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  X,
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

  // Filtros y Búsqueda
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'TODAS' | 'INSPECCION' | 'AMONESTACION' | 'OTROS'>('TODAS');

  // Paginación limpia
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

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
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 whitespace-nowrap">Emitido</Badge>;
      case 'en_revision':
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 whitespace-nowrap">En Revisión</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground whitespace-nowrap">Borrador</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'INSPECCION':
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 font-medium whitespace-nowrap">
            Inspección
          </Badge>
        );
      case 'AMONESTACION':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-medium whitespace-nowrap">
            Amonestación
          </Badge>
        );
      case 'AUDITORIA':
        return (
          <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 font-medium whitespace-nowrap">
            Auditoría
          </Badge>
        );
      case 'CAPACITACION':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-medium whitespace-nowrap">
            Capacitación
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="capitalize whitespace-nowrap">
            {tipo.replace(/_/g, ' ')}
          </Badge>
        );
    }
  };

  // Métricas operativas (KPIs) en tiempo real
  const kpis = useMemo(() => {
    const total = activities.length;
    const inspecciones = activities.filter((a) => a.tipo_actividad === 'INSPECCION').length;
    const amonestaciones = activities.filter((a) => a.tipo_actividad === 'AMONESTACION').length;
    const pendientes = activities.filter((a) => a.estado_reporte === 'pendiente').length;
    const exportadas = activities.filter((a) => a.estado_reporte === 'exportada' || a.estado_reporte === 'publicada').length;
    return { total, inspecciones, amonestaciones, pendientes, exportadas };
  }, [activities]);

  // Filtrado reactivo en cliente por búsqueda y tipo
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Filtro por tipo
      if (selectedTypeFilter === 'INSPECCION' && act.tipo_actividad !== 'INSPECCION') return false;
      if (selectedTypeFilter === 'AMONESTACION' && act.tipo_actividad !== 'AMONESTACION') return false;
      if (selectedTypeFilter === 'OTROS' && (act.tipo_actividad === 'INSPECCION' || act.tipo_actividad === 'AMONESTACION')) return false;

      // Filtro por texto de búsqueda
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const matchCod = act.codigo_referencia?.toLowerCase().includes(term);
      const matchUbi = act.ubicacion?.toLowerCase().includes(term);
      const matchResp = act.responsable_nombre?.toLowerCase().includes(term);
      const matchDesc = act.descripcion?.toLowerCase().includes(term);

      return Boolean(matchCod || matchUbi || matchResp || matchDesc);
    });
  }, [activities, searchTerm, selectedTypeFilter]);

  // Paginación limpia
  const totalPages = Math.ceil(filteredActivities.length / pageSize) || 1;
  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActivities.slice(start, start + pageSize);
  }, [filteredActivities, currentPage, pageSize]);

  // Resetear página si el filtro cambia
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTypeFilter]);

  return (
    <div className="space-y-6">
      {/* ── NIVEL 1: ENCABEZADO LIMPIO Y ACCIONES PRINCIPALES (Flex Col / Row) ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Bloque Izquierdo */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground whitespace-nowrap">
              Gestor de Actividades e Inspecciones
            </h1>
            <Badge variant="secondary" className="font-mono text-xs whitespace-nowrap shrink-0">
              {activities.length} registradas
            </Badge>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap shrink-0">
              <CloudCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Nube Conectada</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Administra órdenes de trabajo operativas, asocia evidencias fotográficas forenses y genera fichas de inspección inmutables.
          </p>
        </div>

        {/* Bloque Derecho: Botones de Acción sin Desborde */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsSmartModalOpen(true)}
            className="w-full sm:w-auto justify-center gap-2 cursor-pointer border-amber-500/40 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold whitespace-nowrap shrink-0"
            title="Generar informe pre-llenado desde captura WhatsApp o lote de fotos"
          >
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse shrink-0" />
            <span>Generar Informe desde Captura WhatsApp / Fotos</span>
          </Button>

          <Button
            type="button"
            onClick={handleOpenCreate}
            className="w-full sm:w-auto justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 shadow-sm font-medium"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Nueva Actividad</span>
          </Button>
        </div>
      </div>

      {/* ── TARJETAS KPI SUPERIORES: RESUMEN OPERATIVO CON CARD DE SHADCN/UI ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Total Actividades */}
        <Card className="border-border shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-medium text-muted-foreground">Total Actividades</span>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">{kpis.total}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Órdenes operativas registradas</p>
          </CardContent>
        </Card>

        {/* KPI 2: Inspecciones HSE F-120 */}
        <Card className="border-border shadow-xs hover:border-blue-500/40 transition-colors">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-medium text-muted-foreground">Inspecciones HSE</span>
            <ClipboardCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{kpis.inspecciones}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Formato HSE-EL-F-120</p>
          </CardContent>
        </Card>

        {/* KPI 3: Amonestaciones F-128 */}
        <Card className="border-border shadow-xs hover:border-amber-500/40 transition-colors">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-medium text-muted-foreground">Amonestaciones</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">{kpis.amonestaciones}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Formato HSE-EL-F-128</p>
          </CardContent>
        </Card>

        {/* KPI 4: Pendientes vs Exportadas */}
        <Card className="border-border shadow-xs hover:border-emerald-500/40 transition-colors">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-medium text-muted-foreground">Borrador / Emitidas</span>
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              <span className="text-muted-foreground">{kpis.pendientes}</span>
              <span className="text-muted-foreground/40 font-normal mx-1">/</span>
              <span className="text-emerald-600 dark:text-emerald-400">{kpis.exportadas}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">En progreso vs Exportadas</p>
          </CardContent>
        </Card>
      </div>

      {/* ── NIVEL 2: TOOLBAR DE BÚSQUEDA, FILTROS Y SELECTOR DE VISTA ── */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Campo de búsqueda con Input shadcn e ícono Search */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Buscar por código, ubicación o responsable..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-background"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filtros rápidos por Tipo (Badges interactivos) + Toggle Vista */}
            <div className="flex items-center justify-between md:justify-end gap-2 flex-wrap">
              <div className="inline-flex rounded-lg border bg-muted/30 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedTypeFilter('TODAS')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    selectedTypeFilter === 'TODAS'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Todas ({activities.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTypeFilter('INSPECCION')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    selectedTypeFilter === 'INSPECCION'
                      ? 'bg-background text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Inspección F-120 ({kpis.inspecciones})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTypeFilter('AMONESTACION')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    selectedTypeFilter === 'AMONESTACION'
                      ? 'bg-background text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Amonestación F-128 ({kpis.amonestaciones})
                </button>
              </div>

              {/* Toggle de vistas: Tabla / Tarjetas */}
              <div className="inline-flex rounded-lg border bg-muted/40 p-1 shrink-0">
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── CONTENIDO PRINCIPAL: LOADING, ERROR, EMPTY O LISTA ── */}
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
      ) : filteredActivities.length === 0 ? (
        <Card className="p-12 text-center border-2 border-dashed border-border bg-muted/20">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {searchTerm || selectedTypeFilter !== 'TODAS'
              ? 'No se encontraron actividades coincidentes'
              : 'No hay actividades creadas'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            {searchTerm || selectedTypeFilter !== 'TODAS'
              ? 'Intenta ajustar los criterios de búsqueda o limpiar los filtros seleccionados.'
              : 'Crea la primera orden de inspección para comenzar a vincular evidencias.'}
          </p>
          {searchTerm || selectedTypeFilter !== 'TODAS' ? (
            <Button
              onClick={() => {
                setSearchTerm('');
                setSelectedTypeFilter('TODAS');
              }}
              size="sm"
              variant="outline"
              className="gap-1.5 cursor-pointer"
            >
              Restablecer Filtros
            </Button>
          ) : (
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Crear Actividad Inicial
            </Button>
          )}
        </Card>
      ) : (
        <>
          {/* ── VISTA DESKTOP: TABLA SHADCN/UI (hidden md:block si viewMode es table) ── */}
          {viewMode === 'table' && (
            <div className="hidden md:block">
              <Card className="border-border overflow-hidden">
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="w-[170px] font-semibold whitespace-nowrap">Código Ref.</TableHead>
                        <TableHead className="w-[140px] font-semibold whitespace-nowrap">Tipo de Actividad</TableHead>
                        <TableHead className="font-semibold">Ubicación</TableHead>
                        <TableHead className="w-[120px] font-semibold whitespace-nowrap">Fecha</TableHead>
                        <TableHead className="font-semibold">Responsable</TableHead>
                        <TableHead className="w-[110px] font-semibold whitespace-nowrap">Estado</TableHead>
                        <TableHead className="w-[130px] text-right font-semibold whitespace-nowrap">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedActivities.map((act) => {
                        const formattedDate = act.fecha_operacion
                          ? new Date(act.fecha_operacion).toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Sin fecha';

                        return (
                          <TableRow key={act.id} className="hover:bg-muted/30 transition-colors">
                            {/* Código de Referencia */}
                            <TableCell className="font-mono font-semibold text-xs text-primary whitespace-nowrap">
                              {act.codigo_referencia}
                            </TableCell>

                            {/* Tipo de Actividad Semántico */}
                            <TableCell className="whitespace-nowrap">
                              {getTipoBadge(act.tipo_actividad)}
                            </TableCell>

                            {/* Ubicación Expandida con Tooltip Nativo */}
                            <TableCell className="text-xs text-muted-foreground">
                              <div
                                className="flex items-center gap-1.5 max-w-[260px] xl:max-w-[340px]"
                                title={act.ubicacion || 'Sin ubicación registrada'}
                              >
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                                <span className="truncate font-normal text-foreground/80">
                                  {act.ubicacion || '—'}
                                </span>
                              </div>
                            </TableCell>

                            {/* Fecha */}
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                                <span>{formattedDate}</span>
                              </div>
                            </TableCell>

                            {/* Responsable Expandido con Tooltip Nativo */}
                            <TableCell className="text-xs text-foreground font-medium">
                              <div
                                className="flex items-center gap-1.5 max-w-[200px] xl:max-w-[280px]"
                                title={act.responsable_nombre || 'Sin responsable asignado'}
                              >
                                <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                                <span className="truncate">
                                  {act.responsable_nombre || '—'}
                                </span>
                              </div>
                            </TableCell>

                            {/* Estado de Reporte */}
                            <TableCell className="whitespace-nowrap">
                              {getStatusBadge(act.estado_reporte)}
                            </TableCell>

                            {/* Acciones */}
                            <TableCell className="text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEdit(act)}
                                  className="h-8 px-2 text-xs cursor-pointer text-muted-foreground hover:text-foreground"
                                  title="Editar actividad"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onSelectActivity && onSelectActivity(act)}
                                  className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer font-medium hover:border-primary/50"
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
            </div>
          )}

          {/* ── VISTA MÓVIL / CUADRÍCULA: TARJETAS RESPONSIVAS SHADCN/UI ── */}
          {/* Se muestra en mobile siempre cuando viewMode === 'table', o en cualquier pantalla si viewMode === 'cards' */}
          <div className={viewMode === 'table' ? 'block md:hidden' : 'block'}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedActivities.map((act) => {
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
                    <CardHeader className="p-4 pb-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          {act.codigo_referencia}
                        </span>
                        {getStatusBadge(act.estado_reporte)}
                      </div>
                      <div className="flex items-center gap-2">
                        {getTipoBadge(act.tipo_actividad)}
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 space-y-2.5 text-xs text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                        <span className="font-medium text-foreground line-clamp-2">
                          {act.ubicacion || 'Sin ubicación registrada'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>{formattedDate}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-foreground">
                          Resp: <b>{act.responsable_nombre || 'No asignado'}</b>
                        </span>
                      </div>

                      {act.descripcion && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2 italic bg-muted/30 p-2.5 rounded-md border border-border/50">
                          "{act.descripcion}"
                        </p>
                      )}
                    </CardContent>

                    <CardFooter className="p-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(act)}
                        className="h-9 px-3 text-xs cursor-pointer text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                        Editar
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectActivity && onSelectActivity(act)}
                        className="h-9 px-3 text-xs gap-1.5 cursor-pointer font-medium hover:border-primary/50"
                      >
                        <span>Ver Detalle</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* ── BARRA DE PAGINACIÓN LIMPIA ── */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-muted-foreground">
                Mostrando <b className="text-foreground">{paginatedActivities.length}</b> de{' '}
                <b className="text-foreground">{filteredActivities.length}</b> actividades
                {searchTerm && ` (filtradas de un total de ${activities.length})`}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2.5 text-xs gap-1 cursor-pointer disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Anterior</span>
                </Button>

                <div className="text-xs font-medium px-2 text-muted-foreground">
                  Página <span className="text-foreground font-semibold">{currentPage}</span> de{' '}
                  <span className="text-foreground font-semibold">{totalPages}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2.5 text-xs gap-1 cursor-pointer disabled:opacity-40"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
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
