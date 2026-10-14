import exifr from 'exifr';
import imageCompression from 'browser-image-compression';

export interface SafeExifData {
  dateTimeOriginal: string | null;
  width: number | null;
  height: number | null;
  orientation: number | null;
  model?: string | null;
  make?: string | null;
  [key: string]: string | number | null | undefined;
}

export interface ProcessedFileData {
  file: File;
  hashSHA256: string;
  safeExif: SafeExifData;
  thumbnailFile: File;
}

/**
 * Calcula el hash SHA-256 de un archivo en el navegador usando exclusivamente la Web Crypto API nativa.
 */
export async function calculateSHA256(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Extrae metadatos EXIF seguros y útiles (DateTimeOriginal, dimensiones)
 * descartando expresamente coordenadas GPS por privacidad.
 */
export async function extractSafeExif(file: File): Promise<SafeExifData> {
  try {
    // Solo leemos tags específicos no sensibles, bloqueando expresamente GPS
    const parsed = await exifr.parse(file, {
      pick: ['DateTimeOriginal', 'CreateDate', 'ExifImageWidth', 'ExifImageHeight', 'Orientation', 'Make', 'Model'],
      gps: false,
    });

    if (!parsed) {
      return {
        dateTimeOriginal: null,
        width: null,
        height: null,
        orientation: null,
      };
    }

    const dateVal = parsed.DateTimeOriginal || parsed.CreateDate;
    const isoDate = dateVal instanceof Date ? dateVal.toISOString() : (dateVal ? String(dateVal) : null);

    return {
      dateTimeOriginal: isoDate,
      width: parsed.ExifImageWidth ? Number(parsed.ExifImageWidth) : null,
      height: parsed.ExifImageHeight ? Number(parsed.ExifImageHeight) : null,
      orientation: parsed.Orientation ? Number(parsed.Orientation) : null,
      make: parsed.Make ? String(parsed.Make) : null,
      model: parsed.Model ? String(parsed.Model) : null,
    };
  } catch (err) {
    console.warn('[fileProcessor] No se pudo leer EXIF del archivo (o formato no soportado):', err);
    return {
      dateTimeOriginal: null,
      width: null,
      height: null,
      orientation: null,
    };
  }
}

/**
 * Genera una miniatura ligera en formato WebP usando browser-image-compression.
 */
export async function generateThumbnailWebP(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.15, // ~150KB max para thumbnail
    maxWidthOrHeight: 400,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.8,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    const thumbName = `${file.name.substring(0, file.name.lastIndexOf('.')) || file.name}_thumb.webp`;
    return new File([compressedBlob], thumbName, { type: 'image/webp' });
  } catch (err) {
    console.error('[fileProcessor] Error al generar thumbnail WebP:', err);
    throw err;
  }
}

/**
 * Procesa integralmente un archivo: SHA-256 + EXIF seguro + Thumbnail WebP
 */
export async function processFileForIngestion(file: File): Promise<ProcessedFileData> {
  const [hashSHA256, safeExif, thumbnailFile] = await Promise.all([
    calculateSHA256(file),
    extractSafeExif(file),
    generateThumbnailWebP(file),
  ]);

  return {
    file,
    hashSHA256,
    safeExif,
    thumbnailFile,
  };
}
