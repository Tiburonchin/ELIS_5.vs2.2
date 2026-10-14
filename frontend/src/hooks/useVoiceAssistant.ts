import { useState, useCallback, useRef } from 'react';
import { useSpeech, type UseSpeechOptions } from './useSpeech';

export type VoiceAssistantState = 'idle' | 'listening' | 'speaking';

export interface UseVoiceAssistantOptions extends UseSpeechOptions {
  onTranscriptionComplete?: (transcript: string) => void;
  synthesizeSpeech?: boolean;
}

export interface UseVoiceAssistantResult {
  state: VoiceAssistantState;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  error: string | null;
  startSession: () => void;
  stopSession: () => void;
  resetSession: () => void;
  speak: (text: string) => void;
}

/**
 * Hook useVoiceAssistant:
 * Orquesta la captura por voz vía Web Speech API (usando useSpeech),
 * transiciona reactivamente entre los estados: 'idle' | 'listening' | 'speaking',
 * y expone la lógica para dictado y procesamiento de contexto operativo HSE.
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

  const [assistantState, setAssistantState] = useState<VoiceAssistantState>('idle');
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
        setAssistantState('idle');
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [lang]
  );

  // El estado actual refleja el estado del asistente
  const currentState: VoiceAssistantState = speech.isListening ? 'listening' : assistantState;

  return {
    state: currentState,
    isListening: speech.isListening,
    transcript: speech.transcript,
    interimTranscript: speech.interimTranscript,
    isSupported: speech.isSupported,
    error: speech.error,
    startSession,
    stopSession,
    resetSession,
    speak,
  };
}

export default useVoiceAssistant;
