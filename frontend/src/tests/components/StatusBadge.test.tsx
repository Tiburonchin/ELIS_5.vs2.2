import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../../components/ui/StatusBadge';

describe('StatusBadge Component', () => {
  it('renderiza correctamente el estado "pendiente" con clases ámbar', () => {
    render(<StatusBadge status="pendiente" />);
    const badge = screen.getByTestId('status-badge');

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(/pendiente/i);
    // Verificación de clases CSS Tailwind de ámbar
    expect(badge.className).toContain('bg-amber-500/10');
    expect(badge.className).toContain('text-amber-600');
    expect(badge.className).toContain('border-amber-500/30');
  });

  it('renderiza correctamente el estado "vinculada" con clases esmeralda', () => {
    render(<StatusBadge status="vinculada" />);
    const badge = screen.getByTestId('status-badge');

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(/vinculada/i);
    // Verificación de clases CSS Tailwind de esmeralda
    expect(badge.className).toContain('bg-emerald-500/10');
    expect(badge.className).toContain('text-emerald-600');
    expect(badge.className).toContain('border-emerald-500/30');
  });

  it('renderiza correctamente el estado "archivada" con clases slate/gris', () => {
    render(<StatusBadge status="archivada" />);
    const badge = screen.getByTestId('status-badge');

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(/archivada/i);
    // Verificación de clases CSS Tailwind de slate
    expect(badge.className).toContain('bg-slate-500/10');
    expect(badge.className).toContain('text-slate-600');
    expect(badge.className).toContain('border-slate-500/30');
  });

  it('renderiza correctamente el estado "error" con clases rojo/rose', () => {
    render(<StatusBadge status="error" />);
    const badge = screen.getByTestId('status-badge');

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(/error/i);
    // Verificación de clases CSS Tailwind de rose/rojo
    expect(badge.className).toContain('bg-rose-500/10');
    expect(badge.className).toContain('text-rose-600');
    expect(badge.className).toContain('border-rose-500/30');
  });

  it('soporta la opción showDot={false} ocultando el punto decorativo', () => {
    const { container } = render(<StatusBadge status="pendiente" showDot={false} />);
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toBeNull();
  });
});
