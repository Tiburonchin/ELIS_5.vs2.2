import React, { useState, useCallback } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';

export interface CropCanvasProps {
  imageSrc: string;
  onCropComplete: (croppedAreaPixels: Area, croppedImageBlob: Blob) => void;
  onCancel?: () => void;
  aspectRatio?: number;
}

/**
 * Genera un Blob de imagen recortada usando HTML5 Canvas a partir del área de píxeles
 */
export async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Necesario para imágenes de Supabase Storage
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No se pudo obtener el contexto 2D del Canvas');
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('El canvas no generó un blob'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}

export const CropCanvas: React.FC<CropCanvasProps> = ({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 3 / 2, // Relación de aspecto estándar para credenciales / fotochecks horizontales
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    try {
      setIsProcessing(true);
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedAreaPixels, blob);
    } catch (err) {
      console.error('[CropCanvas] Error recortando imagen:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Contenedor react-easy-crop */}
      <div className="relative w-full h-[360px] sm:h-[420px] bg-slate-950 rounded-xl overflow-hidden select-none">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onCropComplete={handleCropComplete}
          onZoomChange={setZoom}
          classes={{
            containerClassName: 'relative w-full h-full',
            cropAreaClassName: 'border-2 border-amber-400 shadow-xl rounded-md',
          }}
        />
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50 text-[11px] text-slate-300">
          Ajusta el recuadro sobre el fotocheck o credencial
        </div>
      </div>

      {/* Control de Zoom y Acciones */}
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-center gap-3 px-2">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Zoom:</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
            aria-label="Ajustar zoom"
          />
          <span className="text-xs text-slate-500 font-mono w-8 text-right">{zoom.toFixed(1)}x</span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!croppedAreaPixels || isProcessing}
            className="px-5 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Confirmar Recorte</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropCanvas;
