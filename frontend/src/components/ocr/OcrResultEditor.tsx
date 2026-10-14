import React, { useState } from 'react';
import type { OcrExtractedData } from '../../utils/ocrClient';
import { ocrService, type IdentificacionRow } from '../../services/OcrService';

export interface OcrResultEditorProps {
  evidenciaId: string;
  initialData: OcrExtractedData;
  croppedImagePreviewUrl?: string;
  onSaved: (identificacion: IdentificacionRow) => void;
  onCancel?: () => void;
}

export const OcrResultEditor: React.FC<OcrResultEditorProps> = ({
  evidenciaId,
  initialData,
  croppedImagePreviewUrl,
  onSaved,
  onCancel,
}) => {
  const [nombres, setNombres] = useState<string>(initialData.nombres);
  const [apellidoPaterno, setApellidoPaterno] = useState<string>(initialData.apellido_paterno);
  const [apellidoMaterno, setApellidoMaterno] = useState<string>(initialData.apellido_materno);
  const [cargo, setCargo] = useState<string>(initialData.cargo);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Sanitización de inputs: remover etiquetas HTML/scripts y caracteres de control (preservando saltos de línea \n)
    const sanitizeText = (val: string): string =>
      val
        .replace(/<[^>]*>?/gm, '') // Remover etiquetas HTML/Script
        .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '') // Remover caracteres de control preservando saltos de línea (\n = \x0A)
        .trim();

    const cleanNombres = sanitizeText(nombres);
    const cleanApellidoP = sanitizeText(apellidoPaterno);
    const cleanApellidoM = sanitizeText(apellidoMaterno);
    const cleanCargo = sanitizeText(cargo);

    if (!cleanNombres || !cleanApellidoP || !cleanApellidoM) {
      setErrorMessage('Nombres, apellido paterno y apellido materno son requeridos y deben ser válidos.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const saved = await ocrService.saveHumanValidation({
        evidencia_id: evidenciaId,
        nombres: cleanNombres,
        apellido_paterno: cleanApellidoP,
        apellido_materno: cleanApellidoM,
        cargo: cleanCargo || null,
        nivel_confianza: typeof initialData.nivel_confianza === 'number' ? Math.max(0, Math.min(100, initialData.nivel_confianza)) : null,
        texto_crudo_ocr: initialData.texto_crudo_ocr ? sanitizeText(initialData.texto_crudo_ocr) : null,
      });

      onSaved(saved);
    } catch (err: unknown) {
      console.error('[OcrResultEditor] Error al guardar validación humana:', err);
      const msg = err instanceof Error ? err.message : 'Error inesperado al guardar la validación.';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Vista previa del recorte y texto crudo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
        {croppedImagePreviewUrl && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Recorte Analizado
            </span>
            <div className="h-32 bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={croppedImagePreviewUrl}
                alt="Recorte del fotocheck"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Texto OCR Crudo
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
              Confianza: {initialData.nivel_confianza}%
            </span>
          </div>
          <div className="h-32 p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg overflow-y-auto text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
            {initialData.texto_crudo_ocr || '(No se detectó texto legíble)'}
          </div>
        </div>
      </div>

      {/* Alerta explicativa Human-in-the-loop */}
      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl flex items-start gap-2.5">
        <svg
          className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong>Validación Humana Obligatoria:</strong> Revisa y corrige los campos autocompletados
          antes de confirmar. Al guardar, quedará registrado tu usuario como validador responsable.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-xs">
          {errorMessage}
        </div>
      )}

      {/* Formulario editable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Apellido Paterno *
          </label>
          <input
            type="text"
            required
            value={apellidoPaterno}
            onChange={(e) => setApellidoPaterno(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-slate-100"
            placeholder="Paterno"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Apellido Materno *
          </label>
          <input
            type="text"
            required
            value={apellidoMaterno}
            onChange={(e) => setApellidoMaterno(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-slate-100"
            placeholder="Materno"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Nombres *
          </label>
          <input
            type="text"
            required
            value={nombres}
            onChange={(e) => setNombres(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-slate-100"
            placeholder="Nombres completos"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Cargo / Especialidad
          </label>
          <input
            type="text"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-slate-100"
            placeholder="Ej. Operador de Volquete"
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Confirmar y Guardar</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default OcrResultEditor;
