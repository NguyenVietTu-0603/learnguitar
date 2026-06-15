import axios from 'axios';
import api from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
}

export interface AuthApiResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

interface ProfileApiResponse {
  success: boolean;
  data: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';

const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
};

const saveSession = (token: string, user: User) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

const saveUser = (user: User) => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

const authService = {
  async register(payload: RegisterPayload): Promise<User> {
    try {
      const response = await api.post<AuthApiResponse>('/auth/register', payload);
      saveSession(response.data.data.token, response.data.data.user);
      return response.data.data.user;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async login(payload: LoginPayload): Promise<User> {
    try {
      const response = await api.post<AuthApiResponse>('/auth/login', payload);
      saveSession(response.data.data.token, response.data.data.user);
      return response.data.data.user;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async getMyProfile(): Promise<User> {
    try {
      const response = await api.get<ProfileApiResponse>('/auth/me');
      saveUser(response.data.data);
      return response.data.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  },

  getCurrentUser(): User | null {
    const stored = localStorage.getItem(AUTH_USER_KEY);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as User;
    } catch {
      localStorage.removeItem(AUTH_USER_KEY);
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  hasToken(): boolean {
    return Boolean(this.getToken());
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  },
};

export default authService;
