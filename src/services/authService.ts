import { AuthResponse, User } from '../types';
import { apiRequest, setAuthToken } from './apiClient';
import { DEMO_USER } from './demoDataProvider';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  fullName: string;
  password: string;
  phone?: string;
  initialAccountType?: string;
}

export const authService = {
  async login(payload: LoginPayload, useDemoMode = false): Promise<AuthResponse> {
    if (useDemoMode) {
      // Demo preview token
      const mockToken = 'mock_jwt_' + btoa(payload.username) + '_' + Date.now();
      setAuthToken(mockToken);
      return {
        token: mockToken,
        tokenType: 'Bearer',
        expiresIn: 86400,
        user: {
          ...DEMO_USER,
          username: payload.username || DEMO_USER.username,
        },
      };
    }

    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (response.token) {
      setAuthToken(response.token);
    }
    return response;
  },

  async register(payload: RegisterPayload, useDemoMode = false): Promise<AuthResponse> {
    if (useDemoMode) {
      const mockToken = 'mock_jwt_' + btoa(payload.username) + '_' + Date.now();
      setAuthToken(mockToken);
      const newUser: User = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        username: payload.username,
        email: payload.email,
        fullName: payload.fullName,
        role: 'CUSTOMER',
        phone: payload.phone || '+1 (555) 000-0000',
        createdAt: new Date().toISOString(),
      };
      return {
        token: mockToken,
        tokenType: 'Bearer',
        expiresIn: 86400,
        user: newUser,
      };
    }

    const response = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (response.token) {
      setAuthToken(response.token);
    }
    return response;
  },

  async getCurrentUser(useDemoMode = false): Promise<User> {
    if (useDemoMode) {
      return DEMO_USER;
    }
    return apiRequest<User>('/auth/me');
  },

  logout(): void {
    setAuthToken(null);
  },
};
