import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../../components/ui/Modal';

describe('Modal Component', () => {
  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()} title="Título Modal">
        <p>Contenido Oculto</p>
      </Modal>
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('Título Modal')).not.toBeInTheDocument();
  });

  it('renderiza el título y los children correctamente cuando isOpen es true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Ventana de Prueba">
        <div data-testid="modal-children">Contenido Visible</div>
      </Modal>
    );

    expect(screen.getByText('Ventana de Prueba')).toBeInTheDocument();
    expect(screen.getByTestId('modal-children')).toBeInTheDocument();
    expect(screen.getByText('Contenido Visible')).toBeInTheDocument();
  });

  it('llama a onClose al hacer clic en el botón de cerrar (X)', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Ventana de Prueba">
        <p>Contenido</p>
      </Modal>
    );

    const closeButton = screen.getByRole('button', { name: /Cerrar modal/i });
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('llama a onClose al hacer clic en el fondo difuminado (backdrop)', () => {
    const handleClose = vi.fn();
    const { container } = render(
      <Modal isOpen={true} onClose={handleClose} title="Ventana de Prueba">
        <p>Contenido</p>
      </Modal>
    );

    // El backdrop tiene aria-hidden="true" y clase backdrop-blur-sm
    const backdrop = container.querySelector('.bg-slate-950\\/70');
    expect(backdrop).toBeInTheDocument();

    if (backdrop) {
      fireEvent.click(backdrop);
      expect(handleClose).toHaveBeenCalledTimes(1);
    }
  });

  it('llama a onClose al presionar la tecla Escape (ESC)', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Ventana de Prueba">
        <p>Contenido</p>
      </Modal>
    );

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
