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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  evidenceService,
  type EvidenciaRow,
} from '../../services/EvidenceService';
import { activityService } from '../../services/ActivityService';
import { EvidenceUploader } from './EvidenceUploader';
import {
  Search,
  CheckCircle2,
  Calendar,
  User,
  FileText,
  UploadCloud,
  Library,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { Database } from '../../types/database.types';

type IdentificacionRow = Database['public']['Tables']['identificaciones']['Row'];

export type RolEvidencia = 'hallazgo' | 'correccion' | 'fotocheck' | 'whatsapp_captura' | 'general';

export interface EvidenceLibraryItem {
  evidencia: EvidenciaRow;
  identificacion: IdentificacionRow | null;
  thumbnailUrl?: string;
}

export interface EvidenceLibraryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  actividadId: string;
  defaultRol?: RolEvidencia;
  onEvidencesLinked?: (linkedEvidences: EvidenciaRow[], rol: RolEvidencia) => void;
  alreadyLinkedEvidenceIds?: string[];
}

export const EvidenceLibraryPickerModal: React.FC<EvidenceLibraryPickerModalProps> = ({
  isOpen,
  onClose,
  actividadId,
  defaultRol = 'hallazgo',
  onEvidencesLinked,
  alreadyLinkedEvidenceIds = [],
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [items, setItems] = useState<EvidenceLibraryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros y Selección
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedRol, setSelectedRol] = useState<RolEvidencia>(defaultRol);
  const [isLinking, setIsLinking] = useState<boolean>(false);

  // Sincronizar rol por defecto al abrir o cambiar de prop
  useEffect(() => {
    if (defaultRol) {
      setSelectedRol(defaultRol);
    }
  }, [defaultRol]);

  // Cargar biblioteca al abrir
  const loadLibrary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await evidenceService.getAllEvidencesWithIdentifications();
      
      // Resolver URLs de miniaturas para visualización rápida
      const batchItems = data.map((d) => d.evidencia);
      const urlMap = await evidenceService.getEvidenceBatchImageUrls(batchItems, {
        type: 'thumb',
        expiresIn: 3600,
      });

      const itemsWithThumbnails: EvidenceLibraryItem[] = data.map((d) => ({
        ...d,
        thumbnailUrl: urlMap[d.evidencia.id] || '',
      }));

      setItems(itemsWithThumbnails);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar la biblioteca';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadLibrary();
      setSelectedIds(new Set());
    }
  }, [isOpen, loadLibrary]);

  // Filtrado reactivo en cliente (nombre, texto OCR, trabajador o fecha)
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) => {
      const filename = item.evidencia.nombre_archivo?.toLowerCase() || '';
      const ocr = item.identificacion?.texto_crudo_ocr?.toLowerCase() || '';
      const nombres = item.identificacion?.nombres?.toLowerCase() || '';
      const apPaterno = item.identificacion?.apellido_paterno?.toLowerCase() || '';
      const apMaterno = item.identificacion?.apellido_materno?.toLowerCase() || '';
      const cargo = item.identificacion?.cargo?.toLowerCase() || '';
      const fecha = (item.evidencia.fecha_captura || item.evidencia.fecha_ingesta || '').toLowerCase();

      return (
        filename.includes(query) ||
        ocr.includes(query) ||
        nombres.includes(query) ||
        apPaterno.includes(query) ||
        apMaterno.includes(query) ||
        cargo.includes(query) ||
        fecha.includes(query)
      );
    });
  }, [items, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    const unlinkedFilteredIds = filteredItems
      .filter((i) => !alreadyLinkedEvidenceIds.includes(i.evidencia.id))
      .map((i) => i.evidencia.id);
    setSelectedIds(new Set(unlinkedFilteredIds));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Vincular lote seleccionado
  const handleConfirmLink = async () => {
    const idsToLink = Array.from(selectedIds);
    if (idsToLink.length === 0) return;

    setIsLinking(true);
    try {
      await activityService.vincularMultiplesEvidencias(idsToLink, actividadId, selectedRol);
      
      const linkedEvidences = items
        .filter((item) => idsToLink.includes(item.evidencia.id))
        .map((item) => item.evidencia);

      onEvidencesLinked?.(linkedEvidences, selectedRol);
      onClose();
    } catch (err: unknown) {
      console.error('[EvidenceLibraryPickerModal] Error al vincular lote:', err);
      setError('Error al vincular lote de evidencias');
    } finally {
      setIsLinking(false);
    }
  };

  // Subida directa desde dentro del modal y vinculación automática
  const handleDirectUploadSuccess = async (uploadedEvidences: EvidenciaRow[]) => {
    if (!uploadedEvidences || uploadedEvidences.length === 0) return;

    setIsLinking(true);
    try {
      const ids = uploadedEvidences.map((e) => e.id);
      await activityService.vincularMultiplesEvidencias(ids, actividadId, selectedRol);
      
      onEvidencesLinked?.(uploadedEvidences, selectedRol);
      onClose();
    } catch (err: unknown) {
      console.error('[EvidenceLibraryPickerModal] Error vinculando fotos recién subidas:', err);
      setError('Las fotos se subieron pero ocurrió un problema al vincularlas');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-4 sm:p-6 overflow-hidden">
        <DialogHeader className="pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Library className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold">
                  Biblioteca de Evidencias Reutilizables (Relación N:M)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Selecciona fotos históricas o sube nuevas para vincularlas a este informe.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs: Biblioteca vs Subida Directa */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0 mt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
            <TabsList className="bg-muted/70 p-1 rounded-xl">
              <TabsTrigger value="library" className="text-xs px-3 py-1.5 gap-1.5">
                <Library className="w-3.5 h-3.5" />
                <span>Explorar Biblioteca ({items.length})</span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="text-xs px-3 py-1.5 gap-1.5">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Subir Nuevas Fotos</span>
              </TabsTrigger>
            </TabsList>

            {/* Selector de Rol de Evidencia */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-muted-foreground whitespace-nowrap">Asignar como:</span>
              <select
                value={selectedRol}
                onChange={(e) => setSelectedRol(e.target.value as RolEvidencia)}
                className="h-8 rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-semibold focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="hallazgo">📸 Foto de Hallazgo</option>
                <option value="correccion">✅ Foto de Medida Correctiva</option>
                <option value="fotocheck">🪪 Fotocheck / DNI Identificado</option>
                <option value="whatsapp_captura">💬 Captura de WhatsApp</option>
                <option value="general">📁 General / Apoyo</option>
              </select>
            </div>
          </div>

          {/* TAB 1: EXPLORAR BIBLIOTECA */}
          <TabsContent value="library" className="flex-1 flex flex-col min-h-0 space-y-3 pt-2">
            {/* Barra de Búsqueda y Filtros */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por archivo, texto OCR, trabajador, DNI o fecha..."
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={filteredItems.length === 0}
                  className="h-9 text-xs rounded-xl cursor-pointer"
                >
                  Seleccionar Todo
                </Button>
                {selectedIds.size > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="h-9 text-xs rounded-xl text-muted-foreground cursor-pointer"
                  >
                    Deseleccionar ({selectedIds.size})
                  </Button>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Grilla de Evidencias */}
            <div className="flex-1 min-h-[280px] max-h-[420px] overflow-y-auto pr-1">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-muted-foreground text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                  <span>Cargando biblioteca histórica de evidencias...</span>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="h-full min-h-[220px] flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-2xl text-center text-xs text-muted-foreground">
                  <Library className="w-8 h-8 opacity-40 mb-2" />
                  <p className="font-semibold text-foreground">No se encontraron evidencias</p>
                  <p className="text-[11px] mt-1 max-w-sm">
                    {searchQuery
                      ? 'No hay resultados que coincidan con la búsqueda. Intenta con otros términos.'
                      : 'Aún no hay fotos en la biblioteca. Puedes subir nuevas en la pestaña "Subir Nuevas Fotos".'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredItems.map((item) => {
                    const isSelected = selectedIds.has(item.evidencia.id);
                    const isAlreadyLinked = alreadyLinkedEvidenceIds.includes(item.evidencia.id);
                    const hasOcr = Boolean(item.identificacion?.texto_crudo_ocr);
                    const workerName = item.identificacion?.nombres
                      ? `${item.identificacion.nombres} ${item.identificacion.apellido_paterno || ''}`.trim()
                      : null;

                    return (
                      <div
                        key={item.evidencia.id}
                        onClick={() => !isAlreadyLinked && toggleSelect(item.evidencia.id)}
                        className={`group relative rounded-2xl border p-3 flex flex-col gap-2 transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-xs ring-2 ring-primary/20'
                            : isAlreadyLinked
                            ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 opacity-75 cursor-not-allowed'
                            : 'border-border bg-card hover:border-border/80 hover:shadow-xs'
                        }`}
                      >
                        {/* Cabecera de tarjeta: Checkbox & Badges */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={isSelected || isAlreadyLinked}
                              disabled={isAlreadyLinked}
                              onCheckedChange={() => !isAlreadyLinked && toggleSelect(item.evidencia.id)}
                              className="rounded cursor-pointer"
                            />
                            <span className="text-[11px] font-semibold truncate max-w-[150px]" title={item.evidencia.nombre_archivo}>
                              {item.evidencia.nombre_archivo}
                            </span>
                          </div>

                          {isAlreadyLinked ? (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-muted text-muted-foreground">
                              Vinculada
                            </Badge>
                          ) : item.evidencia.estado === 'vinculada' ? (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-sky-700 dark:text-sky-300 border-sky-300">
                              Reutilizable
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-emerald-700 dark:text-emerald-300 border-emerald-300">
                              Pendiente
                            </Badge>
                          )}
                        </div>

                        {/* Contenido / Vista Previa */}
                        <div className="flex gap-2.5 items-center">
                          {item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.evidencia.nombre_archivo}
                              className="w-14 h-14 object-cover rounded-xl border border-border shrink-0 bg-muted"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl border border-border bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                              <FileText className="w-5 h-5 opacity-40" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1 space-y-1 text-[11px]">
                            {/* Trabajador o Texto OCR */}
                            {workerName ? (
                              <div className="flex items-center gap-1 font-semibold text-foreground truncate" title={workerName}>
                                <User className="w-3 h-3 text-primary shrink-0" />
                                <span className="truncate">{workerName}</span>
                              </div>
                            ) : hasOcr ? (
                              <div className="flex items-center gap-1 text-muted-foreground truncate" title={item.identificacion?.texto_crudo_ocr || ''}>
                                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                                <span className="truncate italic">OCR extraído</span>
                              </div>
                            ) : (
                              <div className="text-muted-foreground text-[10px] italic">Sin OCR registrado</div>
                            )}

                            {/* Hash y Fecha */}
                            <div className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground">
                              <span>SHA:</span>
                              <span className="truncate">{item.evidencia.hash_sha256.slice(0, 10)}...</span>
                            </div>

                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Calendar className="w-2.5 h-2.5 shrink-0" />
                              <span>{new Date(item.evidencia.fecha_ingesta).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: SUBIDA DIRECTA */}
          <TabsContent value="upload" className="flex-1 flex flex-col justify-center min-h-[320px] py-2">
            <div className="p-4 rounded-2xl border border-border bg-muted/20">
              <div className="mb-3">
                <h4 className="text-xs font-bold text-foreground">
                  Subida Masiva y Vinculación Automática
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Las imágenes que cargues aquí se guardarán con su hash criptográfico SHA-256 inmutable y quedarán inmediatamente vinculadas a este informe con el rol seleccionado ({selectedRol}).
                </p>
              </div>

              <EvidenceUploader
                onBatchUploadSuccess={(results) => {
                  const evidences = results.map((r) => r.evidence);
                  handleDirectUploadSuccess(evidences);
                }}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer con Acciones */}
        <DialogFooter className="pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            {selectedIds.size > 0 ? (
              <span className="font-semibold text-primary">
                {selectedIds.size} {selectedIds.size === 1 ? 'evidencia seleccionada' : 'evidencias seleccionadas'} para vincular como "{selectedRol}"
              </span>
            ) : (
              <span>Selecciona una o varias imágenes de la biblioteca</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLinking}
              className="rounded-xl text-xs cursor-pointer"
            >
              Cancelar
            </Button>

            {activeTab === 'library' && (
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmLink}
                disabled={selectedIds.size === 0 || isLinking}
                className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLinking ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Vinculando en bloque...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Vincular {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EvidenceLibraryPickerModal;
