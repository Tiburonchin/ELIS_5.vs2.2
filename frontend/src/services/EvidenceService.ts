import { BaseSupabaseService } from './BaseSupabaseService';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/database.types';
import { processFileForIngestion } from '../utils/fileProcessor';

export type EvidenciaRow = Database['public']['Tables']['evidencias']['Row'];
export type EvidenciaInsert = Database['public']['Tables']['evidencias']['Insert'];
export type EvidenciaUpdate = Database['public']['Tables']['evidencias']['Update'];

export interface UploadEvidenceResult {
  isDuplicate: boolean;
  evidence: EvidenciaRow;
  hash: string;
}

export class EvidenceService extends BaseSupabaseService<
  EvidenciaRow,
  EvidenciaInsert,
  EvidenciaUpdate
> {
  constructor() {
    super('evidencias');
  }

  /**
   * Busca si existe una evidencia previamente registrada por su hash SHA-256
   */
  async getByHash(hash: string): Promise<EvidenciaRow | null> {
    try {
      const { data, error } = await supabase
        .from('evidencias')
        .select('*')
        .eq('hash_sha256', hash)
        .maybeSingle();

      if (error) {
        this.handleDatabaseError(error, `getByHash (${hash})`);
      }

      return data as EvidenciaRow | null;
    } catch (error) {
      console.error('[EvidenceService] Error buscando por hash:', error);
      throw error;
    }
  }

  /**
   * Obtiene evidencias filtradas por estado (pendiente, vinculada, archivada, error)
   */
  async getByEstado(estado: 'pendiente' | 'vinculada' | 'archivada' | 'error'): Promise<EvidenciaRow[]> {
    try {
      const { data, error } = await supabase
        .from('evidencias')
        .select('*')
        .eq('estado', estado)
        .order('fecha_ingesta', { ascending: false });

      if (error) {
        this.handleDatabaseError(error, `getByEstado (${estado})`);
      }

      return (data as EvidenciaRow[]) || [];
    } catch (error) {
      console.error(`[EvidenceService] Error obteniendo evidencias por estado (${estado}):`, error);
      throw error;
    }
  }

  /**
   * Procesa, valida duplicados criptográficos, sube a Supabase Storage y registra en la BD.
   * Asigna explícitamente subido_por = auth.uid() para garantizar el cumplimiento de políticas RLS.
   */
  async uploadAndRegisterEvidence(
    file: File,
    bucketName: string = 'evidencias'
  ): Promise<UploadEvidenceResult> {
    // 1. Procesamiento en cliente: Hash SHA-256, EXIF sanitizado (sin GPS) y miniatura WebP
    const { hashSHA256, safeExif, thumbnailFile } = await processFileForIngestion(file);

    // 2. Validación de duplicados mediante getByHash
    const existing = await this.getByHash(hashSHA256);
    if (existing) {
      console.warn(`[EvidenceService] Evidencia con hash ${hashSHA256} ya existe en Supabase.`);
      return {
        isDuplicate: true,
        evidence: existing,
        hash: hashSHA256,
      };
    }

    // 3. Captura del ID de usuario autenticado activo
    const currentUserId = await this.getCurrentUserId();

    // 4. Preparación de rutas en Storage
    const ext = file.name.split('.').pop() || 'jpg';
    const originalStoragePath = `originals/${hashSHA256}.${ext}`;
    const thumbStoragePath = `thumbs/${hashSHA256}_thumb.webp`;

    // 5. Subida del archivo original
    const { error: uploadOriginalError } = await supabase.storage
      .from(bucketName)
      .upload(originalStoragePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadOriginalError) {
      console.error('[EvidenceService] Error subiendo archivo original a Storage:', uploadOriginalError);
      throw uploadOriginalError;
    }

    // 6. Subida de la miniatura WebP
    const { error: uploadThumbError } = await supabase.storage
      .from(bucketName)
      .upload(thumbStoragePath, thumbnailFile, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (uploadThumbError) {
      console.warn('[EvidenceService] Advertencia al subir miniatura:', uploadThumbError);
    }

    // 7. Registro en la base de datos (public.evidencias) con subido_por = auth.uid()
    const newRecord: EvidenciaInsert = {
      nombre_archivo: file.name,
      ruta_storage: originalStoragePath,
      ruta_thumb: uploadThumbError ? null : thumbStoragePath,
      hash_sha256: hashSHA256,
      tamano_bytes: file.size,
      mime_type: file.type,
      fecha_captura: safeExif.dateTimeOriginal,
      estado: 'pendiente',
      metadatos_json: {
        safe_exif: safeExif,
      },
      subido_por: currentUserId ?? null,
    };

    const evidence = await this.create(newRecord);

    return {
      isDuplicate: false,
      evidence,
      hash: hashSHA256,
    };
  }

  /**
   * Limpia rutas de storage eliminando prefijos redundantes o slash iniciales:
   * ej: 'evidencias/originals/...' -> 'originals/...'
   */
  static cleanStoragePath(path: string | null | undefined): string {
    if (!path) return '';
    let cleaned = path.trim().replace(/^\/+/, '');
    if (cleaned.startsWith('evidencias/')) {
      cleaned = cleaned.replace(/^evidencias\//, '');
    }
    return cleaned;
  }

  /**
   * Resuelve de forma dual y resiliente la URL de la imagen de una evidencia.
   * - Limpia rutas con prefijo duplicado 'evidencias/'.
   * - Soporta Signed URLs (si el bucket es privado) y getPublicUrl directo.
   * - Permite elegir entre 'thumb' (con fallback a original) u 'original'.
   */
  async getEvidenceImageUrl(
    evidence: Pick<EvidenciaRow, 'ruta_storage' | 'ruta_thumb'>,
    options: {
      type?: 'thumb' | 'original';
      expiresIn?: number;
      bucketName?: string;
    } = {}
  ): Promise<string> {
    const { type = 'thumb', expiresIn = 3600, bucketName = 'evidencias' } = options;
    const cleanStorage = EvidenceService.cleanStoragePath(evidence.ruta_storage);
    const cleanThumb = EvidenceService.cleanStoragePath(evidence.ruta_thumb);

    const primaryPath = type === 'thumb' ? (cleanThumb || cleanStorage) : (cleanStorage || cleanThumb);
    if (!primaryPath) return '';

    try {
      // Intentar obtener Signed URL (ideal para buckets privados con regla :ro)
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(primaryPath, expiresIn);

      if (!signedError && signedData?.signedUrl) {
        return signedData.signedUrl;
      }
    } catch {
      // Ignorar error de signed URL y recurrir a getPublicUrl
    }

    // Fallback a getPublicUrl si el bucket es público o no soporta signed url anónima
    const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(primaryPath);
    return publicData?.publicUrl || '';
  }

  /**
   * Resuelve URLs en lote para un conjunto de evidencias con optimización y fallback
   */
  async getEvidenceBatchImageUrls(
    evidences: Array<Pick<EvidenciaRow, 'id' | 'ruta_storage' | 'ruta_thumb'>>,
    options: {
      type?: 'thumb' | 'original';
      expiresIn?: number;
      bucketName?: string;
    } = {}
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    const { type = 'thumb', expiresIn = 3600, bucketName = 'evidencias' } = options;

    await Promise.all(
      evidences.map(async (ev) => {
        try {
          const url = await this.getEvidenceImageUrl(ev, { type, expiresIn, bucketName });
          if (url) results[ev.id] = url;
        } catch (e) {
          console.warn(`[EvidenceService] No se pudo resolver URL para evidencia ${ev.id}:`, e);
        }
      })
    );

    return results;
  }
}

export const evidenceService = new EvidenceService();

