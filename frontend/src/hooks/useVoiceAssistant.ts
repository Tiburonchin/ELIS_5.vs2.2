import { useState, useCallback, useRef } from 'react';
import { useSpeech, type UseSpeechOptions } from './useSpeech';

export type OrbState = 'idle' | 'listening' | 'processing' | 'error';
// Compatibilidad con código previo que pudiera referenciar VoiceAssistantState o speaking
export type VoiceAssistantState = OrbState | 'speaking';

export interface UseVoiceAssistantOptions extends UseSpeechOptions {
  onTranscriptionComplete?: (transcript: string) => void;
  synthesizeSpeech?: boolean;
}

export interface UseVoiceAssistantResult {
  state: OrbState | 'speaking';
  orbState: OrbState;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  error: string | null;
  startSession: () => void;
  stopSession: () => void;
  resetSession: () => void;
  setProcessing: () => void;
  setErrorState: (err: string) => void;
  speak: (text: string) => void;
}

/**
 * Hook useVoiceAssistant:
 * Orquesta la captura por voz vía Web Speech API (usando useSpeech),
 * transiciona reactivamente entre los estados estrictos:
 * type OrbState = 'idle' | 'listening' | 'processing' | 'error' (con soporte opcional 'speaking'),
 * y expone la lógica para dictado y procesamiento de contexto operativo HSE en 'es-PE'.
 */
export function useVoiceAssistant(options: UseVoiceAssistantOptions = {}): UseVoiceAssistantResult {
  const {
    lang = 'es-PE',
    continuous = true,
    interimResults = true,
    onResult,
    onTranscriptionComplete,
    synthesizeSpeech: _synthesizeSpeech = false,
  } = options;

  const [assistantState, setAssistantState] = useState<OrbState | 'speaking'>('idle');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speech = useSpeech({
    lang,
    continuous,
    interimResults,
    onResult: (finalText) => {
      if (onResult) {
        onResult(finalText);
      }
      if (onTranscriptionComplete) {
        onTranscriptionComplete(finalText);
      }
    },
  });

  const startSession = useCallback(() => {
    setAssistantState('listening');
    speech.startListening();
  }, [speech]);

  const stopSession = useCallback(() => {
    speech.stopListening();
    setAssistantState('idle');
  }, [speech]);

  const resetSession = useCallback(() => {
    speech.stopListening();
    speech.resetTranscript();
    setAssistantState('idle');
  }, [speech]);

  const setProcessing = useCallback(() => {
    speech.stopListening();
    setAssistantState('processing');
  }, [speech]);

  const setErrorState = useCallback((_err: string) => {
    speech.stopListening();
    setAssistantState('error');
  }, [speech]);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;

      utterance.onstart = () => {
        setAssistantState('speaking');
      };

      utterance.onend = () => {
        setAssistantState('idle');
      };

      utterance.onerror = () => {
        setAssistantState('error');
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [lang]
  );

  // Derivar estado actual:
  // Si speech.error existe y no estamos en otro estado activo, error
  // Si speech.isListening es true, listening
  let currentState: OrbState | 'speaking' = assistantState;
  if (speech.isListening) {
    currentState = 'listening';
  } else if (speech.error && assistantState === 'idle') {
    currentState = 'error';
  }

  // Normalizar a OrbState para consumidores estrictos de OrbState
  const orbState: OrbState =
    currentState === 'speaking' ? 'processing' : (currentState as OrbState);

  return {
    state: currentState,
    orbState,
    isListening: speech.isListening,
    transcript: speech.transcript,
    interimTranscript: speech.interimTranscript,
    isSupported: speech.isSupported,
    error: speech.error,
    startSession,
    stopSession,
    resetSession,
    setProcessing,
    setErrorState,
    speak,
  };
}

export default useVoiceAssistant;
