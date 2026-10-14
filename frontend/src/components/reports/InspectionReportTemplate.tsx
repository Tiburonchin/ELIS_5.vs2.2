import React from 'react';
import type { ActividadRow } from '@/services/ActivityService';
import type { Database } from '@/types/database.types';
import { ShieldCheck, CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';

export interface InspectionReportTemplateProps {
  activity: ActividadRow;
  evidences?: Array<{
    vinculo: Database['public']['Tables']['vinculos']['Row'];
    evidencia: Database['public']['Tables']['evidencias']['Row'];
    identificacion: Database['public']['Tables']['identificaciones']['Row'] | null;
  }>;
  inspectorName?: string;
  inspectorCargo?: string;
}

export const SECCIONES_CHECKLIST_HSE = [
  { id: 1, nombre: 'Instalaciones, Estructura y Almacén' },
  { id: 2, nombre: 'Herramientas Manuales y Eléctricas' },
  { id: 3, nombre: 'Escaleras, Andamios y Plataformas' },
  { id: 4, nombre: 'Equipos de Protección Personal (EPP)' },
  { id: 5, nombre: 'Orden, Limpieza y Segregación' },
  { id: 6, nombre: 'Instalaciones y Tableros Eléctricos' },
  { id: 7, nombre: 'Protección Contra Incendios y Extintores' },
  { id: 8, nombre: 'Productos Químicos y Hojas MSDS' },
  { id: 9, nombre: 'Procedimientos de Trabajo Seguro (PETS/AST)' },
  { id: 10, nombre: 'Ergonomía y Manipulación de Cargas' },
  { id: 11, nombre: 'Medio Ambiente y Manejo de Residuos' },
  { id: 12, nombre: 'Vehículos y Maquinaria Pesada' },
  { id: 13, nombre: 'Primeros Auxilios y Emergencias' },
  { id: 14, nombre: 'Capacitación y Charlas de Seguridad' },
  { id: 15, nombre: 'Comportamiento y Observación Preventiva' },
];

export const InspectionReportTemplate: React.FC<InspectionReportTemplateProps> = ({
  activity,
  evidences = [],
  inspectorName,
  inspectorCargo,
}) => {
  const datosJson = (activity.datos_formato_json as any) || {};
  const itemsGuardados: Record<string, { calificacion: 'S' | 'ER' | 'PI' | 'NA'; observacion?: string }> =
    datosJson.items_evaluados || {};

  const getBadgeIcon = (calif?: string) => {
    switch (calif) {
      case 'S':
        return <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded text-[11px]"><CheckCircle2 className="w-3.5 h-3.5" /> S</span>;
      case 'ER':
        return <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded text-[11px]"><AlertTriangle className="w-3.5 h-3.5" /> ER</span>;
      case 'PI':
        return <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 px-2 py-0.5 rounded text-[11px]"><AlertOctagon className="w-3.5 h-3.5" /> PI</span>;
      case 'NA':
        return <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded text-[11px]"><HelpCircle className="w-3.5 h-3.5" /> NA</span>;
      default:
        return <span className="text-muted-foreground text-xs italic">Sin calificar</span>;
    }
  };

  return (
    <div className="bg-background text-foreground p-6 sm:p-8 max-w-4xl mx-auto border border-border shadow-sm rounded-lg print:border-none print:shadow-none print:p-0">
      {/* Membrete Corporativo */}
      <header className="border-b-2 border-primary/80 pb-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-xl shadow-xs">
              E
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-foreground uppercase">
                ELIS 5.0 &bull; REPORTE DE INSPECCIÓN HSE
              </h1>
              <p className="text-xs text-muted-foreground">
                Checklist Normativo de Supervisión de Seguridad y Salud en el Trabajo (15 Secciones)
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-muted px-2.5 py-1 rounded border border-border">
              {activity.codigo_referencia}
            </span>
            <p className="text-[10px] text-muted-foreground mt-1">
              Fecha: {new Date(activity.fecha_operacion).toLocaleDateString('es-PE')}
            </p>
          </div>
        </div>
      </header>

      {/* Metadatos de la Actividad */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/30 border border-border/60 mb-6 text-xs">
        <div>
          <span className="font-semibold text-muted-foreground block text-[10px] uppercase">Ubicación / Frente</span>
          <span className="font-medium text-foreground">{activity.ubicacion}</span>
        </div>
        <div>
          <span className="font-semibold text-muted-foreground block text-[10px] uppercase">Responsable Operativo</span>
          <span className="font-medium text-foreground">{activity.responsable_nombre}</span>
        </div>
        <div>
          <span className="font-semibold text-muted-foreground block text-[10px] uppercase">Estado Reporte</span>
          <span className="font-medium text-foreground capitalize">{activity.estado_reporte}</span>
        </div>
        <div>
          <span className="font-semibold text-muted-foreground block text-[10px] uppercase">Evidencias Vinculadas</span>
          <span className="font-medium text-foreground">{evidences.length} registro(s)</span>
        </div>
      </section>

      {activity.descripcion && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Resumen General de la Inspección
          </h2>
          <p className="text-xs text-foreground bg-muted/20 p-3 rounded border border-border/40">
            {activity.descripcion}
          </p>
        </section>
      )}

      {/* Tabla del Checklist de 15 Secciones */}
      <section className="mb-8">
        <h2 className="text-sm font-bold tracking-tight text-foreground uppercase mb-3 flex items-center gap-2">
          <span>Evaluación de Secciones Normativas</span>
          <span className="text-[10px] font-normal text-muted-foreground lowercase">
            (S: Seguro, ER: En Riesgo, PI: Peligro Inminente, NA: No Aplica)
          </span>
        </h2>

        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/80 text-foreground font-semibold border-b border-border">
              <tr>
                <th className="py-2 px-3 w-12 text-center">N°</th>
                <th className="py-2 px-3">Área / Sección Normativa</th>
                <th className="py-2 px-3 w-36 text-center">Calificación</th>
                <th className="py-2 px-3">Observaciones / Medidas Inmediatas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {SECCIONES_CHECKLIST_HSE.map((sec) => {
                const itemData = itemsGuardados[`sec_${sec.id}`] || {};
                return (
                  <tr key={sec.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2 px-3 text-center font-mono font-medium text-muted-foreground">
                      {sec.id.toString().padStart(2, '0')}
                    </td>
                    <td className="py-2 px-3 font-medium text-foreground">
                      {sec.nombre}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {getBadgeIcon(itemData.calificacion)}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground italic">
                      {itemData.observacion || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Evidencias Fotográficas Vinculadas */}
      {evidences.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold tracking-tight text-foreground uppercase mb-3">
            Evidencias Fotográficas y Verificación Forense
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {evidences.map(({ evidencia, identificacion }) => (
              <div
                key={evidencia.id}
                className="p-3 border border-border/80 rounded-lg bg-card space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] truncate max-w-[200px] text-muted-foreground">
                    {evidencia.nombre_archivo}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                    <ShieldCheck className="w-3 h-3" /> SHA-256
                  </span>
                </div>
                <div className="p-2 bg-muted/40 rounded font-mono text-[9px] break-all text-muted-foreground">
                  {evidencia.hash_sha256}
                </div>
                {identificacion && (
                  <div className="text-[11px] pt-1 border-t border-border/40">
                    <span className="font-semibold text-foreground">Personal Identificado: </span>
                    <span>
                      {identificacion.nombres} {identificacion.apellido_paterno} {identificacion.apellido_materno}
                    </span>
                    {identificacion.cargo && (
                      <span className="text-muted-foreground"> ({identificacion.cargo})</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Firmas de Conformidad */}
      <footer className="pt-8 mt-8 border-t border-border grid grid-cols-2 gap-8 text-center text-xs">
        <div>
          <div className="h-14 border-b border-foreground/40 mb-2 flex items-end justify-center pb-1">
            <span className="font-serif italic text-muted-foreground text-sm">Firma del Inspector</span>
          </div>
          <p className="font-bold text-foreground">{inspectorName || activity.responsable_nombre}</p>
          <p className="text-[11px] text-muted-foreground">{inspectorCargo || 'Inspector HSE / SST'}</p>
        </div>

        <div>
          <div className="h-14 border-b border-foreground/40 mb-2 flex items-end justify-center pb-1">
            <span className="font-serif italic text-muted-foreground text-sm">Firma del Residente</span>
          </div>
          <p className="font-bold text-foreground">Ing. Residente de Obra / Frente</p>
          <p className="text-[11px] text-muted-foreground">Supervisor de Operaciones</p>
        </div>
      </footer>
    </div>
  );
};

export default InspectionReportTemplate;
