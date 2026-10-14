import { describe, it, expect, vi } from 'vitest';
import { calculateSHA256, extractSafeExif } from '../utils/fileProcessor';
import exifr from 'exifr';

vi.mock('exifr', () => ({
  default: {
    parse: vi.fn(),
  },
}));

describe('fileProcessor unit tests', () => {
  describe('calculateSHA256', () => {
    it('produce siempre el mismo hash determinista para el mismo contenido', async () => {
      const content = 'ELIS Forensic Evidence System 5.0';
      const fileA = new File([content], 'sample_a.jpg', { type: 'image/jpeg' });
      const fileB = new File([content], 'sample_b.jpg', { type: 'image/jpeg' });

      const hashA = await calculateSHA256(fileA);
      const hashB = await calculateSHA256(fileB);

      expect(hashA).toBeDefined();
      expect(typeof hashA).toBe('string');
      expect(hashA.length).toBe(64); // SHA-256 en hex tiene 64 caracteres
      expect(hashA).toBe(hashB);
    });

    it('produce hashes diferentes para contenidos diferentes', async () => {
      const file1 = new File(['Contenido 1'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['Contenido 2'], 'test2.jpg', { type: 'image/jpeg' });

      const hash1 = await calculateSHA256(file1);
      const hash2 = await calculateSHA256(file2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('extractSafeExif', () => {
    it('omite y elimina cualquier coordenada GPS del resultado garantizando privacidad', async () => {
      // Simular lectura EXIF cruda que incluiría GPS si no estuviese bloqueado
      vi.mocked(exifr.parse).mockImplementation(async (_file, options: any) => {
        // Validar que la llamada a exifr configure explícitamente gps: false
        expect(options?.gps).toBe(false);
        // Validar que en pick no se incluya ninguna propiedad GPS
        if (options?.pick) {
          const hasGpsInPick = options.pick.some((prop: string) =>
            prop.toLowerCase().includes('gps') || prop.toLowerCase().includes('latitude') || prop.toLowerCase().includes('longitude')
          );
          expect(hasGpsInPick).toBe(false);
        }

        // Aunque el parser interno recibiera o retornara etiquetas adicionales de prueba:
        return {
          DateTimeOriginal: new Date('2026-10-13T12:00:00Z'),
          ExifImageWidth: 4032,
          ExifImageHeight: 3024,
          Orientation: 1,
          Make: 'Sony',
          Model: 'Alpha A7 IV',
          latitude: 4.60971,
          longitude: -74.08175,
          GPSLatitude: [4, 36, 35],
          GPSLongitude: [74, 4, 54],
          GPSAltitude: 2600,
        };
      });

      const dummyFile = new File(['fake-image-bytes'], 'forensic_photo.jpg', { type: 'image/jpeg' });
      const safeExif = await extractSafeExif(dummyFile);

      // Verificamos campos seguros permitidos
      expect(safeExif.width).toBe(4032);
      expect(safeExif.height).toBe(3024);
      expect(safeExif.orientation).toBe(1);
      expect(safeExif.make).toBe('Sony');
      expect(safeExif.model).toBe('Alpha A7 IV');
      expect(safeExif.dateTimeOriginal).toBe('2026-10-13T12:00:00.000Z');

      // Prueba crítica: Verificar ausencia total de datos de geolocalización / GPS
      expect(safeExif).not.toHaveProperty('latitude');
      expect(safeExif).not.toHaveProperty('longitude');
      expect(safeExif).not.toHaveProperty('GPSLatitude');
      expect(safeExif).not.toHaveProperty('GPSLongitude');
      expect(safeExif).not.toHaveProperty('GPSAltitude');
      expect(safeExif.gps).toBeUndefined();
      expect(safeExif.GPS).toBeUndefined();

      // Ninguna clave del objeto retornado debe contener 'gps', 'lat', o 'lon'
      const keys = Object.keys(safeExif);
      const sensitiveKeys = keys.filter(k => /gps|latitude|longitude|coords/i.test(k));
      expect(sensitiveKeys).toEqual([]);
    });

    it('retorna valores null de forma segura cuando el archivo no tiene metadatos EXIF', async () => {
      vi.mocked(exifr.parse).mockResolvedValueOnce(null);

      const emptyFile = new File(['no-exif'], 'raw.png', { type: 'image/png' });
      const safeExif = await extractSafeExif(emptyFile);

      expect(safeExif).toEqual({
        dateTimeOriginal: null,
        width: null,
        height: null,
        orientation: null,
      });
    });
  });
});
