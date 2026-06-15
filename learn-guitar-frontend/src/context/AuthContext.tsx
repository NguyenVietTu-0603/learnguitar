import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import authService from '../services/authService';
import type { LoginPayload, RegisterPayload, User } from '../services/authService';
import { AuthContext } from './auth-context';
import type { AuthContextValue } from './auth-context';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const bootstrapAuth = async () => {
      const currentUser = authService.getCurrentUser();

      if (!authService.hasToken()) {
        if (mounted) {
          setUser(currentUser);
          setIsCheckingAuth(false);
        }
        return;
      }

      try {
        const profile = await authService.getMyProfile();
        if (mounted) {
          setUser(profile);
        }
      } catch {
        authService.logout();
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    bootstrapAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const register = async (payload: RegisterPayload) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const registeredUser = await authService.register(payload);
      setUser(registeredUser);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đăng ký thất bại.';
      setErrorMessage(message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const login = async (payload: LoginPayload) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const loggedInUser = await authService.login(payload);
      setUser(loggedInUser);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đăng nhập thất bại.';
      setErrorMessage(message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setErrorMessage(null);
  };

  const clearError = () => {
    setErrorMessage(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isCheckingAuth,
      isSubmitting,
      errorMessage,
      register,
      login,
      logout,
      clearError,
    }),
    [user, isCheckingAuth, isSubmitting, errorMessage]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
