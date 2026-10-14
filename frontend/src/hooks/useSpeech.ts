import { useState, useEffect, useRef, useCallback } from 'react';

// Declaración de tipos para Web Speech API
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface UseSpeechOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string) => void;
}

export interface UseSpeechResult {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

/**
 * Hook personalizado para transcripción de voz a texto en campo usando Web Speech API.
 * Configurado por defecto para idioma 'es-PE' (Español de Perú).
 */
export function useSpeech(options: UseSpeechOptions = {}): UseSpeechResult {
  const {
    lang = 'es-PE',
    continuous = true,
    interimResults = true,
    onResult,
  } = options;

  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isSupported = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Inicializar la instancia de SpeechRecognition
  useEffect(() => {
    if (!isSupported) {
      setError('El navegador no soporta reconocimiento de voz (Web Speech API).');
      return;
    }

    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechClass) return;

    const recognition = new SpeechClass();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let finalStr = '';
      let interimStr = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalStr += result[0].transcript;
        } else {
          interimStr += result[0].transcript;
        }
      }

      if (finalStr) {
        setTranscript((prev) => {
          const updated = prev ? `${prev} ${finalStr.trim()}` : finalStr.trim();
          if (onResult) onResult(updated);
          return updated;
        });
      }
      setInterimTranscript(interimStr);
    };

    recognition.onerror = (e: SpeechRecognitionErrorEventLike) => {
      // Ignorar no-speech para no asustar al usuario si hubo silencio
      if (e.error === 'no-speech') {
        return;
      }
      console.warn('[useSpeech] Error en reconocimiento:', e.error);
      setError(`Error de voz: ${e.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // En caso de que ya estuviera detenido
      }
    };
  }, [isSupported, lang, continuous, interimResults, onResult]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError('Reconocimiento de voz no disponible.');
      return;
    }
    setError(null);
    try {
      recognitionRef.current.start();
    } catch (err: unknown) {
      // Si ya estaba corriendo, reiniciar
      console.warn('[useSpeech] Advertencia al iniciar reconocimiento:', err);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // Ignorar si ya estaba detenido
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}

export default useSpeech;
