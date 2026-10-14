import React from 'react';
import { cn } from '@/lib/utils';
import { Mic, Volume2, Sparkles } from 'lucide-react';

export type DataNodeOrbState = 'idle' | 'listening' | 'speaking';

export interface DataNodeOrbProps {
  state?: DataNodeOrbState;
  className?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Componente visual interactivo y reactivo <DataNodeOrb />
 * Representa el estado del asistente de voz / nodo inteligente de datos.
 * Estados:
 * - 'idle': Estado en reposo, resplandor cian/azul neutro sutil.
 * - 'listening': Estado de captura activa de voz (micrófono abierto), pulso rítmico esmeralda/verde.
 * - 'speaking': Estado de síntesis o respuesta vocal/procesamiento, oscilación violeta/ámbar vibrante.
 */
export const DataNodeOrb: React.FC<DataNodeOrbProps> = ({
  state = 'idle',
  className,
  onClick,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-9 h-9',
  }[size];

  // Configuración de estilo y animación según el estado
  const stateStyles = {
    idle: {
      container: 'border-cyan-500/30 bg-cyan-950/40 text-cyan-400 shadow-cyan-500/20 state-idle',
      glow: 'bg-cyan-500/20 animate-pulse',
      icon: Sparkles,
      label: 'En espera',
    },
    listening: {
      container: 'border-emerald-500/60 bg-emerald-950/60 text-emerald-400 shadow-emerald-500/40 animate-pulse state-listening',
      glow: 'bg-emerald-500/40 animate-ping',
      icon: Mic,
      label: 'Escuchando',
    },
    speaking: {
      container: 'border-violet-500/60 bg-violet-950/60 text-violet-300 shadow-violet-500/40 animate-bounce state-speaking',
      glow: 'bg-violet-500/40 animate-pulse',
      icon: Volume2,
      label: 'Hablando',
    },
  }[state];

  const IconComponent = stateStyles.icon;

  return (
    <div
      data-testid="data-node-orb"
      data-state={state}
      aria-label={`DataNode Orb: ${stateStyles.label}`}
      onClick={onClick}
      role={onClick ? 'button' : 'status'}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full border shadow-lg transition-all duration-300 select-none',
        onClick && 'cursor-pointer hover:scale-105 active:scale-95',
        sizeClasses,
        stateStyles.container,
        className
      )}
    >
      {/* Resplandor periférico de fondo */}
      <span
        data-testid="orb-glow"
        className={cn('absolute inset-0 rounded-full blur-md -z-10 transition-colors duration-500', stateStyles.glow)}
        aria-hidden="true"
      />

      {/* Núcleo de orbe */}
      <div className="relative z-10 flex items-center justify-center">
        <IconComponent className={cn('transition-transform duration-300', iconSizes)} />
      </div>
    </div>
  );
};

export default DataNodeOrb;
