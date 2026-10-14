import React from 'react';
import type { ActividadRow } from '@/services/ActivityService';
import type { Database } from '@/types/database.types';
import { ShieldAlert, UserCheck } from 'lucide-react';

export interface AmonestacionReportTemplateProps {
  activity: ActividadRow;
  evidences?: Array<{
    vinculo: Database['public']['Tables']['vinculos']['Row'];
    evidencia: Database['public']['Tables']['evidencias']['Row'];
    identificacion: Database['public']['Tables']['identificaciones']['Row'] | null;
  }>;
  inspectorName?: string;
  inspectorCargo?: string;
}

export const AmonestacionReportTemplate: React.FC<AmonestacionReportTemplateProps> = ({
  activity,
  evidences = [],
  inspectorName,
  inspectorCargo,
}) => {
  const datos = (activity.datos_formato_json as any) || {};
  const amonestado = datos.datos_amonestado || {};
  const supervisores = datos.supervisores_responsables || {};
  const motivo = datos.motivo_amonestacion || {};
  const nivelRiesgo = datos.nivel_riesgo || '02_BAJO';
  const accionInmediata = datos.accion_inmediata_hechos || '';
  const sancion = datos.sancion_aplicada_risst || '01_LLAMADA_ATENCION';
  const diasSuspension = datos.dias_suspension;

  return (
    <div className="bg-background text-foreground p-6 sm:p-8 max-w-4xl mx-auto border border-border shadow-sm rounded-lg print:border-none print:shadow-none print:p-0">
      {/* Membrete Oficial HSE-EL-F-128 */}
      <header className="border-b-2 border-destructive/80 pb-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-destructive text-destructive-foreground font-black text-lg shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-foreground uppercase">
                REGISTRO DE AMONESTACIÓN &bull; FORMATO HSE-EL-F-128
              </h1>
              <p className="text-xs text-muted-foreground">
                Sistema de Gestión de Seguridad, Salud en el Trabajo y Medio Ambiente (SST/HSE)
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-destructive/10 text-destructive px-2.5 py-1 rounded border border-destructive/30">
              {activity.codigo_referencia}
            </span>
            <p className="text-[10px] text-muted-foreground mt-1">
              Fecha: {new Date(activity.fecha_operacion).toLocaleDateString('es-PE')}
            </p>
          </div>
        </div>
      </header>

      {/* 1. Datos del Amonestado */}
      <section className="mb-5 border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/80 px-3 py-1.5 border-b border-border text-xs font-bold uppercase text-foreground">
          1. Datos del Trabajador Amonestado
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="font-semibold text-muted-foreground block text-[10px] uppercase">Apellidos y Nombres</span>
            <span className="font-bold text-foreground">{amonestado.apellidos_nombres || '-'}</span>
          </div>
          <div>
            <span className="font-semibold text-muted-foreground block text-[10px] uppercase">DNI / Documento</span>
            <span className="font-mono text-foreground">{amonestado.dni || '-'}</span>
          </div>
          <div>
            <span className="font-semibold text-muted-foreground block text-[10px] uppercase">Cargo / Ocupación</span>
            <span className="font-medium text-foreground">{amonestado.cargo || '-'}</span>
          </div>
          <div>
            <span className="font-semibold text-muted-foreground block text-[10px] uppercase">Empresa Contratista</span>
            <span className="font-medium text-foreground">{amonestado.empresa || '-'}</span>
          </div>
          <div>
            <span className="font-semibold text-muted-foreground block text-[10px] uppercase">Lugar / Frente</span>
            <span className="font-medium text-foreground">{amonestado.ubicacion || activity.ubicacion}</span>
          </div>
          <div>
            <span className="font-semibold text-muted-foreground block text-[10px] uppercase">Fecha y Hora</span>
            <span className="font-medium text-foreground">{amonestado.fecha_hora || activity.fecha_operacion}</span>
          </div>
        </div>
      </section>

      {/* 2. Supervisores Responsables */}
      <section className="mb-5 border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/80 px-3 py-1.5 border-b border-border text-xs font-bold uppercase text-foreground">
          2. Supervisores Responsables en el Área
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="font-semibold text-muted-foreground block text-[10px] uppercase">Capataz o Jefe de Cuadrilla</span>
            <span className="font-medium text-foreground">{supervisores.capataz_cuadrilla || '-'}</span>
          </div>
          <div>
            <span className="font-semibold text-muted-foreground block text-[10px] uppercase">Ingeniero Responsable</span>
            <span className="font-medium text-foreground">{supervisores.ingeniero_responsable || activity.responsable_nombre}</span>
          </div>
          <div>
            <span className="font-semibold text-muted-foreground block text-[10px] uppercase">Actividad en Ejecución</span>
            <span className="font-medium text-foreground">{supervisores.actividad_en_ejecucion || '-'}</span>
          </div>
        </div>
      </section>

      {/* 3. Motivo de Amonestación */}
      <section className="mb-5 border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/80 px-3 py-1.5 border-b border-border text-xs font-bold uppercase text-foreground">
          3. Motivo de Amonestación (Marcar con X según RIIST)
        </div>
        <div className="p-3 space-y-3 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { code: '01', label: 'Falta HSE (RIIST)' },
              { code: '02', label: 'Acto Subestándar' },
              { code: '03', label: 'Observación HSE' },
              { code: '04', label: 'Condición Subestándar' },
            ].map((m) => {
              const isChecked = motivo.codigo_motivo === m.code;
              return (
                <div
                  key={m.code}
                  className={`flex items-center gap-2 p-2 rounded border ${
                    isChecked
                      ? 'border-destructive bg-destructive/10 font-bold text-destructive'
                      : 'border-border/60 text-muted-foreground'
                  }`}
                >
                  <span className="font-mono text-xs">{isChecked ? '[X]' : '[ ]'}</span>
                  <span>{m.code}. {m.label}</span>
                </div>
              );
            })}
          </div>

          <div>
            <span className="font-semibold text-muted-foreground block text-[10px] uppercase mb-1">
              Detalle y Relato de los Hechos:
            </span>
            <p className="p-2.5 rounded bg-muted/20 border border-border/50 text-foreground text-xs leading-relaxed">
              {motivo.detalle_motivo || activity.descripcion || 'Sin detalle especificado.'}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Nivel de Riesgo y Acción Inmediata */}
      <section className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/80 px-3 py-1.5 border-b border-border font-bold uppercase text-foreground">
            4. Nivel de Riesgo Evaluado
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {[
              { id: '01_INTOLERABLE', label: '01. Intolerable' },
              { id: '02_BAJO', label: '02. Bajo' },
              { id: '03_MODERADO', label: '03. Moderado' },
              { id: '04_OTRO', label: '04. Otro' },
            ].map((r) => {
              const isSelected = nivelRiesgo === r.id;
              return (
                <div
                  key={r.id}
                  className={`p-1.5 rounded border text-center ${
                    isSelected
                      ? 'border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold'
                      : 'border-border/50 text-muted-foreground'
                  }`}
                >
                  {isSelected ? `● ${r.label}` : `○ ${r.label}`}
                </div>
              );
            })}
          </div>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/80 px-3 py-1.5 border-b border-border font-bold uppercase text-foreground">
            5. Acción Inmediata Adoptada en el Sitio
          </div>
          <div className="p-3">
            <p className="text-foreground text-xs italic bg-muted/20 p-2 rounded min-h-[48px]">
              {accionInmediata || 'Corrección in situ y sensibilización preventiva.'}
            </p>
          </div>
        </div>
      </section>

      {/* 6. Sanción Aplicada según RISST */}
      <section className="mb-6 border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/80 px-3 py-1.5 border-b border-border text-xs font-bold uppercase text-foreground">
          6. Sanción Aplicada según Reglamento Interno de Seguridad y Salud (RISST)
        </div>
        <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {[
            { id: '01_LLAMADA_ATENCION', label: '01. Llamada de Atención' },
            { id: '02_SUSPENSION', label: `02. Suspensión (${diasSuspension || 1} días)` },
            { id: '03_RETIRO_INMEDIATO', label: '03. Retiro del Trabajador' },
            { id: '04_OTRO', label: '04. Otra Medida' },
          ].map((s) => {
            const isSelected = sancion === s.id;
            return (
              <div
                key={s.id}
                className={`p-2 rounded border text-center font-medium ${
                  isSelected
                    ? 'border-destructive bg-destructive/10 text-destructive font-bold'
                    : 'border-border/50 text-muted-foreground'
                }`}
              >
                {isSelected ? `[X] ${s.label}` : `[ ] ${s.label}`}
              </div>
            );
          })}
        </div>
      </section>

      {/* Evidencias Vinculadas de la Infracción */}
      {evidences.length > 0 && (
        <section className="mb-6 border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/80 px-3 py-1.5 border-b border-border text-xs font-bold uppercase text-foreground">
            Evidencias Fotográficas de la Infracción ({evidences.length})
          </div>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {evidences.map(({ evidencia, identificacion }) => (
              <div key={evidencia.id} className="p-2.5 rounded border border-border bg-card space-y-1">
                <span className="font-semibold text-foreground truncate block">
                  {evidencia.nombre_archivo}
                </span>
                <span className="font-mono text-[9px] text-muted-foreground break-all block">
                  SHA-256: {evidencia.hash_sha256}
                </span>
                {identificacion && (
                  <p className="text-[11px] text-primary font-medium flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Infractor Confirmado: {identificacion.nombres} {identificacion.apellido_paterno}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Firmas de Validación Oficial */}
      <footer className="pt-8 mt-6 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
        <div>
          <div className="h-14 border-b border-foreground/40 mb-2 flex items-end justify-center pb-1">
            <span className="font-serif italic text-muted-foreground text-sm">Realizado por</span>
          </div>
          <p className="font-bold text-foreground">{inspectorName || activity.responsable_nombre}</p>
          <p className="text-[10px] text-muted-foreground uppercase">{inspectorCargo || 'Inspector HSE / SST'}</p>
        </div>

        <div>
          <div className="h-14 border-b border-foreground/40 mb-2 flex items-end justify-center pb-1">
            <span className="font-serif italic text-muted-foreground text-sm">Aprobado por</span>
          </div>
          <p className="font-bold text-foreground">Ing. Jefe de HSE / Residencia</p>
          <p className="text-[10px] text-muted-foreground uppercase">Aprobación Técnica</p>
        </div>

        <div>
          <div className="h-14 border-b border-foreground/40 mb-2 flex items-end justify-center pb-1">
            <span className="font-serif italic text-muted-foreground text-sm">Aceptado por</span>
          </div>
          <p className="font-bold text-foreground">{amonestado.apellidos_nombres || 'Trabajador Notificado'}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Firma del Trabajador</p>
        </div>
      </footer>
    </div>
  );
};

export default AmonestacionReportTemplate;
