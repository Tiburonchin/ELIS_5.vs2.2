import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { OrbState } from '@/hooks/useVoiceAssistant';

export type DataNodeOrbState = OrbState | 'speaking';

export interface DataNodeOrbProps {
  state?: DataNodeOrbState;
  className?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Variantes de animación para las capas del Orbe con Framer Motion:
 * - idle: Rotación lenta, pulso tenue.
 * - listening: Pulsación rápida ("respiración"), anillo expandiéndose, ring brillante.
 * - processing (o speaking): Giro acelerado / oscilación de tamaño.
 * - error: Parpadeo de advertencia en tonalidad destructiva.
 */
const coreVariants: Variants = {
  idle: {
    scale: [1, 1.05, 1],
    rotate: [0, 180, 360],
    transition: {
      scale: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
      rotate: { duration: 16, repeat: Infinity, ease: 'linear' },
    },
  },
  listening: {
    scale: [1, 1.25, 0.95, 1.2, 1],
    transition: {
      scale: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  processing: {
    rotate: [0, 360],
    scale: [1, 1.15, 0.9, 1],
    transition: {
      rotate: { duration: 1.5, repeat: Infinity, ease: 'linear' },
      scale: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  speaking: {
    scale: [1, 1.2, 1],
    transition: {
      scale: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  error: {
    scale: [1, 1.1, 0.95, 1],
    transition: {
      scale: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' },
    },
  },
};

const ringVariants: Variants = {
  idle: {
    scale: [1, 1.1, 1],
    opacity: [0.3, 0.6, 0.3],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
  listening: {
    scale: [1, 1.45, 1],
    opacity: [0.6, 1, 0.6],
    transition: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' },
  },
  processing: {
    scale: [1, 1.3, 1],
    rotate: [360, 0],
    transition: {
      scale: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
      rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
    },
  },
  speaking: {
    scale: [1, 1.35, 1],
    opacity: [0.5, 0.9, 0.5],
    transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' },
  },
  error: {
    scale: [1, 1.2, 1],
    opacity: [0.8, 1, 0.8],
    transition: { duration: 0.4, repeat: Infinity, ease: 'easeInOut' },
  },
};

/**
 * Componente visual interactivo y reactivo <DataNodeOrb />
 * Representa una esfera tecnológica abstracta sin rostro utilizando Framer Motion y shadcn/ui variables.
 *
 * Estados soportados:
 * - 'idle': Rotación lenta, anillo tenue cian/primary.
 * - 'listening': Respiración táctil, anillo exterior expandiéndose con ring-primary / esmeralda brillante.
 * - 'processing' / 'speaking': Oscilación de tamaño o giro acelerado tech.
 * - 'error': Estado de alerta con tono destructivo / advertencia.
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

  // Configuración semántica y visual basada en shadcn
  const stateConfig = {
    idle: {
      container:
        'border-cyan-500/30 bg-cyan-950/40 text-cyan-400 shadow-cyan-500/20 state-idle',
      glow: 'bg-cyan-500/20 animate-pulse',
      ringColor: 'border-cyan-400/40',
      label: 'En espera',
    },
    listening: {
      container:
        'border-emerald-500/60 bg-emerald-950/60 text-emerald-400 shadow-emerald-500/40 animate-pulse ring-2 ring-primary state-listening',
      glow: 'bg-emerald-500/40 animate-ping',
      ringColor: 'border-emerald-400/70',
      label: 'Escuchando',
    },
    processing: {
      container:
        'border-violet-500/60 bg-violet-950/60 text-violet-300 shadow-violet-500/40 animate-bounce state-processing state-speaking',
      glow: 'bg-violet-500/40 animate-pulse',
      ringColor: 'border-violet-400/70',
      label: 'Procesando',
    },
    speaking: {
      container:
        'border-violet-500/60 bg-violet-950/60 text-violet-300 shadow-violet-500/40 animate-bounce state-speaking',
      glow: 'bg-violet-500/40 animate-pulse',
      ringColor: 'border-violet-400/70',
      label: 'Hablando',
    },
    error: {
      container:
        'border-destructive/60 bg-destructive/20 text-destructive shadow-destructive/30 state-error',
      glow: 'bg-destructive/30 animate-pulse',
      ringColor: 'border-destructive/60',
      label: 'Error',
    },
  }[state];

  const animState = state === 'speaking' ? 'speaking' : state;

  return (
    <div
      data-testid="data-node-orb"
      data-state={state}
      aria-label={`DataNode Orb: ${stateConfig.label}`}
      onClick={onClick}
      role={onClick ? 'button' : 'status'}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full border shadow-lg transition-all duration-300 select-none overflow-visible',
        onClick && 'cursor-pointer hover:scale-105 active:scale-95',
        sizeClasses,
        stateConfig.container,
        className
      )}
    >
      {/* Resplandor periférico de fondo (difuso) */}
      <span
        data-testid="orb-glow"
        className={cn(
          'absolute inset-0 rounded-full blur-md -z-10 transition-colors duration-500',
          stateConfig.glow
        )}
        aria-hidden="true"
      />

      {/* Anillo de onda / respiración háptica con Framer Motion */}
      <motion.div
        data-testid="orb-motion-ring"
        variants={ringVariants}
        animate={animState}
        className={cn(
          'absolute inset-0 rounded-full border border-dashed pointer-events-none',
          stateConfig.ringColor
        )}
      />

      {/* Esfera Tech Interior (Abstracta, sin rostro, geometría fractal concéntrica) */}
      <motion.div
        data-testid="orb-motion-core"
        variants={coreVariants}
        animate={animState}
        className="relative z-10 w-3/4 h-3/4 rounded-full flex items-center justify-center bg-gradient-to-tr from-primary/30 via-background/60 to-primary/80 backdrop-blur-xs border border-primary/40 shadow-inner"
      >
        {/* Núcleo de datos central */}
        <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-xs shadow-primary" />
      </motion.div>
    </div>
  );
};

export default DataNodeOrb;
