import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DataNodeOrb } from '@/components/voice/DataNodeOrb';
import { useVoiceAssistant, type OrbState } from '@/hooks/useVoiceAssistant';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AssistantWidgetProps {
  className?: string;
  onTranscript?: (transcript: string) => void;
  defaultPosition?: 'bottom-right' | 'header';
}

/**
 * AssistantWidget:
 * Widget global flotante (FAB) y dockeable del asistente inteligente de ELIS 5.0.
 * Integra el orbe háptico <DataNodeOrb /> con Web Speech API (`es-PE`) a $0 costo.
 */
export const AssistantWidget: React.FC<AssistantWidgetProps> = ({
  className,
  onTranscript,
  defaultPosition = 'bottom-right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    orbState,
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startSession,
    stopSession,
    resetSession,
  } = useVoiceAssistant({
    lang: 'es-PE',
    onResult: (text) => {
      if (onTranscript) {
        onTranscript(text);
      }
    },
  });

  const toggleListening = () => {
    if (isListening) {
      stopSession();
    } else {
      startSession();
      setIsOpen(true);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div
      data-testid="assistant-widget"
      className={cn(
        'z-50 select-none',
        defaultPosition === 'bottom-right'
          ? 'fixed bottom-6 right-6 flex flex-col items-end gap-3'
          : 'relative inline-flex items-center',
        className
      )}
    >
      {/* Panel emergente expandido con transcripción en vivo */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-80 rounded-xl border bg-background/95 p-4 shadow-xl backdrop-blur-md dark:border-muted/50"
          >
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    isListening
                      ? 'bg-emerald-500 animate-pulse'
                      : orbState === 'error'
                      ? 'bg-destructive'
                      : 'bg-primary'
                  )}
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Asistente de Voz ELIS
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => setIsOpen(false)}
                title="Minimizar panel"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Visualizador de estado e indicación */}
            <div className="py-3 text-sm min-h-[4rem] max-h-36 overflow-y-auto">
              {error ? (
                <div className="flex items-start gap-2 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              ) : isListening ? (
                <div className="space-y-1">
                  <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                    <Mic className="h-3 w-3 animate-pulse" />
                    Escuchando en vivo (es-PE)...
                  </p>
                  <p className="text-foreground text-xs leading-relaxed break-words font-mono bg-muted/40 p-2 rounded">
                    {transcript || interimTranscript || 'Habla ahora para dictar al formulario activo...'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Orbe en reposo.</p>
                  {transcript ? (
                    <p className="text-foreground text-xs font-mono bg-muted/30 p-2 rounded">
                      Último dictado: {transcript}
                    </p>
                  ) : (
                    <p className="italic">Haz clic en el orbe para iniciar el dictado por voz.</p>
                  )}
                </div>
              )}
            </div>

            {/* Acciones del panel */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={resetSession}
                disabled={!transcript && !interimTranscript}
              >
                Limpiar
              </Button>
              <Button
                variant={isListening ? 'destructive' : 'default'}
                size="sm"
                className="text-xs h-7 px-3 gap-1.5"
                onClick={toggleListening}
              >
                {isListening ? (
                  <>
                    <MicOff className="h-3 w-3" />
                    Detener
                  </>
                ) : (
                  <>
                    <Mic className="h-3 w-3" />
                    Dictar
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orbe Flotante (FAB Trigger) */}
      <div className="relative group">
        <DataNodeOrb
          state={orbState as OrbState}
          size="md"
          onClick={toggleListening}
          className="shadow-2xl ring-offset-2 hover:ring-2 hover:ring-primary/50"
        />
        {/* Tooltip táctil en hover */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2 py-1 rounded bg-popover text-popover-foreground text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden sm:block">
          {isListening ? 'Pausar Asistente' : 'Activar Asistente de Voz'}
        </div>
      </div>
    </div>
  );
};

export default AssistantWidget;
