import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  UploadCloud,
  Library,
  User,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileCheck2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { runOcrOnCrop } from '../../utils/ocrClient';
import {
  classifyImageByOcr,
  parseWhatsAppReportText,
  type ParsedWhatsAppReport,
  type TipoImagenClasificada,
} from '../../utils/whatsappReportParser';
import { evidenceService, type EvidenciaRow } from '../../services/EvidenceService';
import { activityService, type ActividadRow } from '../../services/ActivityService';
import {
  PA_PERU_INFO,
  CATALOGO_F120,
  MOTIVOS_AMONESTACION,
  NIVELES_RIESGO,
  SANCIONES_RISST,
  type FormatoInspeccionF120,
  type FormatoAmonestacionF128,
  type ItemEvaluado,
  type MotivoAmonestacion,
  type NivelRiesgoAmonestacion,
  type SancionAmonestacion,
} from '../../types/hseFormats';

export interface SmartReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivityCreated?: (activity: ActividadRow) => void;
}

interface ImageProcessingItem {
  id: string;
  source: 'upload' | 'library';
  file?: File;
  evidence?: EvidenciaRow;
  previewUrl: string;
  name: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
  ocrText?: string;
  classification?: {
    tipo: TipoImagenClasificada;
    confianza: number;
    razon: string;
  };
}

