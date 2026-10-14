import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ==========================================
// Mock de Web Speech API (SpeechRecognition)
// ==========================================
export class MockSpeechRecognition {
  continuous = true;
  interimResults = true;
  lang = 'es-PE';
  onstart: (() => void) | null = null;
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;

  static lastInstance: MockSpeechRecognition | null = null;

  constructor() {
    MockSpeechRecognition.lastInstance = this;
  }

  start() {
    if (this.onstart) {
      this.onstart();
    }
  }

  stop() {
    if (this.onend) {
      this.onend();
    }
  }

  abort() {
    if (this.onend) {
      this.onend();
    }
  }

  // Utilidad de prueba para simular la emisión de un resultado dictado
  simulateResult(transcript: string, isFinal: boolean = true) {
    if (this.onresult) {
      this.onresult({
        resultIndex: 0,
        results: [
          {
            isFinal,
            length: 1,
            0: {
              transcript,
              confidence: 0.95,
            },
          },
        ],
      });
    }
  }

  // Utilidad de prueba para simular error
  simulateError(error: string) {
    if (this.onerror) {
      this.onerror({ error });
    }
  }
}

// Inyección global en window y globalThis
Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  configurable: true,
  value: MockSpeechRecognition,
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  configurable: true,
  value: MockSpeechRecognition,
});

// ==========================================
// Mock de SpeechSynthesis / SpeechSynthesisUtterance
// ==========================================
export class MockSpeechSynthesisUtterance {
  text: string;
  lang: string = 'es-PE';
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((err: any) => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

const mockSpeechSynthesis = {
  speak: vi.fn((utterance: MockSpeechSynthesisUtterance) => {
    if (utterance.onstart) utterance.onstart();
    setTimeout(() => {
      if (utterance.onend) utterance.onend();
    }, 10);
  }),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn().mockReturnValue([]),
};

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  writable: true,
  configurable: true,
  value: MockSpeechSynthesisUtterance,
});

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  configurable: true,
  value: mockSpeechSynthesis,
});

// Mock de window.matchMedia para componentes responsive (Sidebar, useIsMobile)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

