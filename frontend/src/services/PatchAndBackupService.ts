import { BaseSupabaseService } from './BaseSupabaseService';
import { supabase } from '../lib/supabaseClient';
import type { Database, Json } from '../types/database.types';

export type BackupSistemaRow = Database['public']['Tables']['backups_sistema']['Row'];
export type BackupSistemaInsert = Database['public']['Tables']['backups_sistema']['Insert'];

export type TipoBackup = 'PRE_PARCHE_APP' | 'PRE_SOBRESCRITURA_ACTIVIDAD' | 'MANUAL_COMPLETO' | 'PARCHE_DATOS';
export type ModoParche = 'MERGE' | 'OVERWRITE';

export interface LocalDraftBackup {
  id: string;
  tipo: TipoBackup;
  fecha: string;
  version_app: string;
  descripcion: string;
  data: Record<string, unknown>;
  checksum_sha256?: string;
}

export interface ElisPatchFile {
  format: 'ELIS_PATCH';
  version: string;
  tipo_contenido: 'ACTIVIDAD' | 'CHECKLIST_PLANTILLA' | 'DATOS_HSE';
  actividad_id?: string;
  codigo_referencia?: string;
  timestamp: string;
  parche_json: Record<string, unknown>;
  hash_integridad: string;
}

export interface ElisBackupFile {
  format: 'ELIS_BACKUP_COMPLETO';
  version: string;
  timestamp: string;
  tipo_backup: TipoBackup;
  backups: BackupSistemaRow[] | LocalDraftBackup[];
  borradores_locales?: Record<string, unknown>;
}

export const CURRENT_APP_VERSION = '5.0.0';
const LOCAL_STORAGE_BACKUPS_KEY = 'elis_local_safety_backups';
const LOCAL_STORAGE_DRAFT_PREFIX = 'elis_draft_';

/**
 * Calcula hash criptográfico SHA-256 en cliente usando Web Crypto API
 */
