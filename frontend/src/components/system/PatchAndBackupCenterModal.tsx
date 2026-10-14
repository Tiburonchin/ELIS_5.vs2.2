import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  RefreshCw,
  Upload,
  Download,
  History,
  ShieldCheck,
  AlertTriangle,
  FileCode2,
  CheckCircle2,
  Layers,
  Sparkles,
  ArrowRight,
  Database,
  RotateCcw,
} from 'lucide-react';
import {
  patchAndBackupService,
  CURRENT_APP_VERSION,
  type BackupSistemaRow,
  type LocalDraftBackup,
  type ModoParche,
} from '@/services/PatchAndBackupService';
import { toast } from 'sonner';

interface PatchAndBackupCenterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetActividadId?: string;
  targetCodigoReferencia?: string;
  onRestoreSuccess?: () => void;
}

export const PatchAndBackupCenterModal: React.FC<PatchAndBackupCenterModalProps> = ({
  open,
  onOpenChange,
  targetActividadId,
  targetCodigoReferencia,
  onRestoreSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'ota' | 'parche_datos' | 'historial'>('ota');
  
  // Tab 1: OTA Status
  const [checkingOta, setCheckingOta] = useState(false);
  const [otaProgress, setOtaProgress] = useState(0);
  const [otaStatusMsg, setOtaStatusMsg] = useState<string | null>(null);

  // Tab 2: Cargar Parche de Datos
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modoParche, setModoParche] = useState<ModoParche>('MERGE');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [isApplyingPatch, setIsApplyingPatch] = useState(false);

  // Tab 3: Historial de Backups
  const [backups, setBackups] = useState<Array<LocalDraftBackup | BackupSistemaRow>>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [isRestoringId, setIsRestoringId] = useState<string | null>(null);

  // Cargar historial al abrir el modal o cambiar de pestaña
  useEffect(() => {
    if (open) {
      loadBackups();
    }
  }, [open, targetActividadId]);

  const loadBackups = async () => {
    try {
      setLoadingBackups(true);
      const list = await patchAndBackupService.getUnifiedBackupsList(targetActividadId);
      setBackups(list);
    } catch (err) {
      console.error('[PatchAndBackupCenter] Error cargando backups:', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // HANDLERS TAB 1: OTA & Hot-Reload
  // ═════════════════════════════════════════════════════════════════════════
  const handleCheckAndApplyOtaPatch = async () => {
    try {
      setCheckingOta(true);
      setOtaProgress(20);
      setOtaStatusMsg('Creando respaldo preventivo automático...');

      // 1. Respaldo preventivo
      await patchAndBackupService.createSafetyBackup('PRE_PARCHE_APP');
      setOtaProgress(50);
      setOtaStatusMsg('Verificando chunks diferenciales del Service Worker...');

      // 2. Comprobar y aplicar parche
      const result = await patchAndBackupService.checkAndApplyServiceWorkerPatch();
      setOtaProgress(90);

      setTimeout(() => {
        setOtaProgress(100);
        setOtaStatusMsg(result.message);
        setCheckingOta(false);
        loadBackups();

        if (result.updated) {
          toast.success('Parche OTA aplicado con éxito', {
            description: result.message,
          });
        } else {
          toast.info('Sistema al día', {
            description: 'No hay nuevos chunks diferenciales pendientes.',
          });
        }
      }, 600);
    } catch (err: any) {
      console.error('[PatchAndBackupCenter] Error en OTA:', err);
      setCheckingOta(false);
      toast.error('Error al verificar parches', {
        description: err?.message || 'No se pudo comunicar con el Service Worker.',
      });
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // HANDLERS TAB 2: Cargar Parche de Datos
  // ═════════════════════════════════════════════════════════════════════════
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.json')) {
        toast.error('Archivo no admitido', {
          description: 'Por favor selecciona un archivo .elis-patch.json válido.',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleApplyDataPatch = async () => {
    if (!selectedFile) {
      toast.warning('Selecciona un archivo', {
        description: 'Debes cargar un archivo de parche antes de continuar.',
      });
      return;
    }

    try {
      setIsApplyingPatch(true);

      // Si el check está activo, garantizar backup previo
      if (autoBackupEnabled) {
        await patchAndBackupService.createSafetyBackup(
          'PRE_SOBRESCRITURA_ACTIVIDAD',
          targetActividadId,
          undefined,
          `Backup preventivo antes de aplicar parche: ${selectedFile.name}`
        );
      }

      const res = await patchAndBackupService.importAndApplyPatchFile(
        selectedFile,
        modoParche,
        targetActividadId
      );

      toast.success('Parche aplicado correctamente', {
        description: `${res.mensaje} (Modo: ${modoParche})`,
      });

      setSelectedFile(null);
      await loadBackups();
      if (onRestoreSuccess) onRestoreSuccess();
    } catch (err: any) {
      console.error('[PatchAndBackupCenter] Error aplicando parche:', err);
      toast.error('Error al aplicar parche', {
        description: err?.message || 'No se pudo procesar el archivo.',
      });
    } finally {
      setIsApplyingPatch(false);
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // HANDLERS TAB 3: Historial de Backups & Rollback
  // ═════════════════════════════════════════════════════════════════════════
  const handleRollback = async (backupId: string) => {
    try {
      setIsRestoringId(backupId);
      const res = await patchAndBackupService.rollbackActivityBackup(backupId);

      toast.success('Restauración completada', {
        description: res.mensaje || 'La actividad ha sido revertida al punto de control.',
      });

      await loadBackups();
      if (onRestoreSuccess) onRestoreSuccess();
    } catch (err: any) {
      console.error('[PatchAndBackupCenter] Error en rollback:', err);
      toast.error('Fallo en la restauración', {
        description: err?.message || 'No se pudo revertir la actividad al snapshot.',
      });
    } finally {
      setIsRestoringId(null);
    }
  };

  const handleDownloadFullBackup = async () => {
    try {
      await patchAndBackupService.exportFullBackupFile();
      toast.success('Copia de seguridad descargada', {
        description: 'Archivo .elis-backup.json generado con éxito.',
      });
    } catch (err: any) {
      toast.error('Error al exportar', { description: err?.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="shrink-0 pb-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Centro de Actualizaciones, Parches y Backups
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Gestión integral de parches OTA, sobrescritura segura y puntos de restauración &bull; v{CURRENT_APP_VERSION}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadFullBackup}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5 text-primary" />
              <span>Descargar Copia (.json)</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Contenido en Pestañas */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as any)}
          className="flex-1 flex flex-col min-h-0 mt-3"
        >
          <TabsList className="grid grid-cols-3 w-full shrink-0">
            <TabsTrigger value="ota" className="text-xs flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Parches OTA &amp; Hot-Reload</span>
              <span className="sm:hidden">OTA</span>
            </TabsTrigger>
            <TabsTrigger value="parche_datos" className="text-xs flex items-center gap-1.5">
              <FileCode2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cargar Parche / Sobrescritura</span>
              <span className="sm:hidden">Parche</span>
            </TabsTrigger>
            <TabsTrigger value="historial" className="text-xs flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Historial &amp; Rollback</span>
              <span className="sm:hidden">Backups</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: PARCHES DEL SISTEMA (OTA & Hot-Reload) */}
          <TabsContent value="ota" className="flex-1 overflow-y-auto space-y-4 pt-4 pr-1">
            <Card className="border-primary/20 bg-muted/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Estado del Service Worker &amp; Caché
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Actualización ligera de chunks sin reinstalación completa ni pérdida de datos.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/30">
                    v{CURRENT_APP_VERSION}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-background p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Estrategia de Actualización:</span>
                    <span className="font-medium text-foreground">Hot-Patching Diferencial (skipWaiting)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Protección de Datos:</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Backup preventivo obligatorio activo
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Limpieza Automática:</span>
                    <span className="font-medium text-foreground">Purga de cachés obsoletas de chunks antiguos</span>
                  </div>
                </div>

                {checkingOta && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{otaStatusMsg || 'Comprobando...'}</span>
                      <span>{otaProgress}%</span>
                    </div>
                    <Progress value={otaProgress} className="h-2" />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <Button
                    onClick={handleCheckAndApplyOtaPatch}
                    disabled={checkingOta}
                    className="flex-1 gap-2 text-xs font-semibold"
                  >
                    <RefreshCw className={`h-4 w-4 ${checkingOta ? 'animate-spin' : ''}`} />
                    <span>Buscar y Aplicar Parche de Actualización</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: CARGAR PARCHE DE DATOS / SOBRESCRITURA SEGURA */}
          <TabsContent value="parche_datos" className="flex-1 overflow-y-auto space-y-4 pt-4 pr-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  Inyectar Parche Diferencial (.elis-patch.json)
                </CardTitle>
                <CardDescription className="text-xs">
                  {targetCodigoReferencia
                    ? `Destino: Actividad ${targetCodigoReferencia}`
                    : 'Actualiza o fusiona secciones HSE sin recargar la base de datos completa.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Selector de Archivo */}
                <div className="border-2 border-dashed rounded-lg p-5 text-center hover:bg-muted/30 transition-colors">
                  <input
                    type="file"
                    id="patch-file-input"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="patch-file-input" className="cursor-pointer space-y-2 block">
                    <FileCode2 className="h-8 w-8 text-muted-foreground mx-auto" />
                    {selectedFile ? (
                      <div className="space-y-1">
                        <p className="font-semibold text-primary">{selectedFile.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB &bull; Clic para cambiar
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          Selecciona un archivo <span className="text-primary font-semibold">.elis-patch.json</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Compatible con plantillas de 15 Secciones HSE y formato F-128
                        </p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Opciones de Modo de Sobrescritura */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Modo de Aplicación del Parche:</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setModoParche('MERGE')}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        modoParche === 'MERGE'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <Layers className="h-3.5 w-3.5 text-primary" />
                        <span>Fusionar Cambios (MERGE)</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Conserva campos intactos y solo actualiza o suscribe los valores modificados en el JSON.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModoParche('OVERWRITE')}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        modoParche === 'OVERWRITE'
                          ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500'
                          : 'border-border hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        <span>Borrar y Sobrescribir (OVERWRITE)</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Reemplaza completamente la estructura del formato actual por la del archivo de parche.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Checkbox de Backup de Seguridad Preventivo */}
                <div className="flex items-start gap-2 rounded-lg border p-3 bg-muted/20">
                  <Checkbox
                    id="auto-backup-check"
                    checked={autoBackupEnabled}
                    onCheckedChange={(checked) => setAutoBackupEnabled(!!checked)}
                    className="mt-0.5"
                  />
                  <div className="grid gap-0.5 leading-none cursor-pointer">
                    <label
                      htmlFor="auto-backup-check"
                      className="text-xs font-medium cursor-pointer text-foreground flex items-center gap-1"
                    >
                      <span>✅ Crear Backup automático antes de sobrescribir</span>
                      <Badge variant="outline" className="text-[10px] px-1 py-0 border-emerald-500/30 text-emerald-600">
                        Recomendado
                      </Badge>
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Genera un snapshot inmutable en public.backups_sistema para permitir Rollback en 1 clic.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleApplyDataPatch}
                  disabled={!selectedFile || isApplyingPatch}
                  className="w-full gap-2 text-xs font-semibold"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>{isApplyingPatch ? 'Aplicando Parche...' : 'Aplicar Parche en el Sistema'}</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: HISTORIAL DE BACKUPS Y ROLLBACK EN 1 CLIC */}
          <TabsContent value="historial" className="flex-1 overflow-y-auto space-y-3 pt-3 pr-1">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h4 className="text-xs font-semibold text-foreground">
                  Puntos de Restauración Inmutables ("Por si acaso")
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Respaldos automáticos generados antes de parches, sobrescrituras o cambios de formato.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadBackups}
                disabled={loadingBackups}
                className="h-7 text-xs gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${loadingBackups ? 'animate-spin' : ''}`} />
                <span>Refrescar</span>
              </Button>
            </div>

            {loadingBackups ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto text-primary" />
                <p>Consultando puntos de restauración seguros...</p>
              </div>
            ) : backups.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-xs text-muted-foreground space-y-2">
                <Database className="h-6 w-6 mx-auto text-muted-foreground/50" />
                <p className="font-medium text-foreground">Aún no existen puntos de restauración guardados.</p>
                <p className="text-[11px]">Se crearán automáticamente al aplicar parches o modificar formatos HSE.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {backups.map((b) => {
                  const isLocal = 'id' in b && typeof b.id === 'string' && b.id.startsWith('local-');
                  const fecha = 'creado_en' in b ? (b as any).creado_en : (b as any).fecha;
                  const desc = (b as any).descripcion || 'Snapshot automático';
                  const tipo = (b as any).tipo_backup || (b as any).tipo;
                  const backupId = (b as any).id;

                  return (
                    <div
                      key={backupId}
                      className="rounded-lg border bg-card p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:border-primary/40 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant="secondary"
                            className="text-[10px] uppercase font-semibold px-1.5 py-0"
                          >
                            {tipo}
                          </Badge>
                          {isLocal && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1 py-0 border-amber-500/40 text-amber-600 dark:text-amber-400"
                            >
                              Local Storage
                            </Badge>
                          )}
                          <span className="text-[11px] text-muted-foreground">
                            {fecha ? new Date(fecha).toLocaleString('es-PE') : 'Fecha no registrada'}
                          </span>
                        </div>
                        <p className="font-medium text-foreground truncate">{desc}</p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRollback(backupId)}
                          disabled={isRestoringId === backupId}
                          className="h-7 text-xs gap-1.5 border-primary/30 hover:bg-primary/10 text-primary font-medium"
                        >
                          <RotateCcw className={`h-3 w-3 ${isRestoringId === backupId ? 'animate-spin' : ''}`} />
                          <span>{isRestoringId === backupId ? 'Revirtiendo...' : 'Restaurar (Rollback)'}</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
