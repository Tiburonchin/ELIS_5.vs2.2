import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import { MockSpeechRecognition } from '../setup';

describe('useVoiceAssistant Hook - Auditoría de Voz y Contexto HSE', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicia en estado "idle" y con transcript vacío', () => {
    const { result } = renderHook(() => useVoiceAssistant());

    expect(result.current.state).toBe('idle');
    expect(result.current.isListening).toBe(false);
    expect(result.current.transcript).toBe('');
    expect(result.current.isSupported).toBe(true);
  });

  it('procesa la transcripción de un hallazgo real del contexto HSE de la empresa', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useVoiceAssistant({
        onTranscriptionComplete: onComplete,
      })
    );

    // Activar sesión de voz
    act(() => {
      result.current.startSession();
    });

    expect(result.current.state).toBe('listening');
    expect(result.current.isListening).toBe(true);

    const mockInstance = MockSpeechRecognition.lastInstance;
    expect(mockInstance).not.toBeNull();

    // Simular dictado del hallazgo operativo HSE real
    const hseFinding = 'El operario no había repasado la actuación ante una quemadura eléctrica';
    act(() => {
      mockInstance?.simulateResult(hseFinding, true);
    });

    expect(result.current.transcript).toBe(hseFinding);
    expect(onComplete).toHaveBeenCalledWith(hseFinding);

    // Finalizar sesión de dictado
    act(() => {
      result.current.stopSession();
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.isListening).toBe(false);
  });

  it('procesa el dictado de un reporte de riesgo y amonestación por acto subestándar', () => {
    const { result } = renderHook(() => useVoiceAssistant());

    act(() => {
      result.current.startSession();
    });

    const mockInstance = MockSpeechRecognition.lastInstance;
    expect(mockInstance).not.toBeNull();

    const sanctionFinding =
      'Se requiere amonestación por acto subestándar y falta de HSE con nivel de riesgo intolerable';

    act(() => {
      mockInstance?.simulateResult(sanctionFinding, true);
    });

    // Validar que el texto extraído coincida exactamente con la entrada dictada
    expect(result.current.transcript).toBe(sanctionFinding);

    // Probar reset de sesión
    act(() => {
      result.current.resetSession();
    });

    expect(result.current.transcript).toBe('');
    expect(result.current.state).toBe('idle');
  });

  it('soporta síntesis de voz (speak) transicionando al estado "speaking"', () => {
    const { result } = renderHook(() => useVoiceAssistant());

    act(() => {
      result.current.speak('Atención, nivel de riesgo intolerable detectado.');
    });

    expect(result.current.state).toBe('speaking');
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });
});
