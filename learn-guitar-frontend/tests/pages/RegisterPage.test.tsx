import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from '../../src/pages/RegisterPage';

vi.mock('../../src/context/useAuth', () => ({
  useAuth: () => ({
    register: vi.fn(() => Promise.resolve()),
    isSubmitting: false,
    errorMessage: null,
    clearError: vi.fn(),
  }),
}));

const renderRegister = () =>
  render(<RegisterPage />, { wrapper: BrowserRouter });

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form', () => {
    renderRegister();
    expect(screen.getByRole('heading', { name: /đăng ký/i })).toBeInTheDocument();
  });

  it('renders name input', () => {
    renderRegister();
    expect(screen.getByPlaceholderText(/nguyen van a/i)).toBeInTheDocument();
  });

  it('renders email input', () => {
    renderRegister();
    expect(screen.getByPlaceholderText(/ban@email.com/i)).toBeInTheDocument();
  });

  it('renders password input', () => {
    renderRegister();
    expect(screen.getByPlaceholderText(/toi thieu 6 ky tu/i)).toBeInTheDocument();
  });

  it('renders confirm password input', () => {
    renderRegister();
    expect(screen.getByPlaceholderText(/nhap lai mat khau/i)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    renderRegister();
    expect(screen.getByRole('button', { name: /dang ky/i })).toBeInTheDocument();
  });

  it('renders link to login', () => {
    renderRegister();
    expect(screen.getByRole('link', { name: /đăng nhập/i })).toBeInTheDocument();
  });

  it('renders start journey badge', () => {
    renderRegister();
    expect(screen.getByText(/start your journey/i)).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    renderRegister();
    expect(screen.getByText(/tạo tài khoản/i)).toBeInTheDocument();
  });
});
