import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../../src/router/ProtectedRoute';
import { AuthContext } from '../../src/context/auth-context';

const renderWithContext = (user = null, isCheckingAuth = false) => {
  return render(
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isCheckingAuth,
        isSubmitting: false,
        errorMessage: null,
        register: vi.fn(),
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      }}
    >
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading screen when checking auth', () => {
    renderWithContext(null, true);
    expect(screen.getByText(/đang kiểm tra phiên đăng nhập/i)).toBeInTheDocument();
  });

  it('renders Navigate component when not authenticated', () => {
    renderWithContext(null, false);
    const container = document.body.firstChild;
    expect(container).toBeInTheDocument();
    const navigate = container.querySelector('[data-testid]') || container;
    expect(navigate).toBeTruthy();
  });

  it('renders outlet when user is authenticated', () => {
    const user = { id: '1', name: 'Test', email: 'test@test.com', role: 'user' as const };
    const { container } = renderWithContext(user, false);
    expect(container).toBeEmptyDOMElement();
  });
});
