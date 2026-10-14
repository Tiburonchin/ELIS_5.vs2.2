import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginPage } from '@/pages/LoginPage';
import * as useAuthModule from '@/hooks/useAuth';
import { AuthService } from '@/services/AuthService';

vi.mock('@/hooks/useAuth');
vi.mock('@/services/AuthService');

describe('LoginPage Component', () => {
  const mockLogin = vi.fn();
  const mockSignInWithGoogle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      profile: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: mockLogin,
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });
    vi.spyOn(AuthService, 'signInWithGoogle').mockImplementation(mockSignInWithGoogle);
  });

  it('renderiza correctamente el formulario de credenciales y el botón de Google OAuth', () => {
    render(<LoginPage />);

    expect(screen.getByText('ELIS 5.0')).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo Electrónico Corporativo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ingresar al Sistema/i })).toBeInTheDocument();
    expect(screen.getByText(/O continuar con/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar con Google/i })).toBeInTheDocument();
  });

  it('valida campos requeridos antes de disparar login tradicional', async () => {
    render(<LoginPage />);

    const submitBtn = screen.getByRole('button', { name: /Ingresar al Sistema/i });
    fireEvent.click(submitBtn);

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('llama a login() con credenciales correctas al enviar el formulario', async () => {
    mockLogin.mockResolvedValueOnce({ success: true });
    const mockOnSuccess = vi.fn();

    render(<LoginPage onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/Correo Electrónico Corporativo/i);
    const passInput = screen.getByLabelText(/Contraseña/i);
    const submitBtn = screen.getByRole('button', { name: /Ingresar al Sistema/i });

    fireEvent.change(emailInput, { target: { value: 'inspector@elis.pe' } });
    fireEvent.change(passInput, { target: { value: 'Password123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('inspector@elis.pe', 'Password123!');
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('muestra mensaje de error si las credenciales fallan', async () => {
    mockLogin.mockResolvedValueOnce({
      success: false,
      error: new Error('Invalid login credentials'),
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/Correo Electrónico Corporativo/i);
    const passInput = screen.getByLabelText(/Contraseña/i);
    const submitBtn = screen.getByRole('button', { name: /Ingresar al Sistema/i });

    fireEvent.change(emailInput, { target: { value: 'inspector@elis.pe' } });
    fireEvent.change(passInput, { target: { value: 'WrongPass' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Credenciales incorrectas. Verifique su correo o contraseña./i)).toBeInTheDocument();
    });
  });

  it('llama a AuthService.signInWithGoogle al hacer clic en Continuar con Google', async () => {
    mockSignInWithGoogle.mockResolvedValueOnce({
      data: { provider: 'google', url: 'https://accounts.google.com/o/oauth2/v2/auth' },
      error: null,
    });

    render(<LoginPage />);

    const googleBtn = screen.getByRole('button', { name: /Continuar con Google/i });
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    });
  });

  it('maneja errores al fallar AuthService.signInWithGoogle', async () => {
    mockSignInWithGoogle.mockResolvedValueOnce({
      data: null,
      error: new Error('Google OAuth popup cerrado'),
    });

    render(<LoginPage />);

    const googleBtn = screen.getByRole('button', { name: /Continuar con Google/i });
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(screen.getByText(/Google OAuth popup cerrado/i)).toBeInTheDocument();
    });
  });
});
