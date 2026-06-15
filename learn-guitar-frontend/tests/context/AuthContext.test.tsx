import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider } from '../../src/context/AuthContext';
import { useAuth } from '../../src/context/useAuth';

vi.mock('../../src/services/authService', () => ({
  default: {
    hasToken: vi.fn(() => false),
    getCurrentUser: vi.fn(() => null),
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    getMyProfile: vi.fn(),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('sets isAuthenticated to false when no token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => {
      expect(result.current.isCheckingAuth).toBe(false);
    });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('sets isCheckingAuth to false after initialization', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => {
      expect(result.current.isCheckingAuth).toBe(false);
    });
  });

  it('logout clears user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => {
      expect(result.current.isCheckingAuth).toBe(false);
    });
    act(() => {
      result.current.logout();
    });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
