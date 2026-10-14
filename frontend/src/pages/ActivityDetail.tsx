import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { DataNodeOrb } from '../components/voice/DataNodeOrb';
import {
  PA_PERU_INFO,
  CATALOGO_F120,
  crearDemoF120LlerenaRios,
  MOTIVOS_AMONESTACION,
  NIVELES_RIESGO,
  SANCIONES_RISST,
  type FormatoInspeccionF120,
  type FormatoAmonestacionF128,
  type CalificacionHSE,
  type ItemEvaluado,
  type PersonalInvolucrado,
  type MotivoAmonestacion,
  type NivelRiesgoAmonestacion,
  type SancionAmonestacion,
} from '../types/hseFormats';
import {
  ArrowLeft,
  Save,
  Sparkles,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  FileText,
  Plus,
  Trash2,
  Mic,
  Camera,
  ShieldCheck,
  FileCheck,
  CloudCheck,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

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
  const [, setErrorLinked] = useState<string | null>(null);

  // Estados del selector / modal de vinculación
  const [isLinkModalOpen, setIsLinkModalOpen] = useState<boolean>(false);
  const [pendingEvidences, setPendingEvidences] = useState<EvidenciaRow[]>([]);
  const [loadingPending, setLoadingPending] = useState<boolean>(false);
  const [linkingEvidenceId, setLinkingEvidenceId] = useState<string | null>(null);
  const [linkNotas, setLinkNotas] = useState<string>('');

  // Notificación y guardado
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Identificar el tipo de formato
  const isAmonestacion = currentActivity.tipo_actividad === 'AMONESTACION';

  // ═════════════════════════════════════════════════════════════════════════
  // ESTADO FORMATO F-120 (INSPECCIÓN HSE)
  // ═════════════════════════════════════════════════════════════════════════
  const [f120Data, setF120Data] = useState<FormatoInspeccionF120>(() => {
    const raw = currentActivity.datos_formato_json as any;
    if (raw && raw.tipo_formato === 'CHECKLIST_F120') {
      return raw as FormatoInspeccionF120;
    }

    // Inicializar con todos los ítems del catálogo como 'S'
    const defaultItems: ItemEvaluado[] = [];
    for (const sec of CATALOGO_F120) {
      for (const item of sec.items) {
        defaultItems.push({ codigo: item.codigo, calificacion: 'S' });
      }
    }

    return {
      tipo_formato: 'CHECKLIST_F120',
      codigo_documento: 'HSE-EL-F-120',
      version: '02',
      cabecera: {
        razon_social: PA_PERU_INFO.razon_social,
        ruc: PA_PERU_INFO.ruc,
        domicilio: PA_PERU_INFO.domicilio,
        tipo_actividad_economica: PA_PERU_INFO.tipo_actividad_economica,
        proyecto: currentActivity.ubicacion,
        actividad: currentActivity.descripcion || currentActivity.tipo_actividad,
        lugar: currentActivity.ubicacion,
        supervisor_encargado: currentActivity.responsable_nombre,
        responsable_area: '',
        fecha_inspeccion: currentActivity.fecha_operacion,
        hora_inspeccion: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      },
      items_evaluados: defaultItems,
      se_corrigieron_hallazgos: true,
      hallazgos_y_levantamiento: [],
      modalidad_inspeccion: 'CON_ACOMPANAMIENTO',
      personal_involucrado: [],
      retroalimentacion_charla: {
        tema: 'Procedimiento de Trabajo Seguro y Control Operativo',
        hora_desde: '08:00',
        hora_hasta: '08:15',
        num_participantes: 1,
        nombre_expositor: currentActivity.responsable_nombre,
        participantes: [],
      },
      inspector_encargado: {
        nombre: currentActivity.responsable_nombre,
        cargo: 'Inspector HSE / SST',
      },
    };
  });

  // ═════════════════════════════════════════════════════════════════════════
  // ESTADO FORMATO F-128 (AMONESTACIÓN HSE)
  // ═════════════════════════════════════════════════════════════════════════
  const [f128Data, setF128Data] = useState<FormatoAmonestacionF128>(() => {
    const raw = currentActivity.datos_formato_json as any;
    if (raw && (raw.tipo_formato === 'HSE_EL_F_128' || raw.amonestado)) {
      return {
        tipo_formato: 'HSE_EL_F_128',
        codigo_documento: 'HSE-EL-F-128',
        version: '01',
        amonestado: raw.amonestado || raw.datos_amonestado || {
          apellidos_nombres: '',
          dni: '',
          cargo: '',
          ubicacion: currentActivity.ubicacion,
          empresa: PA_PERU_INFO.razon_social,
          fecha: currentActivity.fecha_operacion,
          hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        },
        responsables: raw.responsables || raw.supervisores_responsables || {
          capataz_jefe_cuadrilla: '',
          ing_responsable: '',
          actividad_trabajo: currentActivity.descripcion || '',
        },
        relato_razon: raw.relato_razon || currentActivity.descripcion || '',
        motivo_codigo: raw.motivo_codigo || '02_ACTO_SUBESTANDAR',
        detalle_motivo: raw.detalle_motivo || '',
        nivel_riesgo: raw.nivel_riesgo || '02_BAJO',
        otro_riesgo: raw.otro_riesgo || '',
        accion_inmediata: raw.accion_inmediata || raw.accion_inmediata_hechos || '',
        sancion_codigo: raw.sancion_codigo || raw.sancion_aplicada_risst || '01_LLAMADA_ATENCION',
        dias_suspension: raw.dias_suspension,
        otra_sancion: raw.otra_sancion || '',
        validacion: raw.validacion || {
          realizado_por: { nombre: currentActivity.responsable_nombre, cargo: 'Inspector HSE' },
          aprobado_por: { nombre: 'Ing. Residente / Jefe HSE', cargo: 'Aprobación Técnica' },
          aceptado_por: { nombre: '', cargo: 'Trabajador Amonestado' },
        },
      };
    }

    return {
      tipo_formato: 'HSE_EL_F_128',
      codigo_documento: 'HSE-EL-F-128',
      version: '01',
      amonestado: {
        apellidos_nombres: '',
        dni: '',
        cargo: '',
        ubicacion: currentActivity.ubicacion,
        empresa: PA_PERU_INFO.razon_social,
        fecha: currentActivity.fecha_operacion,
        hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      },
      responsables: {
        capataz_jefe_cuadrilla: '',
        ing_responsable: '',
        actividad_trabajo: currentActivity.descripcion || '',
      },
      relato_razon: currentActivity.descripcion || '',
      motivo_codigo: '02_ACTO_SUBESTANDAR',
      detalle_motivo: '',
      nivel_riesgo: '02_BAJO',
      otro_riesgo: '',
      accion_inmediata: '',
      sancion_codigo: '01_LLAMADA_ATENCION',
      validacion: {
        realizado_por: { nombre: currentActivity.responsable_nombre, cargo: 'Inspector HSE' },
        aprobado_por: { nombre: 'Ing. Residente / Jefe HSE', cargo: 'Supervisión HSE' },
        aceptado_por: { nombre: '', cargo: 'Trabajador Notificado' },
      },
    };
  });

  // ═════════════════════════════════════════════════════════════════════════
  // RECONOCIMIENTO POR VOZ INTEGRADO (ASISTENTE ORBE)
  // ═════════════════════════════════════════════════════════════════════════
  const [activeVoiceTarget, setActiveVoiceTarget] = useState<string | null>(null);

  const {
    orbState,
    isListening,
    startSession,
    stopSession,
  } = useVoiceAssistant({
    lang: 'es-PE',
    continuous: false,
    onTranscriptionComplete: (text) => {
      if (!activeVoiceTarget) return;

      if (activeVoiceTarget.startsWith('hallazgo_desc_')) {
        const idx = parseInt(activeVoiceTarget.replace('hallazgo_desc_', ''), 10);
        setF120Data((prev) => {
          const list = [...prev.hallazgos_y_levantamiento];
          if (list[idx]) {
            list[idx] = { ...list[idx], descripcion_hallazgo: (list[idx].descripcion_hallazgo ? `${list[idx].descripcion_hallazgo} ${text}` : text).trim() };
          }
          return { ...prev, hallazgos_y_levantamiento: list };
        });
      } else if (activeVoiceTarget.startsWith('hallazgo_accion_')) {
        const idx = parseInt(activeVoiceTarget.replace('hallazgo_accion_', ''), 10);
        setF120Data((prev) => {
          const list = [...prev.hallazgos_y_levantamiento];
          if (list[idx]) {
            list[idx] = { ...list[idx], accion_levantamiento: (list[idx].accion_levantamiento ? `${list[idx].accion_levantamiento} ${text}` : text).trim() };
          }
          return { ...prev, hallazgos_y_levantamiento: list };
        });
      } else if (activeVoiceTarget === 'f128_relato') {
        setF128Data((prev) => ({
          ...prev,
          relato_razon: (prev.relato_razon ? `${prev.relato_razon} ${text}` : text).trim(),
        }));
      } else if (activeVoiceTarget === 'f128_detalle_motivo') {
        setF128Data((prev) => ({
          ...prev,
          detalle_motivo: (prev.detalle_motivo ? `${prev.detalle_motivo} ${text}` : text).trim(),
        }));
      } else if (activeVoiceTarget === 'f128_accion_inmediata') {
        setF128Data((prev) => ({
          ...prev,
          accion_inmediata: (prev.accion_inmediata ? `${prev.accion_inmediata} ${text}` : text).trim(),
        }));
      }

      setActiveVoiceTarget(null);
    },
  });

  const toggleVoiceForField = (targetKey: string) => {
    if (activeVoiceTarget === targetKey && isListening) {
      stopSession();
      setActiveVoiceTarget(null);
    } else {
      setActiveVoiceTarget(targetKey);
      startSession();
    }
  };

  // Cargar evidencias vinculadas a la actividad
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

  // Cargar evidencias pendientes para el selector modal
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

  // Vinculación atómica
  const handleVincularEvidencia = async (evidencia: EvidenciaRow) => {
    setLinkingEvidenceId(evidencia.id);
    const prevLinked = [...linkedItems];
    const prevPending = [...pendingEvidences];

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
      await activityService.vincularEvidencia(
        evidencia.id,
        currentActivity.id,
        linkNotas.trim() || undefined
      );

      setNotification({
        message: `Evidencia "${evidencia.nombre_archivo}" vinculada correctamente.`,
        type: 'success',
      });
      setTimeout(() => setNotification(null), 3500);
      fetchLinkedEvidences();
    } catch (err: unknown) {
      console.error('[ActivityDetail] Error al vincular evidencia:', err);
      setLinkedItems(prevLinked);
      setPendingEvidences(prevPending);
      setNotification({
        message: 'No se pudo vincular la evidencia. Revisa la conexión.',
        type: 'error',
      });
    } finally {
      setLinkingEvidenceId(null);
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // ACCIONES ESPECÍFICAS DE FORMATOS
  // ═════════════════════════════════════════════════════════════════════════

  // Botón: Cargar Caso Real Demo (Llerena Ríos 05/10/2026)
  const handleCargarDemoLlerenaRios = () => {
    const demo = crearDemoF120LlerenaRios();
    setF120Data(demo);
    setNotification({
      message: '¡Caso Real de Inspección HSE (Llerena Ríos 05/10/2026) cargado con éxito!',
      type: 'success',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Botón: Importar Operario desde Fotocheck OCR para F120
  const handleImportarOperarioOcrF120 = () => {
    const ocrMatches: PersonalInvolucrado[] = [];

    for (const item of linkedItems) {
      if (item.identificacion) {
        const iden = item.identificacion;
        const nombreCompleto = [iden.nombres, iden.apellido_paterno, iden.apellido_materno]
          .filter(Boolean)
          .join(' ')
          .trim();

        if (nombreCompleto) {
          ocrMatches.push({
            nombre_completo: nombreCompleto,
            cargo: iden.cargo || 'Operario de Campo',
            evidencia_fotocheck_id: item.evidencia.id,
          });
        }
      }
    }

    if (ocrMatches.length === 0) {
      setNotification({
        message: 'No se detectaron datos OCR en las evidencias vinculadas. Asegúrate de vincular una foto de fotocheck procesada por el motor OCR.',
        type: 'info',
      });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    setF120Data((prev) => ({
      ...prev,
      personal_involucrado: [...prev.personal_involucrado, ...ocrMatches],
    }));

    setNotification({
      message: `Se importaron ${ocrMatches.length} operario(s) desde el OCR de fotochecks.`,
      type: 'success',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Botón: Importar Operario desde Fotocheck OCR para F128
  const handleImportarOperarioOcrF128 = () => {
    const match = linkedItems.find((item) => item.identificacion?.nombres);
    if (!match || !match.identificacion) {
      setNotification({
        message: 'No se encontró fotocheck con OCR en las evidencias vinculadas para autocompletar el amonestado.',
        type: 'info',
      });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    const iden = match.identificacion;
    const nombreCompleto = [iden.nombres, iden.apellido_paterno, iden.apellido_materno]
      .filter(Boolean)
      .join(' ')
      .trim();

    setF128Data((prev) => {
      const dniExtraido = (iden as any).dni_numero || iden.texto_crudo_ocr?.match(/\b\d{8}\b/)?.[0] || prev.amonestado.dni;
      const empresaExtraida = (iden as any).empresa_contratista || prev.amonestado.empresa;

      return {
        ...prev,
        amonestado: {
          ...prev.amonestado,
          apellidos_nombres: nombreCompleto,
          dni: dniExtraido,
          cargo: iden.cargo || prev.amonestado.cargo,
          empresa: empresaExtraida,
        },
        validacion: {
          ...prev.validacion,
          aceptado_por: {
            nombre: nombreCompleto,
            cargo: iden.cargo || 'Trabajador Amonestado',
          },
        },
      };
    });

    setNotification({
      message: `Datos del trabajador "${nombreCompleto}" completados desde el fotocheck OCR.`,
      type: 'success',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Marcar sección completa como 'S' (Seguro)
  const handleMarcarSeccionSeguro = (seccionItems: Array<{ codigo: string }>) => {
    const codigosSeccion = new Set(seccionItems.map((it) => it.codigo));
    setF120Data((prev) => {
      const itemsMap = new Map(prev.items_evaluados.map((it) => [it.codigo, it]));
      for (const cod of codigosSeccion) {
        itemsMap.set(cod, { codigo: cod, calificacion: 'S' });
      }
      return {
        ...prev,
        items_evaluados: Array.from(itemsMap.values()),
      };
    });
  };

  // Calificar un ítem individual
  const handleSetItemCalificacion = (codigo: string, calificacion: CalificacionHSE) => {
    setF120Data((prev) => {
      const itemsMap = new Map(prev.items_evaluados.map((it) => [it.codigo, it]));
      const existing = itemsMap.get(codigo);
      itemsMap.set(codigo, {
        codigo,
        calificacion,
        observacion: existing?.observacion,
      });

      // Si se marca como ER o PI y no existe hallazgo previo, sugerir levantamiento
      let hallazgos = [...prev.hallazgos_y_levantamiento];
      if ((calificacion === 'ER' || calificacion === 'PI') && !hallazgos.some((h) => h.item_ref === codigo)) {
        hallazgos.push({
          item_ref: codigo,
          descripcion_hallazgo: '',
          accion_levantamiento: '',
          no_requiere_foto_correccion: false,
        });
      }

      return {
        ...prev,
        items_evaluados: Array.from(itemsMap.values()),
        hallazgos_y_levantamiento: hallazgos,
      };
    });
  };

  // Guardar Cambios en Supabase (Formato HSE + Datos Generales de la Actividad)
  const handleGuardarCambios = async () => {
    setIsSaving(true);
    try {
      const datosJson = isAmonestacion ? f128Data : f120Data;

      // Sincronizar datos generales relevantes de la cabecera del formulario
      const camposGenerales: Partial<Pick<ActividadRow, 'ubicacion' | 'responsable_nombre' | 'descripcion' | 'fecha_operacion'>> = {};

      if (!isAmonestacion && f120Data.cabecera) {
        if (f120Data.cabecera.lugar?.trim()) {
          camposGenerales.ubicacion = f120Data.cabecera.lugar.trim();
        }
        if (f120Data.cabecera.supervisor_encargado?.trim()) {
          camposGenerales.responsable_nombre = f120Data.cabecera.supervisor_encargado.trim();
        }
        if (f120Data.cabecera.fecha_inspeccion) {
          camposGenerales.fecha_operacion = f120Data.cabecera.fecha_inspeccion;
        }
        if (f120Data.cabecera.actividad?.trim()) {
          camposGenerales.descripcion = f120Data.cabecera.actividad.trim();
        }
      } else if (isAmonestacion && f128Data.amonestado) {
        if (f128Data.amonestado.ubicacion?.trim()) {
          camposGenerales.ubicacion = f128Data.amonestado.ubicacion.trim();
        }
        if (f128Data.relato_razon?.trim()) {
          camposGenerales.descripcion = f128Data.relato_razon.trim();
        } else if (f128Data.detalle_motivo?.trim()) {
          camposGenerales.descripcion = f128Data.detalle_motivo.trim();
        }
      }

      const updated = await activityService.saveHseFormatData(
        currentActivity.id,
        datosJson as any,
        camposGenerales,
        currentActivity.estado_reporte
      );

      setCurrentActivity(updated);
      if (onActivityUpdated) onActivityUpdated(updated);

      toast.success('Formato HSE guardado exitosamente', {
        description: `La actividad ${updated.codigo_referencia} está sincronizada en Supabase Cloud.`,
      });

      setNotification({
        message: '¡Datos del formato corporativo guardados exitosamente en la nube!',
        type: 'success',
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      console.error('[ActivityDetail] Error guardando formato:', err);
      const detailError = err?.message || 'Error al guardar los datos en Supabase.';
      
      toast.error('Error al guardar en Supabase', {
        description: detailError,
      });

      setNotification({
        message: `Error al guardar en Supabase: ${detailError}`,
        type: 'error',
      });
    } finally {
      setIsSaving(false);
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

  // Mapa de ítems evaluados para búsqueda rápida
  const itemsEvaluadosMap = useMemo(() => {
    const map = new Map<string, ItemEvaluado>();
    for (const it of f120Data.items_evaluados) {
      map.set(it.codigo, it);
    }
    return map;
  }, [f120Data.items_evaluados]);

  // Conteo de estadísticas de checklist
  const statsChecklist = useMemo(() => {
    let s = 0;
    let er = 0;
    let pi = 0;
    let na = 0;
    for (const it of f120Data.items_evaluados) {
      if (it.calificacion === 'S') s++;
      else if (it.calificacion === 'ER') er++;
      else if (it.calificacion === 'PI') pi++;
      else if (it.calificacion === 'NA') na++;
    }
    return { s, er, pi, na, total: f120Data.items_evaluados.length };
  }, [f120Data.items_evaluados]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── BARRA SUPERIOR DE NAVEGACIÓN Y ACCIONES ───────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onBack}
            className="cursor-pointer shrink-0 rounded-xl"
            title="Volver a la lista de actividades"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {currentActivity.codigo_referencia}
              </span>
              <Badge variant="outline" className="text-[10px] font-bold uppercase">
                {isAmonestacion ? 'HSE-EL-F-128 (Amonestación)' : 'HSE-EL-F-120 (Inspección)'}
              </Badge>
              <Badge variant={currentActivity.estado_reporte === 'exportada' ? 'secondary' : 'default'} className="text-[10px] uppercase">
                {currentActivity.estado_reporte}
              </Badge>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CloudCheck className="w-3.5 h-3.5" />
                <span>Nube Conectada</span>
              </span>
            </div>
            <h1 className="text-lg font-bold text-foreground mt-1">
              {currentActivity.tipo_actividad.replace(/_/g, ' ')} &bull; {currentActivity.ubicacion}
            </h1>
            <p className="text-xs text-muted-foreground">
              Responsable: {currentActivity.responsable_nombre} &bull; Fecha: {currentActivity.fecha_operacion}
            </p>
          </div>
        </div>

        {/* Acciones principales de cabecera */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isAmonestacion && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCargarDemoLlerenaRios}
              className="cursor-pointer gap-1.5 text-xs font-semibold border-amber-500/40 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400"
              title="Cargar automáticamente el caso real de Víctor Alfonso Llerena Ríos (05/10/2026)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Cargar Caso Real (Llerena Ríos)</span>
            </Button>
          )}

          <Button
            type="button"
            onClick={handleGuardarCambios}
            disabled={isSaving}
            className="cursor-pointer gap-2 text-xs font-semibold h-9 shadow-xs"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Guardando en la nube...' : 'Guardar Formato HSE'}</span>
          </Button>
        </div>
      </div>

      {/* ── BANNER DE NOTIFICACIÓN ────────────────────────────────────────── */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 shadow-xs transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : notification.type === 'error'
              ? 'bg-destructive/10 border-destructive/30 text-destructive'
              : 'bg-primary/10 border-primary/20 text-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertOctagon className="w-4 h-4 text-destructive shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* ── CONTENIDO PRINCIPAL SEGÚN FORMATO ─────────────────────────────── */}
      {!isAmonestacion ? (
        /* ═══════════════════════════════════════════════════════════════════
           EDITOR TABBED FORMATO HSE-EL-F-120 (INSPECCIÓN DE CAMPO)
           ═══════════════════════════════════════════════════════════════════ */
        <Tabs defaultValue="datos" className="w-full space-y-4">
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full h-auto p-1 bg-muted/60">
            <TabsTrigger value="datos" className="text-xs py-2">
              1. Datos & Personal
            </TabsTrigger>
            <TabsTrigger value="checklist" className="text-xs py-2 flex items-center gap-1.5">
              <span>2. Checklist (15 Sec)</span>
              {statsChecklist.er + statsChecklist.pi > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </TabsTrigger>
            <TabsTrigger value="levantamiento" className="text-xs py-2">
              3. Levantamiento & Charla
            </TabsTrigger>
            <TabsTrigger value="evidencias" className="text-xs py-2">
              4. Evidencias ({linkedItems.length})
            </TabsTrigger>
            <TabsTrigger value="pdf" className="text-xs py-2 font-bold text-primary">
              5. Reporte PDF A4
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DATOS GENERALES Y PERSONAL INVOLUCRADO */}
          <TabsContent value="datos" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-tight flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>Cabecera Corporativa P.A. Perú (HSE-EL-F-120 v02)</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Datos legales y de ubicación de la inspección técnica de seguridad en campo.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Razón Social</label>
                  <Input value={f120Data.cabecera.razon_social} disabled className="h-8 bg-muted text-xs" />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">RUC</label>
                  <Input value={f120Data.cabecera.ruc} disabled className="h-8 bg-muted text-xs font-mono" />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Actividad Económica</label>
                  <Input value={f120Data.cabecera.tipo_actividad_economica} disabled className="h-8 bg-muted text-xs" />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Proyecto / Sede</label>
                  <Input
                    value={f120Data.cabecera.proyecto}
                    onChange={(e) => setF120Data({ ...f120Data, cabecera: { ...f120Data.cabecera, proyecto: e.target.value } })}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Lugar Exacto / Frente</label>
                  <Input
                    value={f120Data.cabecera.lugar}
                    onChange={(e) => setF120Data({ ...f120Data, cabecera: { ...f120Data.cabecera, lugar: e.target.value } })}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Actividad Inspeccionada</label>
                  <Input
                    value={f120Data.cabecera.actividad}
                    onChange={(e) => setF120Data({ ...f120Data, cabecera: { ...f120Data.cabecera, actividad: e.target.value } })}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Supervisor Encargado</label>
                  <Input
                    value={f120Data.cabecera.supervisor_encargado}
                    onChange={(e) => setF120Data({ ...f120Data, cabecera: { ...f120Data.cabecera, supervisor_encargado: e.target.value } })}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Responsable del Área</label>
                  <Input
                    value={f120Data.cabecera.responsable_area}
                    onChange={(e) => setF120Data({ ...f120Data, cabecera: { ...f120Data.cabecera, responsable_area: e.target.value } })}
                    className="h-8 text-xs"
                    placeholder="Ej. Ing. Juan Pérez"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Fecha</label>
                    <Input
                      type="date"
                      value={f120Data.cabecera.fecha_inspeccion}
                      onChange={(e) => setF120Data({ ...f120Data, cabecera: { ...f120Data.cabecera, fecha_inspeccion: e.target.value } })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Hora</label>
                    <Input
                      type="time"
                      value={f120Data.cabecera.hora_inspeccion}
                      onChange={(e) => setF120Data({ ...f120Data, cabecera: { ...f120Data.cabecera, hora_inspeccion: e.target.value } })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECCIÓN PERSONAL INVOLUCRADO */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-tight flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Personal Involucrado en la Inspección</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Operarios y trabajadores evaluados en el área o cuadrilla de trabajo.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleImportarOperarioOcrF120}
                  className="cursor-pointer gap-1.5 text-xs border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Importar Operario desde Fotocheck OCR</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {f120Data.personal_involucrado.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                    No se ha registrado personal involucrado. Haz clic en "Importar Operario desde Fotocheck OCR" o agrega uno manualmente.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {f120Data.personal_involucrado.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Input
                            placeholder="Nombre completo del trabajador"
                            value={p.nombre_completo}
                            onChange={(e) => {
                              const list = [...f120Data.personal_involucrado];
                              list[idx].nombre_completo = e.target.value;
                              setF120Data({ ...f120Data, personal_involucrado: list });
                            }}
                            className="h-8 text-xs"
                          />
                          <Input
                            placeholder="Cargo / Especialidad (ej. Operario de Corte)"
                            value={p.cargo}
                            onChange={(e) => {
                              const list = [...f120Data.personal_involucrado];
                              list[idx].cargo = e.target.value;
                              setF120Data({ ...f120Data, personal_involucrado: list });
                            }}
                            className="h-8 text-xs"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const list = f120Data.personal_involucrado.filter((_, i) => i !== idx);
                            setF120Data({ ...f120Data, personal_involucrado: list });
                          }}
                          className="text-destructive hover:bg-destructive/10 h-8 w-8 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setF120Data({
                      ...f120Data,
                      personal_involucrado: [
                        ...f120Data.personal_involucrado,
                        { nombre_completo: '', cargo: '' },
                      ],
                    });
                  }}
                  className="cursor-pointer gap-1.5 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Trabajador Manualmente</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: CHECKLIST DE 15 SECCIONES */}
          <TabsContent value="checklist" className="space-y-4">
            <Card>
              <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span>Catálogo Oficial de las 15 Secciones Normativas</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Califica cada ítem con Seguro (S), En Riesgo (ER), Peligro Inminente (PI) o No Aplica (NA).
                  </CardDescription>
                </div>

                {/* Resumen de calificaciones */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    S: {statsChecklist.s}
                  </Badge>
                  <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                    ER: {statsChecklist.er}
                  </Badge>
                  <Badge variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400">
                    PI: {statsChecklist.pi}
                  </Badge>
                  <Badge variant="outline" className="border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-400">
                    NA: {statsChecklist.na}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Accordion className="w-full space-y-2">
                  {CATALOGO_F120.map((seccion) => {
                    const seccionItemsEvaluados = seccion.items.map((it) => itemsEvaluadosMap.get(it.codigo));
                    const tieneRiesgo = seccionItemsEvaluados.some(
                      (it) => it?.calificacion === 'ER' || it?.calificacion === 'PI'
                    );

                    return (
                      <AccordionItem
                        key={seccion.id}
                        value={`sec-${seccion.id}`}
                        className="border border-border rounded-xl px-4 overflow-hidden bg-card"
                      >
                        <div className="flex items-center justify-between py-1">
                          <AccordionTrigger className="hover:no-underline py-2.5 flex-1 pr-3">
                            <div className="flex items-center gap-2.5 text-left">
                              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-muted">
                                Sec {seccion.id}
                              </span>
                              <span className="text-xs font-semibold text-foreground">
                                {seccion.nombre}
                              </span>
                              {tieneRiesgo && (
                                <Badge variant="destructive" className="text-[9px] py-0 px-1.5 h-4">
                                  Observado
                                </Badge>
                              )}
                            </div>
                          </AccordionTrigger>

                          {/* Botón rápido: Marcar sección como Seguro (S) */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarcarSeccionSeguro(seccion.items);
                            }}
                            className="text-[11px] h-7 px-2.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer shrink-0 font-medium"
                            title="Marcar todos los ítems de esta sección como Seguro"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            <span>Marcar todo Seguro (S)</span>
                          </Button>
                        </div>

                        <AccordionContent className="pt-2 pb-4 space-y-2.5 border-t border-border/50">
                          {seccion.items.map((item) => {
                            const evaluado = itemsEvaluadosMap.get(item.codigo);
                            const calificacion = evaluado?.calificacion || 'S';

                            return (
                              <div
                                key={item.codigo}
                                className={`p-2.5 rounded-lg border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                  calificacion === 'ER'
                                    ? 'bg-amber-500/5 border-amber-500/30'
                                    : calificacion === 'PI'
                                    ? 'bg-rose-500/5 border-rose-500/30'
                                    : 'bg-card border-border/60 hover:border-border'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <span className="font-mono font-bold text-[11px] text-muted-foreground w-8 shrink-0">
                                    {item.codigo}
                                  </span>
                                  <span className="text-xs text-foreground leading-snug">
                                    {item.descripcion}
                                  </span>
                                </div>

                                {/* Segmented control S / ER / PI / NA */}
                                <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                                  {(['S', 'ER', 'PI', 'NA'] as CalificacionHSE[]).map((val) => {
                                    const isSelected = calificacion === val;
                                    let btnClass = 'text-[11px] font-bold h-7 px-2.5 rounded-md cursor-pointer transition-all ';
                                    if (isSelected) {
                                      if (val === 'S') btnClass += 'bg-emerald-600 text-white shadow-xs';
                                      else if (val === 'ER') btnClass += 'bg-amber-600 text-white shadow-xs';
                                      else if (val === 'PI') btnClass += 'bg-destructive text-destructive-foreground shadow-xs';
                                      else btnClass += 'bg-slate-600 text-white shadow-xs';
                                    } else {
                                      btnClass += 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground';
                                    }

                                    return (
                                      <button
                                        key={val}
                                        type="button"
                                        onClick={() => handleSetItemCalificacion(item.codigo, val)}
                                        className={btnClass}
                                      >
                                        {val}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: LEVANTAMIENTO / CORRECCIÓN Y CHARLA */}
          <TabsContent value="levantamiento" className="space-y-4">
            {/* Modalidad y Checkbox de corrección */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-tight">
                  Levantamiento y Modalidad de Inspección (Pág. 3)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-xl border border-border bg-muted/20">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={f120Data.se_corrigieron_hallazgos}
                      onChange={(e) => setF120Data({ ...f120Data, se_corrigieron_hallazgos: e.target.checked })}
                      className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="font-semibold text-foreground">
                      ¿Se corrigieron los hallazgos durante la inspección en campo?
                    </span>
                  </label>

                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground font-medium">Modalidad:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="modalidad_insp"
                        checked={f120Data.modalidad_inspeccion === 'CON_ACOMPANAMIENTO'}
                        onChange={() => setF120Data({ ...f120Data, modalidad_inspeccion: 'CON_ACOMPANAMIENTO' })}
                        className="text-primary cursor-pointer"
                      />
                      <span>Con Acompañamiento</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="modalidad_insp"
                        checked={f120Data.modalidad_inspeccion === 'SIN_ACOMPANAMIENTO'}
                        onChange={() => setF120Data({ ...f120Data, modalidad_inspeccion: 'SIN_ACOMPANAMIENTO' })}
                        className="text-primary cursor-pointer"
                      />
                      <span>Sin Acompañamiento</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formulario de Hallazgos y Acciones para Levantamiento */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-tight flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" />
                    <span>Hallazgos, Acciones de Levantamiento y Registro Fotográfico</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Asigna el ítem observado, describe el hallazgo y vincula fotos del antes (hallazgo) y después (corrección).
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setF120Data({
                      ...f120Data,
                      hallazgos_y_levantamiento: [
                        ...f120Data.hallazgos_y_levantamiento,
                        {
                          item_ref: '9.3',
                          descripcion_hallazgo: '',
                          accion_levantamiento: '',
                          no_requiere_foto_correccion: false,
                        },
                      ],
                    });
                  }}
                  className="cursor-pointer gap-1.5 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Hallazgo</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {f120Data.hallazgos_y_levantamiento.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                    No se han registrado hallazgos que requieran levantamiento. Si calificas un ítem como "ER" o "PI", aparecerá aquí automáticamente.
                  </div>
                ) : (
                  f120Data.hallazgos_y_levantamiento.map((h, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-border bg-card space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">Hallazgo #{idx + 1} &bull; Ítem:</span>
                          <Input
                            value={h.item_ref}
                            onChange={(e) => {
                              const list = [...f120Data.hallazgos_y_levantamiento];
                              list[idx].item_ref = e.target.value;
                              setF120Data({ ...f120Data, hallazgos_y_levantamiento: list });
                            }}
                            className="h-7 w-20 text-xs font-mono font-bold"
                            placeholder="ej. 9.3"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const list = f120Data.hallazgos_y_levantamiento.filter((_, i) => i !== idx);
                            setF120Data({ ...f120Data, hallazgos_y_levantamiento: list });
                          }}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Descripción del Hallazgo con Asistente de Voz */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-semibold text-muted-foreground text-[11px]">
                            Descripción del Hallazgo (Resultado de la Inspección):
                          </label>
                          <button
                            type="button"
                            onClick={() => toggleVoiceForField(`hallazgo_desc_${idx}`)}
                            className="flex items-center gap-1 text-[10px] text-primary hover:underline cursor-pointer"
                          >
                            <Mic className="w-3 h-3" />
                            <span>{activeVoiceTarget === `hallazgo_desc_${idx}` && isListening ? 'Escuchando...' : 'Dictar por voz'}</span>
                          </button>
                        </div>
                        <div className="relative">
                          <textarea
                            rows={2}
                            value={h.descripcion_hallazgo}
                            onChange={(e) => {
                              const list = [...f120Data.hallazgos_y_levantamiento];
                              list[idx].descripcion_hallazgo = e.target.value;
                              setF120Data({ ...f120Data, hallazgos_y_levantamiento: list });
                            }}
                            className="w-full text-xs p-2.5 rounded-lg border border-input bg-background text-foreground focus:ring-1 focus:ring-ring"
                            placeholder="Detalle de la condición o acto subestándar observado en campo..."
                          />
                          {activeVoiceTarget === `hallazgo_desc_${idx}` && (
                            <div className="absolute right-2 bottom-2">
                              <DataNodeOrb state={orbState} size="sm" onClick={() => toggleVoiceForField(`hallazgo_desc_${idx}`)} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Acción para Levantamiento con Asistente de Voz */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-semibold text-muted-foreground text-[11px]">
                            Acciones para el Levantamiento de la Observación (Medida Correctiva):
                          </label>
                          <button
                            type="button"
                            onClick={() => toggleVoiceForField(`hallazgo_accion_${idx}`)}
                            className="flex items-center gap-1 text-[10px] text-primary hover:underline cursor-pointer"
                          >
                            <Mic className="w-3 h-3" />
                            <span>{activeVoiceTarget === `hallazgo_accion_${idx}` && isListening ? 'Escuchando...' : 'Dictar por voz'}</span>
                          </button>
                        </div>
                        <div className="relative">
                          <textarea
                            rows={2}
                            value={h.accion_levantamiento}
                            onChange={(e) => {
                              const list = [...f120Data.hallazgos_y_levantamiento];
                              list[idx].accion_levantamiento = e.target.value;
                              setF120Data({ ...f120Data, hallazgos_y_levantamiento: list });
                            }}
                            className="w-full text-xs p-2.5 rounded-lg border border-input bg-background text-foreground focus:ring-1 focus:ring-ring"
                            placeholder="Acción correctiva inmediata o compromiso para subsanar la observación..."
                          />
                          {activeVoiceTarget === `hallazgo_accion_${idx}` && (
                            <div className="absolute right-2 bottom-2">
                              <DataNodeOrb state={orbState} size="sm" onClick={() => toggleVoiceForField(`hallazgo_accion_${idx}`)} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Asignación de Fotos: Hallazgo vs Corrección */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50 text-xs">
                        <div>
                          <label className="font-semibold text-muted-foreground block text-[11px] mb-1">
                            Foto del Hallazgo (Columna 2):
                          </label>
                          <select
                            value={h.evidencia_hallazgo_id || ''}
                            onChange={(e) => {
                              const list = [...f120Data.hallazgos_y_levantamiento];
                              list[idx].evidencia_hallazgo_id = e.target.value || undefined;
                              setF120Data({ ...f120Data, hallazgos_y_levantamiento: list });
                            }}
                            className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                          >
                            <option value="">-- Seleccionar Evidencia Fotográfica --</option>
                            {linkedItems.map((item) => (
                              <option key={item.evidencia.id} value={item.evidencia.id}>
                                {item.evidencia.nombre_archivo} ({item.evidencia.hash_sha256.slice(0, 10)}...)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-semibold text-muted-foreground text-[11px]">
                              Foto de la Medida Correctiva (Columna 4):
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer text-[10px] text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={h.no_requiere_foto_correccion}
                                onChange={(e) => {
                                  const list = [...f120Data.hallazgos_y_levantamiento];
                                  list[idx].no_requiere_foto_correccion = e.target.checked;
                                  if (e.target.checked) {
                                    list[idx].evidencia_correccion_id = undefined;
                                  }
                                  setF120Data({ ...f120Data, hallazgos_y_levantamiento: list });
                                }}
                                className="w-3.5 h-3.5 rounded text-primary cursor-pointer"
                              />
                              <span>No requiere foto adicional</span>
                            </label>
                          </div>

                          {!h.no_requiere_foto_correccion ? (
                            <select
                              value={h.evidencia_correccion_id || ''}
                              onChange={(e) => {
                                const list = [...f120Data.hallazgos_y_levantamiento];
                                list[idx].evidencia_correccion_id = e.target.value || undefined;
                                setF120Data({ ...f120Data, hallazgos_y_levantamiento: list });
                              }}
                              className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
                            >
                              <option value="">-- Seleccionar Evidencia de Corrección --</option>
                              {linkedItems.map((item) => (
                                <option key={item.evidencia.id} value={item.evidencia.id}>
                                  {item.evidencia.nombre_archivo} ({item.evidencia.hash_sha256.slice(0, 10)}...)
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="h-8 px-2.5 rounded-md bg-muted text-muted-foreground flex items-center text-[11px] italic">
                              Marcado como "No requiere registro fotográfico adicional"
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Charla de Retroalimentación en Campo (5 minutos) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-tight flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-primary" />
                  <span>Charla de Retroalimentación en Campo (5 Minutos)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Tema Tratado</label>
                  <Input
                    value={f120Data.retroalimentacion_charla.tema}
                    onChange={(e) => setF120Data({
                      ...f120Data,
                      retroalimentacion_charla: { ...f120Data.retroalimentacion_charla, tema: e.target.value },
                    })}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Hora Inicio</label>
                  <Input
                    type="time"
                    value={f120Data.retroalimentacion_charla.hora_desde}
                    onChange={(e) => setF120Data({
                      ...f120Data,
                      retroalimentacion_charla: { ...f120Data.retroalimentacion_charla, hora_desde: e.target.value },
                    })}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Hora Término</label>
                  <Input
                    type="time"
                    value={f120Data.retroalimentacion_charla.hora_hasta}
                    onChange={(e) => setF120Data({
                      ...f120Data,
                      retroalimentacion_charla: { ...f120Data.retroalimentacion_charla, hora_hasta: e.target.value },
                    })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Expositor / Facilitador</label>
                  <Input
                    value={f120Data.retroalimentacion_charla.nombre_expositor}
                    onChange={(e) => setF120Data({
                      ...f120Data,
                      retroalimentacion_charla: { ...f120Data.retroalimentacion_charla, nombre_expositor: e.target.value },
                    })}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">N° de Participantes</label>
                  <Input
                    type="number"
                    value={f120Data.retroalimentacion_charla.num_participantes}
                    onChange={(e) => setF120Data({
                      ...f120Data,
                      retroalimentacion_charla: { ...f120Data.retroalimentacion_charla, num_participantes: parseInt(e.target.value, 10) || 0 },
                    })}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Inspector Encargado</label>
                  <Input
                    value={f120Data.inspector_encargado.nombre}
                    onChange={(e) => setF120Data({
                      ...f120Data,
                      inspector_encargado: { ...f120Data.inspector_encargado, nombre: e.target.value },
                    })}
                    className="h-8 text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: EVIDENCIAS VINCULADAS */}
          <TabsContent value="evidencias" className="space-y-4">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-tight">
                    Evidencias Fotográficas Vinculadas ({linkedItems.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Archivos fotográficos con hash SHA-256 inmutable y lecturas OCR asociadas.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={handleOpenLinkModal}
                  className="cursor-pointer gap-2 text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span>Vincular Evidencia</span>
                </Button>
              </CardHeader>
              <CardContent>
                {loadingLinked ? (
                  <div className="py-12 text-center text-muted-foreground text-xs">
                    Cargando evidencias vinculadas...
                  </div>
                ) : linkedItems.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                    No hay evidencias fotográficas vinculadas a esta inspección.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {linkedItems.map(({ evidencia, identificacion }) => (
                      <div key={evidencia.id} className="p-3 rounded-xl border border-border bg-card space-y-2">
                        <div className="font-semibold text-xs truncate" title={evidencia.nombre_archivo}>
                          {evidencia.nombre_archivo}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground truncate" title={evidencia.hash_sha256}>
                          SHA: {evidencia.hash_sha256.slice(0, 18)}...
                        </div>
                        {identificacion ? (
                          <div className="text-[11px] p-2 rounded bg-muted text-foreground">
                            <div className="font-bold">
                              {identificacion.nombres} {identificacion.apellido_paterno}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {identificacion.cargo || 'Operario'} &bull; DNI: {(identificacion as any).dni_numero || identificacion.texto_crudo_ocr?.match(/\b\d{8}\b/)?.[0] || '-'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground italic">
                            Sin lectura OCR de fotocheck
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: PREVISUALIZAR Y EXPORTAR PDF */}
          <TabsContent value="pdf" className="space-y-4">
            <PdfExporter
              actividad={currentActivity}
              evidenciasVinculadas={linkedItems}
              bucketName={bucketName}
              inspectorName={f120Data.inspector_encargado.nombre}
              inspectorCargo={f120Data.inspector_encargado.cargo}
              onAfterPrint={handleAfterPrint}
            />
          </TabsContent>
        </Tabs>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════
           EDITOR TABBED FORMATO HSE-EL-F-128 (REGISTRO DE AMONESTACIÓN)
           ═══════════════════════════════════════════════════════════════════ */
        <Tabs defaultValue="f128" className="w-full space-y-4">
          <TabsList className="grid grid-cols-3 w-full h-auto p-1 bg-muted/60">
            <TabsTrigger value="f128" className="text-xs py-2 font-bold">
              1. Formato HSE-EL-F-128 (5 Bloques)
            </TabsTrigger>
            <TabsTrigger value="evidencias" className="text-xs py-2">
              2. Evidencias ({linkedItems.length})
            </TabsTrigger>
            <TabsTrigger value="pdf" className="text-xs py-2 font-bold text-destructive">
              3. Reporte PDF A4
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: FORMULARIO HSE-EL-F-128 */}
          <TabsContent value="f128" className="space-y-4">
            {/* BLOQUE 1: DATOS DEL TRABAJADOR AMONESTADO */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-tight flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <span>1. Datos del Trabajador Amonestado y Supervisores</span>
                  </CardTitle>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleImportarOperarioOcrF128}
                  className="cursor-pointer gap-1.5 text-xs border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Importar Datos desde Fotocheck OCR</span>
                </Button>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Apellidos y Nombres</label>
                  <Input
                    value={f128Data.amonestado.apellidos_nombres}
                    onChange={(e) => setF128Data({
                      ...f128Data,
                      amonestado: { ...f128Data.amonestado, apellidos_nombres: e.target.value },
                      validacion: {
                        ...f128Data.validacion,
                        aceptado_por: { ...f128Data.validacion.aceptado_por, nombre: e.target.value },
                      },
                    })}
                    className="h-8 text-xs font-semibold"
                    placeholder="Ej. LLERENA RÍOS VÍCTOR ALFONSO"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">DNI / Documento</label>
                  <Input
                    value={f128Data.amonestado.dni}
                    onChange={(e) => setF128Data({
                      ...f128Data,
                      amonestado: { ...f128Data.amonestado, dni: e.target.value },
                    })}
                    className="h-8 text-xs font-mono"
                    placeholder="Ej. 70823419"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Cargo / Ocupación</label>
                  <Input
                    value={f128Data.amonestado.cargo}
                    onChange={(e) => setF128Data({
                      ...f128Data,
                      amonestado: { ...f128Data.amonestado, cargo: e.target.value },
                    })}
                    className="h-8 text-xs"
                    placeholder="Ej. Operario de Corte y Reconexión"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Empresa Contratista</label>
                  <Input
                    value={f128Data.amonestado.empresa}
                    onChange={(e) => setF128Data({
                      ...f128Data,
                      amonestado: { ...f128Data.amonestado, empresa: e.target.value },
                    })}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Ubicación / Frente</label>
                  <Input
                    value={f128Data.amonestado.ubicacion}
                    onChange={(e) => setF128Data({
                      ...f128Data,
                      amonestado: { ...f128Data.amonestado, ubicacion: e.target.value },
                    })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Fecha</label>
                    <Input
                      type="date"
                      value={f128Data.amonestado.fecha}
                      onChange={(e) => setF128Data({
                        ...f128Data,
                        amonestado: { ...f128Data.amonestado, fecha: e.target.value },
                      })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Hora</label>
                    <Input
                      type="time"
                      value={f128Data.amonestado.hora}
                      onChange={(e) => setF128Data({
                        ...f128Data,
                        amonestado: { ...f128Data.amonestado, hora: e.target.value },
                      })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Capataz / Jefe Cuadrilla</label>
                  <Input
                    value={f128Data.responsables.capataz_jefe_cuadrilla}
                    onChange={(e) => setF128Data({
                      ...f128Data,
                      responsables: { ...f128Data.responsables, capataz_jefe_cuadrilla: e.target.value },
                    })}
                    className="h-8 text-xs"
                    placeholder="Nombre del capataz"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Ing. Responsable</label>
                  <Input
                    value={f128Data.responsables.ing_responsable}
                    onChange={(e) => setF128Data({
                      ...f128Data,
                      responsables: { ...f128Data.responsables, ing_responsable: e.target.value },
                    })}
                    className="h-8 text-xs"
                    placeholder="Nombre del residente"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Actividad en Ejecución</label>
                  <Input
                    value={f128Data.responsables.actividad_trabajo}
                    onChange={(e) => setF128Data({
                      ...f128Data,
                      responsables: { ...f128Data.responsables, actividad_trabajo: e.target.value },
                    })}
                    className="h-8 text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            {/* BLOQUE 2: RELATO BREVE DE LA RAZÓN DE LA AMONESTACIÓN */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold uppercase tracking-tight">
                    2. Relato Breve de la Razón de la Amonestación (Hechos)
                  </CardTitle>
                  <button
                    type="button"
                    onClick={() => toggleVoiceForField('f128_relato')}
                    className="flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{activeVoiceTarget === 'f128_relato' && isListening ? 'Escuchando...' : 'Dictar por voz'}</span>
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={f128Data.relato_razon}
                    onChange={(e) => setF128Data({ ...f128Data, relato_razon: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-input bg-background text-foreground"
                    placeholder="Descripción detallada de la falta observada en campo..."
                  />
                  {activeVoiceTarget === 'f128_relato' && (
                    <div className="absolute right-2 bottom-2">
                      <DataNodeOrb state={orbState} size="sm" onClick={() => toggleVoiceForField('f128_relato')} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* BLOQUE 3: MOTIVO DE AMONESTACIÓN */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-tight">
                  3. Motivo de la Amonestación (Marcar con X)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {(Object.keys(MOTIVOS_AMONESTACION) as MotivoAmonestacion[]).map((cod) => (
                    <label
                      key={cod}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between gap-2 transition-all ${
                        f128Data.motivo_codigo === cod
                          ? 'border-destructive bg-destructive/10 font-bold text-foreground'
                          : 'border-border bg-card text-muted-foreground hover:border-foreground/40'
                      }`}
                    >
                      <span>{MOTIVOS_AMONESTACION[cod]}</span>
                      <input
                        type="radio"
                        name="f128_motivo"
                        checked={f128Data.motivo_codigo === cod}
                        onChange={() => setF128Data({ ...f128Data, motivo_codigo: cod })}
                        className="text-destructive cursor-pointer"
                      />
                    </label>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-muted-foreground text-[11px]">
                      Detalle del Motivo / Cláusula infringida del RIIST:
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleVoiceForField('f128_detalle_motivo')}
                      className="flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>{activeVoiceTarget === 'f128_detalle_motivo' && isListening ? 'Escuchando...' : 'Dictar por voz'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      value={f128Data.detalle_motivo}
                      onChange={(e) => setF128Data({ ...f128Data, detalle_motivo: e.target.value })}
                      className="h-8 text-xs"
                      placeholder="Ej. Art. 45 Inciso B: Uso obligatorio de careta facial en maniobras"
                    />
                    {activeVoiceTarget === 'f128_detalle_motivo' && (
                      <div className="absolute right-1 top-1">
                        <DataNodeOrb state={orbState} size="sm" onClick={() => toggleVoiceForField('f128_detalle_motivo')} />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* BLOQUE 4: NIVEL DE RIESGO Y ACCIÓN INMEDIATA */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-tight">
                  4. Nivel de Riesgo y Acción Inmediata de los Hechos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(NIVELES_RIESGO) as NivelRiesgoAmonestacion[]).map((r) => (
                    <label
                      key={r}
                      className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between gap-2 ${
                        f128Data.nivel_riesgo === r
                          ? 'border-primary bg-primary/10 font-bold text-foreground'
                          : 'border-border bg-card text-muted-foreground hover:border-foreground/40'
                      }`}
                    >
                      <span>{NIVELES_RIESGO[r]}</span>
                      <input
                        type="radio"
                        name="f128_riesgo"
                        checked={f128Data.nivel_riesgo === r}
                        onChange={() => setF128Data({ ...f128Data, nivel_riesgo: r })}
                        className="text-primary cursor-pointer"
                      />
                    </label>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-muted-foreground text-[11px]">
                      Acción Inmediata de los Hechos (Medida Correctiva en el Sitio):
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleVoiceForField('f128_accion_inmediata')}
                      className="flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>{activeVoiceTarget === 'f128_accion_inmediata' && isListening ? 'Escuchando...' : 'Dictar por voz'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={f128Data.accion_inmediata}
                      onChange={(e) => setF128Data({ ...f128Data, accion_inmediata: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-input bg-background text-foreground"
                      placeholder="Medidas adoptadas en el sitio de la infracción..."
                    />
                    {activeVoiceTarget === 'f128_accion_inmediata' && (
                      <div className="absolute right-2 bottom-2">
                        <DataNodeOrb state={orbState} size="sm" onClick={() => toggleVoiceForField('f128_accion_inmediata')} />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* BLOQUE 5: SANCIÓN APLICADA SEGÚN RISST */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-tight">
                  5. Sanción Aplicada según RISST
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {(Object.keys(SANCIONES_RISST) as SancionAmonestacion[]).map((s) => (
                    <label
                      key={s}
                      className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between gap-2 ${
                        f128Data.sancion_codigo === s
                          ? 'border-destructive bg-destructive/10 font-bold text-foreground'
                          : 'border-border bg-card text-muted-foreground hover:border-foreground/40'
                      }`}
                    >
                      <span>{SANCIONES_RISST[s]}</span>
                      <input
                        type="radio"
                        name="f128_sancion"
                        checked={f128Data.sancion_codigo === s}
                        onChange={() => setF128Data({ ...f128Data, sancion_codigo: s })}
                        className="text-destructive cursor-pointer"
                      />
                    </label>
                  ))}
                </div>

                {f128Data.sancion_codigo === '02_SUSPENSION' && (
                  <div className="w-48">
                    <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Días de Suspensión:</label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={f128Data.dias_suspension || 1}
                      onChange={(e) => setF128Data({ ...f128Data, dias_suspension: parseInt(e.target.value, 10) || 1 })}
                      className="h-8 text-xs"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: EVIDENCIAS VINCULADAS */}
          <TabsContent value="evidencias" className="space-y-4">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-tight">
                    Evidencias Fotográficas Vinculadas ({linkedItems.length})
                  </CardTitle>
                </div>
                <Button
                  type="button"
                  onClick={handleOpenLinkModal}
                  className="cursor-pointer gap-2 text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span>Vincular Evidencia</span>
                </Button>
              </CardHeader>
              <CardContent>
                {linkedItems.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                    No hay evidencias vinculadas a esta amonestación.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {linkedItems.map(({ evidencia, identificacion }) => (
                      <div key={evidencia.id} className="p-3 rounded-xl border border-border bg-card space-y-2">
                        <div className="font-semibold text-xs truncate">{evidencia.nombre_archivo}</div>
                        <div className="text-[10px] font-mono text-muted-foreground truncate">
                          SHA: {evidencia.hash_sha256.slice(0, 18)}...
                        </div>
                        {identificacion && (
                          <div className="text-[11px] p-2 rounded bg-muted text-foreground">
                            <div className="font-bold">{identificacion.nombres} {identificacion.apellido_paterno}</div>
                            <div className="text-[10px] text-muted-foreground">DNI: {(identificacion as any).dni_numero || identificacion.texto_crudo_ocr?.match(/\b\d{8}\b/)?.[0] || '-'}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: PREVISUALIZAR Y EXPORTAR PDF */}
          <TabsContent value="pdf" className="space-y-4">
            <PdfExporter
              actividad={currentActivity}
              evidenciasVinculadas={linkedItems}
              bucketName={bucketName}
              inspectorName={f128Data.validacion.realizado_por.nombre}
              inspectorCargo={f128Data.validacion.realizado_por.cargo}
              onAfterPrint={handleAfterPrint}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* ── MODAL DE VINCULACIÓN DE EVIDENCIAS PENDIENTES ─────────────────── */}
      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title="Vincular Evidencia Fotográfica a esta Actividad"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-foreground mb-1">
              Notas u observaciones de vinculación (opcional):
            </label>
            <Input
              value={linkNotas}
              onChange={(e) => setLinkNotas(e.target.value)}
              placeholder="Ej. Evidencia fotográfica de hallazgo o fotocheck OCR del operario"
              className="text-xs"
            />
          </div>

          <div className="border-t border-border pt-3">
            <h4 className="font-semibold text-foreground mb-2">
              Evidencias en Bandeja con Estado 'Pendiente':
            </h4>

            {loadingPending ? (
              <div className="p-8 text-center text-muted-foreground">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p>Buscando evidencias pendientes...</p>
              </div>
            ) : pendingEvidences.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-xl text-muted-foreground">
                No hay evidencias pendientes disponibles para vincular. Sube nuevas evidencias en la Bandeja de Entrada.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {pendingEvidences.map((ev) => {
                  const isLinkingThis = linkingEvidenceId === ev.id;
                  return (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl border border-border bg-card flex items-center justify-between gap-3 hover:border-primary/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">{ev.nombre_archivo}</p>
                        <p className="text-[10px] font-mono text-muted-foreground truncate">
                          SHA: {ev.hash_sha256}
                        </p>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleVincularEvidencia(ev)}
                        disabled={isLinkingThis}
                        className="cursor-pointer gap-1 text-xs shrink-0"
                      >
                        {isLinkingThis ? (
                          <span>Vinculando...</span>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Vincular</span>
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsLinkModalOpen(false)}
              className="cursor-pointer text-xs"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ActivityDetail;
