import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataNodeOrb } from '@/components/voice/DataNodeOrb';

describe('DataNodeOrb Component', () => {
  it('renderiza correctamente en estado "idle" por defecto con estilos y animaciones cian', () => {
    render(<DataNodeOrb state="idle" />);
    const orb = screen.getByTestId('data-node-orb');
    const glow = screen.getByTestId('orb-glow');
    const ring = screen.getByTestId('orb-motion-ring');
    const core = screen.getByTestId('orb-motion-core');

    expect(orb).toBeInTheDocument();
    expect(orb).toHaveAttribute('data-state', 'idle');
    expect(orb).toHaveAttribute('aria-label', expect.stringContaining('En espera'));
    expect(ring).toBeInTheDocument();
    expect(core).toBeInTheDocument();

    // Clases asociadas al estado idle
    expect(orb.className).toContain('state-idle');
    expect(orb.className).toContain('border-cyan-500/30');
    expect(glow.className).toContain('bg-cyan-500/20');
    expect(glow.className).toContain('animate-pulse');
  });

  it('transiciona a estado "listening" con animaciones y clases esmeralda de captura activa', () => {
    render(<DataNodeOrb state="listening" />);
    const orb = screen.getByTestId('data-node-orb');
    const glow = screen.getByTestId('orb-glow');

    expect(orb).toBeInTheDocument();
    expect(orb).toHaveAttribute('data-state', 'listening');
    expect(orb).toHaveAttribute('aria-label', expect.stringContaining('Escuchando'));

    // Clases asociadas al estado listening
    expect(orb.className).toContain('state-listening');
    expect(orb.className).toContain('border-emerald-500/60');
    expect(orb.className).toContain('ring-primary');
    expect(glow.className).toContain('bg-emerald-500/40');
    expect(glow.className).toContain('animate-ping');
  });

  it('transiciona a estado "processing" con clases tech y oscilación acelerada', () => {
    render(<DataNodeOrb state="processing" />);
    const orb = screen.getByTestId('data-node-orb');
    const glow = screen.getByTestId('orb-glow');

    expect(orb).toBeInTheDocument();
    expect(orb).toHaveAttribute('data-state', 'processing');
    expect(orb).toHaveAttribute('aria-label', expect.stringContaining('Procesando'));

    expect(orb.className).toContain('state-processing');
    expect(orb.className).toContain('border-violet-500/60');
    expect(glow.className).toContain('bg-violet-500/40');
  });

  it('transiciona a estado "error" con clases destructivas', () => {
    render(<DataNodeOrb state="error" />);
    const orb = screen.getByTestId('data-node-orb');
    const glow = screen.getByTestId('orb-glow');

    expect(orb).toBeInTheDocument();
    expect(orb).toHaveAttribute('data-state', 'error');
    expect(orb).toHaveAttribute('aria-label', expect.stringContaining('Error'));

    expect(orb.className).toContain('state-error');
    expect(orb.className).toContain('border-destructive/60');
    expect(glow.className).toContain('bg-destructive/30');
  });

  it('transiciona a estado "speaking" con clases y animaciones de reproducción vocal', () => {
    render(<DataNodeOrb state="speaking" />);
    const orb = screen.getByTestId('data-node-orb');
    const glow = screen.getByTestId('orb-glow');

    expect(orb).toBeInTheDocument();
    expect(orb).toHaveAttribute('data-state', 'speaking');
    expect(orb).toHaveAttribute('aria-label', expect.stringContaining('Hablando'));

    // Clases asociadas al estado speaking
    expect(orb.className).toContain('state-speaking');
    expect(orb.className).toContain('border-violet-500/60');
    expect(orb.className).toContain('animate-bounce');
    expect(glow.className).toContain('bg-violet-500/40');
  });

  it('soporta interacción onClick cuando actúa como botón de activación', () => {
    const handleClick = vi.fn();
    render(<DataNodeOrb state="idle" onClick={handleClick} />);
    const orb = screen.getByTestId('data-node-orb');

    expect(orb).toHaveAttribute('role', 'button');
    fireEvent.click(orb);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
