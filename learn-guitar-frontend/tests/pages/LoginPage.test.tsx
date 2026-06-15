import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../src/pages/LoginPage';

vi.mock('../../src/context/useAuth', () => ({
  useAuth: () => ({
    login: vi.fn(() => Promise.resolve()),
    isSubmitting: false,
    errorMessage: null,
    clearError: vi.fn(),
  }),
}));

const renderLogin = () =>
  render(<LoginPage />, { wrapper: BrowserRouter });

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /đăng nhập/i })).toBeInTheDocument();
  });

  it('renders email input', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/ban@email.com/i)).toBeInTheDocument();
  });

  it('renders password input', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/nhap mat khau/i)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /dang nhap/i })).toBeInTheDocument();
  });

  it('renders link to register', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /đăng ký/i })).toBeInTheDocument();
  });

  it('renders welcome badge', () => {
    renderLogin();
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it('has password toggle button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /hien/i })).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    renderLogin();
    expect(screen.getByText(/hành trình/i)).toBeInTheDocument();
  });
});