export async function calculateDataSha256(data: unknown): Promise<string> {
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  const encoder = new TextEncoder();
  const buffer = encoder.encode(jsonStr);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class PatchAndBackupService extends BaseSupabaseService<
  BackupSistemaRow,
  BackupSistemaInsert
> {
  constructor() {
    super('backups_sistema');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. BACKUPS PREVENTIVOS AUTOMÁTICOS ("Por si acaso")
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Crea un respaldo preventivo de seguridad.
   * Guarda de forma dual: en localStorage (resiliencia offline) y en public.backups_sistema (Supabase).
   */
  async createSafetyBackup(
    tipo: TipoBackup,
    entidadId?: string | null,
    snapshotData?: Record<string, unknown>,
    descripcionCustom?: string
  ): Promise<{ localSuccess: boolean; cloudSuccess: boolean; backupId?: string; hash: string }> {
    const timestamp = new Date().toISOString();
    
    // Si no se proporcionó snapshot, recopilar todos los borradores locales
    let dataToSave = snapshotData;
    if (!dataToSave) {
      dataToSave = this.collectLocalDrafts();
    }

    const hash = await calculateDataSha256(dataToSave);
    const desc = descripcionCustom || `Respaldo automático de seguridad (${tipo}) en versión ${CURRENT_APP_VERSION}`;

    // 1. Guardar en almacenamiento local (siempre disponible)
    let localSuccess = false;
    try {
      const localBackup: LocalDraftBackup = {
        id: `local-${Date.now()}`,
        tipo,
        fecha: timestamp,
        version_app: CURRENT_APP_VERSION,
        descripcion: desc,
        data: dataToSave,
        checksum_sha256: hash,
      };

      const existingRaw = localStorage.getItem(LOCAL_STORAGE_BACKUPS_KEY);
      const list: LocalDraftBackup[] = existingRaw ? JSON.parse(existingRaw) : [];
      // Mantener los últimos 20 respaldos locales
      const updated = [localBackup, ...list].slice(0, 20);
      localStorage.setItem(LOCAL_STORAGE_BACKUPS_KEY, JSON.stringify(updated));
      localSuccess = true;
    } catch (localErr) {
      console.warn('[PatchAndBackupService] Error guardando respaldo local:', localErr);
    }

    // 2. Guardar en Supabase Cloud (si hay red y sesión)
    let cloudSuccess = false;
    let cloudBackupId: string | undefined;

    try {
      const userId = await this.getCurrentUserId();
      const { data, error } = await supabase
        .from('backups_sistema')
        .insert({
          tipo_backup: tipo,
          entidad_id: entidadId || null,
          version_app: CURRENT_APP_VERSION,
          descripcion: desc,
          snapshot_json: dataToSave as Json,
          hash_integridad: hash,
          creado_por: userId || null,
        })
        .select('id')
        .single();

      if (!error && data) {
        cloudSuccess = true;
        cloudBackupId = data.id;
      }
    } catch (cloudErr) {
      console.info('[PatchAndBackupService] Respaldo remoto no completado (modo offline activo):', cloudErr);
    }

    return {
      localSuccess,
      cloudSuccess,
      backupId: cloudBackupId,
      hash,
    };
  }

  /**
   * Recopila todos los borradores locales guardados en localStorage
   */
  collectLocalDrafts(): Record<string, unknown> {
    const drafts: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(LOCAL_STORAGE_DRAFT_PREFIX) || key.startsWith('f120_') || key.startsWith('f128_'))) {
        try {
          const val = localStorage.getItem(key);
          drafts[key] = val ? JSON.parse(val) : val;
        } catch {
          drafts[key] = localStorage.getItem(key);
        }
      }
    }
    return drafts;
  }

  /**
   * Obtiene la lista unificada de puntos de restauración (Cloud + Local)
   */
  async getUnifiedBackupsList(entidadId?: string): Promise<Array<LocalDraftBackup | BackupSistemaRow>> {
    const list: Array<LocalDraftBackup | BackupSistemaRow> = [];

    // 1. Obtener de Supabase
    try {
      let query = supabase
        .from('backups_sistema')
        .select('*')
        .order('creado_en', { ascending: false });

      if (entidadId) {
        query = query.eq('entidad_id', entidadId);
      }

      const { data, error } = await query;
      if (!error && data) {
        list.push(...data);
      }
    } catch (e) {
      console.warn('[PatchAndBackupService] Error consultando respaldos de nube:', e);
    }

    // 2. Obtener locales
    try {
      const localRaw = localStorage.getItem(LOCAL_STORAGE_BACKUPS_KEY);
      if (localRaw) {
        const locals: LocalDraftBackup[] = JSON.parse(localRaw);
        list.push(...locals);
      }
    } catch (e) {
      console.warn('[PatchAndBackupService] Error consultando respaldos locales:', e);
    }

    return list;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. APLICACIÓN DE PARCHES CON BACKUP PREVENTIVO (RPC / Nube y Local)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Aplica un parche sobre una actividad ejecutando primero un respaldo preventivo obligatorio.
   * Soporta modo 'MERGE' (fusión diferencial) u 'OVERWRITE' (reemplazo limpio).
   */
  async applyPatchToActivity(
    actividadId: string,
    parcheJson: Record<string, unknown>,
    modo: ModoParche = 'MERGE'
  ): Promise<{ success: boolean; backupId?: string; mensaje?: string }> {
    // Respaldo preventivo local prioritario
    await this.createSafetyBackup('PRE_SOBRESCRITURA_ACTIVIDAD', actividadId, parcheJson);

    // Invocar RPC atómica en Supabase
    const { data, error } = await supabase.rpc('aplicar_parche_actividad_con_backup', {
      p_actividad_id: actividadId,
      p_parche_json: parcheJson as Json,
      p_modo: modo,
    });

    if (error) {
      console.error('[PatchAndBackupService] Error en RPC aplicar_parche_actividad_con_backup:', error);
      this.handleDatabaseError(error, `applyPatchToActivity (${actividadId})`);
    }

    const res = data as any;
    return {
      success: !!res?.success,
      backupId: res?.backup_id,
      mensaje: res?.mensaje || 'Parche aplicado exitosamente.',
    };
  }

  /**
   * Revierte el estado de una actividad a un punto de restauración previo (Rollback en 1 Clic).
   */
  async rollbackActivityBackup(backupId: string): Promise<{ success: boolean; mensaje?: string }> {
    // Si es un backup local
    if (backupId.startsWith('local-')) {
      const localRaw = localStorage.getItem(LOCAL_STORAGE_BACKUPS_KEY);
      if (localRaw) {
        const locals: LocalDraftBackup[] = JSON.parse(localRaw);
        const target = locals.find((b) => b.id === backupId);
        if (target && target.data) {
          // Restaurar borradores locales
          Object.entries(target.data).forEach(([key, value]) => {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
          });
          return {
            success: true,
            mensaje: 'Borrador local restaurado exitosamente en el navegador.',
          };
        }
      }
      throw new Error(`Punto de respaldo local ${backupId} no encontrado.`);
    }

    // Si es un backup en base de datos
    const { data, error } = await supabase.rpc('restaurar_backup_actividad', {
      p_backup_id: backupId,
    });

    if (error) {
      console.error('[PatchAndBackupService] Error en RPC restaurar_backup_actividad:', error);
      this.handleDatabaseError(error, `rollbackActivityBackup (${backupId})`);
    }

    const res = data as any;
    return {
      success: !!res?.success,
      mensaje: res?.mensaje || 'Actividad restaurada exitosamente.',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. EXPORTACIÓN E IMPORTACIÓN (.elis-patch.json / .elis-backup.json)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Genera y descarga un archivo .elis-patch.json con un parche diferencial o plantilla
   */
  async exportPatchFile(
    actividadId: string,
    codigoReferencia: string,
    parcheJson: Record<string, unknown>,
    tipoContenido: 'ACTIVIDAD' | 'CHECKLIST_PLANTILLA' | 'DATOS_HSE' = 'DATOS_HSE'
  ): Promise<void> {
    const hash = await calculateDataSha256(parcheJson);
    const patchPayload: ElisPatchFile = {
      format: 'ELIS_PATCH',
      version: CURRENT_APP_VERSION,
      tipo_contenido: tipoContenido,
      actividad_id: actividadId,
      codigo_referencia: codigoReferencia,
      timestamp: new Date().toISOString(),
      parche_json: parcheJson,
      hash_integridad: hash,
    };

    const blob = new Blob([JSON.stringify(patchPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parche_${codigoReferencia || 'actividad'}_${Date.now()}.elis-patch.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Genera y descarga una copia de seguridad integral .elis-backup.json
   */
  async exportFullBackupFile(): Promise<void> {
    // 1. Crear backup preventivo actual
    await this.createSafetyBackup('MANUAL_COMPLETO');

    // 2. Obtener lista unificada
    const backups = await this.getUnifiedBackupsList();
    const drafts = this.collectLocalDrafts();

    const backupPayload: ElisBackupFile = {
      format: 'ELIS_BACKUP_COMPLETO',
      version: CURRENT_APP_VERSION,
      timestamp: new Date().toISOString(),
      tipo_backup: 'MANUAL_COMPLETO',
      backups: backups as any,
      borradores_locales: drafts,
    };

    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_completo_elis_${new Date().toISOString().slice(0, 10)}.elis-backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Lee, valida y aplica un archivo .elis-patch.json en la base de datos y estado local.
   * Exige backup automático previo antes de realizar la sobrescritura.
   */
  async importAndApplyPatchFile(
    file: File,
    modo: ModoParche = 'MERGE',
    targetActividadId?: string
  ): Promise<{ success: boolean; hash: string; mensaje: string }> {
    const text = await file.text();
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('El archivo seleccionado no es un JSON válido.');
    }

    if (parsed.format !== 'ELIS_PATCH' || !parsed.parche_json) {
      throw new Error('El archivo no cumple con el formato estándar .elis-patch.json.');
    }

    // Validar hash de integridad
    const computedHash = await calculateDataSha256(parsed.parche_json);
    if (parsed.hash_integridad && parsed.hash_integridad !== computedHash) {
      console.warn('[PatchAndBackupService] Advertencia de hash de integridad diferente');
    }

    const actividadId = targetActividadId || parsed.actividad_id;
    if (!actividadId) {
      throw new Error('No se especificó la actividad destino para el parche.');
    }

    const result = await this.applyPatchToActivity(actividadId, parsed.parche_json, modo);

    return {
      success: result.success,
      hash: computedHash,
      mensaje: result.mensaje || 'Parche instalado con éxito.',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. MOTOR PWA HOT-PATCHING Y PURGA DE CACHÉS OBSOLETAS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verifica actualizaciones del Service Worker, realiza backup de seguridad preventivo,
   * purga cachés antiguas y activa la nueva versión sin perder el estado de trabajo del usuario.
   */
  async checkAndApplyServiceWorkerPatch(): Promise<{ updated: boolean; message: string }> {
    // Paso A: Guardar snapshot preventivo del estado de trabajo
    await this.createSafetyBackup('PRE_PARCHE_APP');

    if (!('serviceWorker' in navigator)) {
      return { updated: false, message: 'Service Worker no soportado en este entorno.' };
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return { updated: false, message: 'No hay Service Worker registrado actualmente.' };
    }

    // Forzar verificación de nuevos chunks en el servidor
    await registration.update();

    if (registration.waiting) {
      // Hay un nuevo Service Worker esperando ser activado
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Purgar cachés obsoletas de la versión anterior
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter((name) => !name.includes(CURRENT_APP_VERSION))
            .map((name) => caches.delete(name))
        );
      }

      return {
        updated: true,
        message: 'Nueva versión aplicada en caliente. Cachés obsoletas depuradas y estado protegido.',
      };
    }

    return {
      updated: false,
      message: 'La aplicación ya se encuentra actualizada en su última versión.',
    };
  }
}

export const patchAndBackupService = new PatchAndBackupService();