export const SmartReportGeneratorModal: React.FC<SmartReportGeneratorModalProps> = ({
  isOpen,
  onClose,
  onActivityCreated,
}) => {
  // Pasos: 1 = Selección / Subida, 2 = Procesamiento OCR, 3 = Human-in-the-Loop Pre-llenado
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Imágenes seleccionadas para procesar
  const [selectedItems, setSelectedItems] = useState<ImageProcessingItem[]>([]);
  
  // Biblioteca disponible para seleccionar
  const [libraryEvidences, setLibraryEvidences] = useState<EvidenciaRow[]>([]);
  const [libraryUrlMap, setLibraryUrlMap] = useState<Record<string, string>>({});
  const [loadingLibrary, setLoadingLibrary] = useState<boolean>(false);
  const [searchLibrary, setSearchLibrary] = useState<string>('');

  // Filtrado reactivo de la biblioteca de evidencias
  const filteredLibrary = useMemo(() => {
    const q = searchLibrary.toLowerCase().trim();
    if (!q) return libraryEvidences;
    return libraryEvidences.filter((e) =>
      e.nombre_archivo.toLowerCase().includes(q) ||
      (e.metadatos_json as any)?.ocr_extracted_data?.texto_crudo?.toLowerCase().includes(q)
    );
  }, [libraryEvidences, searchLibrary]);

  // Estado del OCR en lote
  const [, setIsProcessingOcr] = useState<boolean>(false);
  const [globalProgress, setGlobalProgress] = useState<number>(0);

  // Formato propuesto tras el parseo (Human-in-the-Loop)
  const [selectedFormatType, setSelectedFormatType] = useState<'INSPECCION' | 'AMONESTACION'>('INSPECCION');
  const [parsedData, setParsedData] = useState<ParsedWhatsAppReport | null>(null);

  // Estado para la confirmación y guardado
  const [isCreatingActivity, setIsCreatingActivity] = useState<boolean>(false);

  // Cargar biblioteca cuando se abre el modal
  const fetchLibrary = useCallback(async () => {
    setLoadingLibrary(true);
    try {
      const data = await evidenceService.getAllEvidencesWithIdentifications();
      const evidences = data.map((d) => d.evidencia);
      setLibraryEvidences(evidences);

      const urlMap = await evidenceService.getEvidenceBatchImageUrls(evidences, {
        type: 'thumb',
        expiresIn: 3600,
      });
      setLibraryUrlMap(urlMap);
    } catch (err) {
      console.error('[SmartReportGeneratorModal] Error cargando biblioteca:', err);
    } finally {
      setLoadingLibrary(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedItems([]);
      setParsedData(null);
      fetchLibrary();
    }
  }, [isOpen, fetchLibrary]);

  // Manejador de selección de archivos desde explorador local
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems: ImageProcessingItem[] = files.map((file) => ({
      id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      source: 'upload',
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      status: 'pending',
      progress: 0,
    }));

    setSelectedItems((prev) => [...prev, ...newItems]);
    e.target.value = '';
  };

  // Alternar selección de evidencia de biblioteca existente
  const toggleSelectLibraryEvidence = (evidence: EvidenciaRow) => {
    setSelectedItems((prev) => {
      const exists = prev.some((it) => it.evidence?.id === evidence.id);
      if (exists) {
        return prev.filter((it) => it.evidence?.id !== evidence.id);
      }
      return [
        ...prev,
        {
          id: `lib-${evidence.id}`,
          source: 'library',
          evidence,
          previewUrl: libraryUrlMap[evidence.id] || '',
          name: evidence.nombre_archivo,
          status: 'pending',
          progress: 0,
          ocrText: (evidence.metadatos_json as any)?.ocr_extracted_data?.texto_crudo || '',
        },
      ];
    });
  };

  // Quitar elemento de la lista de procesamiento
  const removeSelectedItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((it) => it.id !== id));
  };

  // PASO 2: Procesamiento OCR en Web Workers y Clasificación Heurística
  const handleStartProcessing = async () => {
    if (selectedItems.length === 0) {
      toast.error('Selecciona al menos una imagen (WhatsApp, fotocheck o campo)');
      return;
    }

    setStep(2);
    setIsProcessingOcr(true);
    setGlobalProgress(10);

    const updatedItems = [...selectedItems];
    let combinedOcrText = '';
    const total = updatedItems.length;

    for (let i = 0; i < total; i++) {
      const item = updatedItems[i];
      item.status = 'processing';
      setSelectedItems([...updatedItems]);

      try {
        let extractedRawText = item.ocrText || '';

        // Si la imagen ya tiene ocr previo guardado en metadatos_json
        const cachedOcr = (item.evidence?.metadatos_json as any)?.ocr_extracted_data?.texto_crudo;
        if (cachedOcr) {
          extractedRawText = cachedOcr;
          item.progress = 100;
        } else {
          // Ejecutar OCR en cliente usando el web worker de tesseract.js
          const imageSource = item.file || item.previewUrl;
          const ocrResult = await runOcrOnCrop(imageSource, (p) => {
            item.progress = Math.round(p * 100);
            setSelectedItems([...updatedItems]);
          });
          extractedRawText = ocrResult.texto_crudo_ocr || '';
        }

        item.ocrText = extractedRawText;
        combinedOcrText += `\n--- [ARCHIVO: ${item.name}] ---\n${extractedRawText}\n`;

        // Clasificar imagen
        const classification = classifyImageByOcr(extractedRawText, item.name);
        item.classification = classification;
        item.status = 'done';
        item.progress = 100;

        // Si la imagen era un archivo nuevo, podemos subirla y registrar su ocr_extracted_data
        if (item.source === 'upload' && item.file && !item.evidence) {
          try {
            const uploadRes = await evidenceService.uploadAndRegisterEvidence(item.file);
            item.evidence = uploadRes.evidence;
            // Guardar OCR extraído en metadatos_json
            await evidenceService.update(uploadRes.evidence.id, {
              metadatos_json: {
                ...(uploadRes.evidence.metadatos_json as any || {}),
                ocr_extracted_data: {
                  texto_crudo: extractedRawText,
                  tipo_clasificado: classification.tipo,
                  fecha_analisis: new Date().toISOString(),
                },
              },
            });
          } catch (uploadErr) {
            console.warn('[SmartReportGeneratorModal] Error subiendo evidencia:', uploadErr);
          }
        } else if (item.source === 'library' && item.evidence) {
          // Si era de biblioteca pero no tenía ocr previo, actualizar metadatos_json
          if (!cachedOcr && extractedRawText) {
            await evidenceService.update(item.evidence.id, {
              metadatos_json: {
                ...(item.evidence.metadatos_json as any || {}),
                ocr_extracted_data: {
                  texto_crudo: extractedRawText,
                  tipo_clasificado: classification.tipo,
                  fecha_analisis: new Date().toISOString(),
                },
              },
            });
          }
        }
      } catch (ocrErr) {
        console.error(`[SmartReportGeneratorModal] Error en OCR de ${item.name}:`, ocrErr);
        item.status = 'error';
      }

      setGlobalProgress(Math.round(((i + 1) / total) * 100));
      setSelectedItems([...updatedItems]);
    }

    // Parseo heurístico de todo el texto combinado
    const parsed = parseWhatsAppReportText(combinedOcrText);
    setParsedData(parsed);
    setSelectedFormatType(parsed.tipoReporteSugerido);

    setIsProcessingOcr(false);
    setStep(3); // Pasar a vista previa Human-in-the-Loop
    toast.success('Análisis completado', {
      description: `Se detectaron patrones para formato ${parsed.tipoReporteSugerido === 'AMONESTACION' ? 'HSE-EL-F-128' : 'HSE-EL-F-120'}.`,
    });
  };

  // PASO 3: Confirmar y Guardar Actividad en Supabase
  const handleConfirmAndGenerate = async () => {
    if (!parsedData) return;

    setIsCreatingActivity(true);
    try {
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const codigoRef = selectedFormatType === 'AMONESTACION'
        ? `AMON-${year}-${randomSuffix}`
        : `INSP-${year}-${randomSuffix}`;

      let formatJson: any = {};

      if (selectedFormatType === 'INSPECCION') {
        // Inicializar 15 secciones con 'S' y poner 'ER' en el ítem detectado
        const defaultItems: ItemEvaluado[] = [];
        for (const sec of CATALOGO_F120) {
          for (const item of sec.items) {
            const isDetectedIssue = item.codigo === parsedData.hallazgo.itemReferencia;
            defaultItems.push({
              codigo: item.codigo,
              calificacion: isDetectedIssue ? 'ER' : 'S',
              observacion: isDetectedIssue ? parsedData.hallazgo.descripcion : undefined,
            });
          }
        }

        // Buscar foto con rol hallazgo
        const hallazgoItem = selectedItems.find(
          (it) => it.classification?.tipo === 'evidencia_campo' || it.classification?.tipo === 'general'
        );

        const f120Payload: FormatoInspeccionF120 = {
          tipo_formato: 'CHECKLIST_F120',
          codigo_documento: 'HSE-EL-F-120',
          version: '02',
          cabecera: {
            razon_social: PA_PERU_INFO.razon_social,
            ruc: PA_PERU_INFO.ruc,
            domicilio: PA_PERU_INFO.domicilio,
            tipo_actividad_economica: PA_PERU_INFO.tipo_actividad_economica,
            proyecto: parsedData.proyecto,
            actividad: parsedData.actividad,
            lugar: parsedData.ubicacion,
            supervisor_encargado: parsedData.supervisor,
            responsable_area: 'Ing. Residente de Obra',
            fecha_inspeccion: parsedData.fecha,
            hora_inspeccion: parsedData.hora,
          },
          items_evaluados: defaultItems,
          se_corrigieron_hallazgos: parsedData.hallazgo.seCorrigioEnCampo,
          hallazgos_y_levantamiento: [
            {
              item_ref: parsedData.hallazgo.itemReferencia,
              descripcion_hallazgo: parsedData.hallazgo.descripcion,
              accion_levantamiento: parsedData.hallazgo.accionLevantamiento,
              evidencia_hallazgo_id: hallazgoItem?.evidence?.id,
              no_requiere_foto_correccion: true,
            },
          ],
          modalidad_inspeccion: 'CON_ACOMPANAMIENTO',
          personal_involucrado: [
            {
              nombre_completo: parsedData.trabajador.nombreCompleto,
              cargo: parsedData.trabajador.cargo,
            },
          ],
          retroalimentacion_charla: {
            tema: parsedData.charla.tema,
            hora_desde: parsedData.charla.horaDesde,
            hora_hasta: parsedData.charla.horaHasta,
            num_participantes: 1,
            nombre_expositor: parsedData.supervisor,
            participantes: [
              {
                nombre: parsedData.trabajador.nombreCompleto,
                cargo: parsedData.trabajador.cargo,
              },
            ],
          },
          inspector_encargado: {
            nombre: parsedData.supervisor,
            cargo: 'Inspector HSE / SST',
          },
        };
        formatJson = f120Payload;
      } else {
        // HSE-EL-F-128
        const f128Payload: FormatoAmonestacionF128 = {
          tipo_formato: 'HSE_EL_F_128',
          codigo_documento: 'HSE-EL-F-128',
          version: '01',
          amonestado: {
            apellidos_nombres: parsedData.trabajador.nombreCompleto,
            dni: parsedData.trabajador.dni,
            cargo: parsedData.trabajador.cargo,
            empresa: parsedData.trabajador.empresa,
            ubicacion: parsedData.ubicacion,
            fecha: parsedData.fecha,
            hora: parsedData.hora,
          },
          responsables: {
            capataz_jefe_cuadrilla: 'Capataz de Cuadrilla',
            ing_responsable: parsedData.supervisor,
            actividad_trabajo: parsedData.actividad,
          },
          relato_razon: parsedData.amonestacion.relatoHechos,
          motivo_codigo: parsedData.amonestacion.motivoCodigo,
          detalle_motivo: `Infracción constatada en reporte WhatsApp: ${parsedData.hallazgo.descripcion}`,
          nivel_riesgo: parsedData.amonestacion.nivelRiesgo,
          otro_riesgo: '',
          accion_inmediata: parsedData.amonestacion.accionInmediata,
          sancion_codigo: parsedData.amonestacion.sancionSugerida,
          dias_suspension: parsedData.amonestacion.sancionSugerida === '02_SUSPENSION' ? 3 : undefined,
          validacion: {
            realizado_por: { nombre: parsedData.supervisor, cargo: 'Inspector HSE' },
            aprobado_por: { nombre: 'Ing. Jefe HSE', cargo: 'Supervisión HSE' },
            aceptado_por: { nombre: parsedData.trabajador.nombreCompleto, cargo: 'Trabajador Notificado' },
          },
        };
        formatJson = f128Payload;
      }

      // Crear la actividad en Supabase
      const newActivity = await activityService.createActivity({
        codigo_referencia: codigoRef,
        tipo_actividad: selectedFormatType,
        ubicacion: parsedData.ubicacion,
        fecha_operacion: parsedData.fecha,
        responsable_nombre: parsedData.supervisor,
        descripcion: parsedData.hallazgo.descripcion,
        estado_reporte: 'pendiente',
        datos_formato_json: formatJson,
      });

      // Vincular todas las evidencias del lote a la nueva actividad
      const evidenceIdsToLink = selectedItems
        .map((it) => it.evidence?.id)
        .filter((id): id is string => Boolean(id));

      if (evidenceIdsToLink.length > 0) {
        await activityService.vincularMultiplesEvidencias(
          evidenceIdsToLink,
          newActivity.id,
          'hallazgo'
        );
      }

      toast.success('¡Informe generado con éxito!', {
        description: `Se creó la actividad ${newActivity.codigo_referencia} con ${evidenceIdsToLink.length} imágenes vinculadas.`,
      });

      onActivityCreated?.(newActivity);
      onClose();
    } catch (err: any) {
      console.error('[SmartReportGeneratorModal] Error generando informe:', err);
      toast.error('Error al generar el informe', {
        description: err?.message || 'Revisa la consola para más detalles.',
      });
    } finally {
      setIsCreatingActivity(false);
    }
  };

  // Sincronización dinámica de tipo de informe
  const handleFormatChange = (tipo: 'INSPECCION' | 'AMONESTACION') => {
    setSelectedFormatType(tipo);
    if (parsedData) {
      // Actualizar el texto descriptivo de la actividad si contenía el valor por defecto
      const actividadActual = parsedData.actividad.toUpperCase();
      let nuevaActividad = parsedData.actividad;
      if (tipo === 'INSPECCION' && (actividadActual.includes('AMONESTACIÓN') || actividadActual.includes('AMONESTACION') || actividadActual === '')) {
        nuevaActividad = 'INSPECCIÓN DE CAMPO Y EVALUACIÓN HSE';
      } else if (tipo === 'AMONESTACION' && (actividadActual.includes('INSPECCIÓN') || actividadActual.includes('INSPECCION') || actividadActual === '')) {
        nuevaActividad = 'AMONESTACIÓN POR INCUMPLIMIENTO RISST';
      }
      setParsedData({
        ...parsedData,
        tipoReporteSugerido: tipo,
        actividad: nuevaActividad,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card border-border/80 shadow-2xl">
        {/* Cabecera Fija y Limpia */}
        <DialogHeader className="p-6 pb-4 border-b border-border/80 shrink-0 bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-foreground truncate">
                  Generador Inteligente desde WhatsApp / Lote de Fotos
                </DialogTitle>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400">
                  Human-in-the-Loop
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-none">
                Extrae datos mediante OCR de capturas de WhatsApp, fotochecks y sellos de fotos de campo, proponiendo el informe pre-llenado.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Stepper Horizontal Espaciado */}
        <div className="px-6 py-3 bg-muted/30 border-b border-border/60 shrink-0">
          <div className="flex items-center justify-between text-xs font-semibold max-w-2xl mx-auto">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 1 ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted text-muted-foreground'}`}>
                1
              </span>
              <span className="hidden sm:inline">Subir / Seleccionar</span>
              <span className="sm:hidden">Fotos</span>
            </div>
            <div className={`h-[2px] flex-1 mx-3 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-border'}`} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 2 ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted text-muted-foreground'}`}>
                2
              </span>
              <span className="hidden sm:inline">OCR &amp; Heurística</span>
              <span className="sm:hidden">OCR</span>
            </div>
            <div className={`h-[2px] flex-1 mx-3 rounded-full transition-colors ${step >= 3 ? 'bg-primary' : 'bg-border'}`} />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 3 ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted text-muted-foreground'}`}>
                3
              </span>
              <span className="hidden sm:inline">Validar &amp; Generar</span>
              <span className="sm:hidden">Validar</span>
            </div>
          </div>
        </div>

        {/* Cuerpo Scrollable Vertical (CERO Scroll Horizontal) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
          {/* ── PASO 1: SUBIR / SELECCIONAR IMÁGENES ───────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <Tabs defaultValue="upload" className="w-full flex flex-col min-h-0">
                <TabsList className="bg-muted/70 p-1 rounded-xl w-full sm:w-max grid grid-cols-2 sm:flex">
                  <TabsTrigger value="upload" className="text-xs px-3 py-1.5 gap-1.5 cursor-pointer">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Subir Nuevas Fotos</span>
                  </TabsTrigger>
                  <TabsTrigger value="library" className="text-xs px-3 py-1.5 gap-1.5 cursor-pointer">
                    <Library className="w-3.5 h-3.5" />
                    <span>Biblioteca ({libraryEvidences.length})</span>
                  </TabsTrigger>
                </TabsList>

                {/* Subpestaña: Subida Local */}
                <TabsContent value="upload" className="pt-4">
                  <label className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center cursor-pointer transition-all bg-muted/10 hover:bg-muted/20 text-center">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary mb-3">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <span className="font-bold text-sm sm:text-base text-foreground">
                      Haz clic para seleccionar imágenes o capturas
                    </span>
                    <span className="text-xs text-muted-foreground mt-1.5 max-w-lg">
                      Puedes subir simultáneamente la captura de WhatsApp del reporte + fotos del hallazgo + fotocheck del trabajador.
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFilesSelected}
                      className="hidden"
                    />
                  </label>
                </TabsContent>

                {/* Subpestaña: Biblioteca Reutilizable */}
                <TabsContent value="library" className="space-y-3 pt-3">
                  <Input
                    placeholder="Buscar en biblioteca por nombre de archivo o texto OCR..."
                    value={searchLibrary}
                    onChange={(e) => setSearchLibrary(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <div className="min-h-[220px] max-h-[340px] overflow-y-auto pr-1">
                    {loadingLibrary ? (
                      <div className="flex items-center justify-center h-48 text-xs text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin mr-2 text-primary" />
                        Cargando biblioteca de evidencias...
                      </div>
                    ) : filteredLibrary.length === 0 ? (
                      <div className="text-center py-12 text-xs text-muted-foreground">
                        No hay imágenes disponibles en la biblioteca.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {filteredLibrary.map((ev) => {
                          const isSelected = selectedItems.some((it) => it.evidence?.id === ev.id);
                          return (
                            <div
                              key={ev.id}
                              onClick={() => toggleSelectLibraryEvidence(ev)}
                              className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                                isSelected
                                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs'
                                  : 'border-border bg-card hover:border-foreground/30 hover:shadow-xs'
                              }`}
                            >
                              <img
                                src={libraryUrlMap[ev.id]}
                                alt={ev.nombre_archivo}
                                className="w-full h-24 object-cover rounded-lg bg-muted"
                              />
                              <span className="text-[11px] font-medium truncate" title={ev.nombre_archivo}>
                                {ev.nombre_archivo}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Lista de Imágenes Seleccionadas */}
              {selectedItems.length > 0 && (
                <div className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-foreground">Lote de imágenes para procesar ({selectedItems.length}):</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedItems([])}
                      className="h-7 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      Limpiar todo
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="relative group shrink-0 w-24">
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-xl border border-border/80 shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeSelectedItem(item.id)}
                          className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                          title="Quitar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] block truncate text-muted-foreground mt-1" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PASO 2: PROCESAMIENTO OCR EN VIVO ─────────────────────────────── */}
          {step === 2 && (
            <div className="max-w-xl mx-auto space-y-5 py-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Procesando Lote de Imágenes con Tesseract.js (spa)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Extrayendo texto de capturas de WhatsApp, credenciales fotocheck y sellos GPS de fotos de campo...
                </p>
              </div>

              <Progress value={globalProgress} className="h-2 rounded-full" />

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedItems.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl border border-border bg-card flex items-center justify-between text-xs shadow-xs">
                    <div className="flex items-center gap-3 truncate max-w-[320px]">
                      <img src={item.previewUrl} alt="" className="w-9 h-9 object-cover rounded-lg border border-border shrink-0" />
                      <span className="truncate font-medium text-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === 'processing' && (
                        <span className="text-xs text-primary animate-pulse font-mono font-semibold">
                          {item.progress}%
                        </span>
                      )}
                      {item.status === 'done' && (
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10 font-semibold">
                          {item.classification?.tipo.replace(/_/g, ' ')}
                        </Badge>
                      )}
                      {item.status === 'error' && (
                        <Badge variant="destructive" className="text-[10px]">Error OCR</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PASO 3: REVISIÓN HUMAN-IN-THE-LOOP Y EDICIÓN ──────────────────── */}
          {step === 3 && parsedData && (
            <div className="space-y-6">
              {/* Banner Informativo Superior */}
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/15 text-primary shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Revisión y Ajuste de Datos Extraídos (Human-in-the-Loop)
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Revisa y edita los campos extraídos antes de confirmar la creación oficial. Selecciona el formato que deseas generar:
                  </p>
                </div>
              </div>

              {/* Selector de Formato en Tarjetas Grandes y Claras (Grid 2 columnas) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  Tipo de Formato HSE a Generar:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleFormatChange('INSPECCION')}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                      selectedFormatType === 'INSPECCION'
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs'
                        : 'border-border bg-card hover:border-foreground/30 hover:bg-muted/30'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${selectedFormatType === 'INSPECCION' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">Formato HSE-EL-F-120</span>
                        {selectedFormatType === 'INSPECCION' && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">Activo</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Inspección Periódica + Hallazgos + Corrección en Campo (Checklist 15 Secciones, 4 Págs)
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFormatChange('AMONESTACION')}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                      selectedFormatType === 'AMONESTACION'
                        ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20 shadow-xs'
                        : 'border-border bg-card hover:border-foreground/30 hover:bg-muted/30'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${selectedFormatType === 'AMONESTACION' ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">Formato HSE-EL-F-128</span>
                        {selectedFormatType === 'AMONESTACION' && (
                          <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">Activo</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Registro Oficial de Amonestación a Trabajador / Cuadrilla por Faltas al RISST
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Grilla de Datos Generales (3 Columnas en Desktop) */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-xs">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  Datos Generales de la Operación
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="min-w-0">
                    <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Proyecto / Sede</label>
                    <Input
                      value={parsedData.proyecto}
                      onChange={(e) => setParsedData({ ...parsedData, proyecto: e.target.value })}
                      className="h-9 text-xs w-full min-w-0"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Actividad Detectada</label>
                    <Input
                      value={parsedData.actividad}
                      onChange={(e) => setParsedData({ ...parsedData, actividad: e.target.value })}
                      className="h-9 text-xs w-full min-w-0 font-medium"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Lugar / Ubicación</label>
                    <Input
                      value={parsedData.ubicacion}
                      onChange={(e) => setParsedData({ ...parsedData, ubicacion: e.target.value })}
                      className="h-9 text-xs w-full min-w-0"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Fecha Inspección</label>
                    <Input
                      type="date"
                      value={parsedData.fecha}
                      onChange={(e) => setParsedData({ ...parsedData, fecha: e.target.value })}
                      className="h-9 text-xs w-full min-w-0"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Hora</label>
                    <Input
                      type="time"
                      value={parsedData.hora}
                      onChange={(e) => setParsedData({ ...parsedData, hora: e.target.value })}
                      className="h-9 text-xs w-full min-w-0"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Supervisor HSE</label>
                    <Input
                      value={parsedData.supervisor}
                      onChange={(e) => setParsedData({ ...parsedData, supervisor: e.target.value })}
                      className="h-9 text-xs w-full min-w-0"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Involucrado / Trabajador Intervenido (4 Columnas en Desktop) */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-xs">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <User className="w-4 h-4 text-primary" />
                  Personal Involucrado / Trabajador Intervenido
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="min-w-0">
                    <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Apellidos y Nombres</label>
                    <Input
                      value={parsedData.trabajador.nombreCompleto}
                      onChange={(e) => setParsedData({
                        ...parsedData,
                        trabajador: { ...parsedData.trabajador, nombreCompleto: e.target.value },
                      })}
                      className="h-9 text-xs font-semibold w-full min-w-0"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="font-semibold text-muted-foreground block text-[11px] mb-1">DNI</label>
                    <Input
                      value={parsedData.trabajador.dni}
                      onChange={(e) => setParsedData({
                        ...parsedData,
                        trabajador: { ...parsedData.trabajador, dni: e.target.value },
                      })}
                      className="h-9 text-xs font-mono w-full min-w-0"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Cargo / Ocupación</label>
                    <Input
                      value={parsedData.trabajador.cargo}
                      onChange={(e) => setParsedData({
                        ...parsedData,
                        trabajador: { ...parsedData.trabajador, cargo: e.target.value },
                      })}
                      className="h-9 text-xs w-full min-w-0"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Empresa</label>
                    <Input
                      value={parsedData.trabajador.empresa}
                      onChange={(e) => setParsedData({
                        ...parsedData,
                        trabajador: { ...parsedData.trabajador, empresa: e.target.value },
                      })}
                      className="h-9 text-xs w-full min-w-0"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN ESPECÍFICA SEGÚN FORMATO SELECCIONADO */}
              {selectedFormatType === 'INSPECCION' ? (
                /* ── CAMPOS F-120 (Inspección + Levantamiento + Charla) ── */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-xs">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Hallazgo y Acción Correctiva (HSE-EL-F-120)
                    </span>
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] text-muted-foreground font-semibold">Descripción del Hallazgo / Observación</label>
                          <Badge variant="outline" className="text-[10px]">
                            Ítem sugerido: {parsedData.hallazgo.itemReferencia}
                          </Badge>
                        </div>
                        <textarea
                          rows={2}
                          value={parsedData.hallazgo.descripcion}
                          onChange={(e) => setParsedData({
                            ...parsedData,
                            hallazgo: { ...parsedData.hallazgo, descripcion: e.target.value },
                          })}
                          className="w-full text-xs p-2.5 rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground font-semibold block mb-1">Acción para el Levantamiento / Medida Inmediata</label>
                        <textarea
                          rows={2}
                          value={parsedData.hallazgo.accionLevantamiento}
                          onChange={(e) => setParsedData({
                            ...parsedData,
                            hallazgo: { ...parsedData.hallazgo, accionLevantamiento: e.target.value },
                          })}
                          className="w-full text-xs p-2.5 rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Retroalimentación / Charla de 5 Minutos */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-xs">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                      Retroalimentación / Charla Preventiva de Campo
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="sm:col-span-2">
                        <label className="text-[11px] text-muted-foreground font-semibold block mb-1">Tema Tratado</label>
                        <Input
                          value={parsedData.charla.tema}
                          onChange={(e) => setParsedData({
                            ...parsedData,
                            charla: { ...parsedData.charla, tema: e.target.value },
                          })}
                          className="h-9 text-xs w-full"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-muted-foreground font-semibold block mb-1">Desde</label>
                          <Input
                            type="time"
                            value={parsedData.charla.horaDesde}
                            onChange={(e) => setParsedData({
                              ...parsedData,
                              charla: { ...parsedData.charla, horaDesde: e.target.value },
                            })}
                            className="h-9 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground font-semibold block mb-1">Hasta</label>
                          <Input
                            type="time"
                            value={parsedData.charla.horaHasta}
                            onChange={(e) => setParsedData({
                              ...parsedData,
                              charla: { ...parsedData.charla, horaHasta: e.target.value },
                            })}
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── CAMPOS F-128 (Amonestación Oficial RISST) ── */
                <div className="p-4 rounded-xl border border-amber-500/30 bg-card space-y-4 shadow-xs">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4" />
                    Parámetros de Amonestación RISST (HSE-EL-F-128)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Motivo de la Falta</label>
                      <select
                        value={parsedData.amonestacion.motivoCodigo}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          amonestacion: { ...parsedData.amonestacion, motivoCodigo: e.target.value as MotivoAmonestacion },
                        })}
                        className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium cursor-pointer"
                      >
                        {(Object.keys(MOTIVOS_AMONESTACION) as MotivoAmonestacion[]).map((cod) => (
                          <option key={cod} value={cod}>{MOTIVOS_AMONESTACION[cod]}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Nivel de Riesgo</label>
                      <select
                        value={parsedData.amonestacion.nivelRiesgo}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          amonestacion: { ...parsedData.amonestacion, nivelRiesgo: e.target.value as NivelRiesgoAmonestacion },
                        })}
                        className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium cursor-pointer"
                      >
                        {(Object.keys(NIVELES_RIESGO) as NivelRiesgoAmonestacion[]).map((cod) => (
                          <option key={cod} value={cod}>{NIVELES_RIESGO[cod]}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-muted-foreground block text-[11px] mb-1">Sanción Aplicable (RISST)</label>
                      <select
                        value={parsedData.amonestacion.sancionSugerida}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          amonestacion: { ...parsedData.amonestacion, sancionSugerida: e.target.value as SancionAmonestacion },
                        })}
                        className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium cursor-pointer"
                      >
                        {(Object.keys(SANCIONES_RISST) as SancionAmonestacion[]).map((cod) => (
                          <option key={cod} value={cod}>{SANCIONES_RISST[cod]}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-[11px] text-muted-foreground font-semibold block mb-1">
                        Relato Circunstanciado de los Hechos
                      </label>
                      <textarea
                        rows={2}
                        value={parsedData.amonestacion.relatoHechos}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          amonestacion: { ...parsedData.amonestacion, relatoHechos: e.target.value },
                        })}
                        className="w-full text-xs p-2.5 rounded-lg border border-input bg-background focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground font-semibold block mb-1">
                        Acción Correctiva Inmediata Dispuesta
                      </label>
                      <textarea
                        rows={2}
                        value={parsedData.amonestacion.accionInmediata}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          amonestacion: { ...parsedData.amonestacion, accionInmediata: e.target.value },
                        })}
                        className="w-full text-xs p-2.5 rounded-lg border border-input bg-background focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Fijo con Botones Claros */}
        <DialogFooter className="p-4 px-6 border-t border-border/80 bg-background shrink-0 flex items-center justify-between gap-3">
          {step === 1 && (
            <>
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs cursor-pointer">
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleStartProcessing}
                disabled={selectedItems.length === 0}
                className="text-xs gap-1.5 cursor-pointer bg-primary text-primary-foreground shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Procesar {selectedItems.length > 0 ? `(${selectedItems.length}) Fotos` : ''} con OCR</span>
              </Button>
            </>
          )}

          {step === 2 && (
            <div className="text-xs text-muted-foreground italic flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span>Extrayendo datos de WhatsApp y fotos de campo con Tesseract...</span>
            </div>
          )}

          {step === 3 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
                disabled={isCreatingActivity}
                className="text-xs cursor-pointer"
              >
                Atrás
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmAndGenerate}
                disabled={isCreatingActivity}
                className={`text-xs gap-1.5 cursor-pointer text-white shadow-xs ${
                  selectedFormatType === 'AMONESTACION'
                    ? 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
              >
                {isCreatingActivity ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creando informe en Supabase...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {selectedFormatType === 'AMONESTACION'
                        ? 'Confirmar y Generar Informe (HSE-EL-F-128 AMONESTACIÓN)'
                        : 'Confirmar y Generar Informe (HSE-EL-F-120 INSPECCIÓN)'}
                    </span>
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SmartReportGeneratorModal;
