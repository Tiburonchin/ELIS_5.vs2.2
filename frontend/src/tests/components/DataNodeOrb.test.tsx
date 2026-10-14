import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataNodeOrb } from '../../components/ui/DataNodeOrb';

describe('DataNodeOrb Component', () => {
  it('renderiza correctamente en estado "idle" por defecto con estilos y animaciones cian', () => {
    render(<DataNodeOrb state="idle" />);
    const orb = screen.getByTestId('data-node-orb');
    const glow = screen.getByTestId('orb-glow');

    expect(orb).toBeInTheDocument();
    expect(orb).toHaveAttribute('data-state', 'idle');
    expect(orb).toHaveAttribute('aria-label', expect.stringContaining('En espera'));

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
    expect(orb.className).toContain('animate-pulse');
    expect(glow.className).toContain('bg-emerald-500/40');
    expect(glow.className).toContain('animate-ping');
  });

  it('transiciona a estado "speaking" con clases y animaciones violeta de reproducción vocal', () => {
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
