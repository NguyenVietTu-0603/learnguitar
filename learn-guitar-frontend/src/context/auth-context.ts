import { createContext } from 'react';
import type { LoginPayload, RegisterPayload, User } from '../services/authService';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  register: (payload: RegisterPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
