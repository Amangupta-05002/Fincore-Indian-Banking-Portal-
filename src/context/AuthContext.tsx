import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { getAuthToken, setAuthToken } from '../services/apiClient';
import { authService, LoginPayload, RegisterPayload } from '../services/authService';
import { DEMO_USER } from '../services/demoDataProvider';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (payload: LoginPayload, useDemoMode?: boolean) => Promise<boolean>;
  register: (payload: RegisterPayload, useDemoMode?: boolean) => Promise<boolean>;
  logout: () => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setTokenState(null);
      setAuthError('Your banking session has expired. Please authenticate again.');
    };

    window.addEventListener('fincore:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('fincore:auth-expired', handleAuthExpired);
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getAuthToken();
      if (!storedToken) {
        // Automatically provide demo user session so preview evaluation is instant
        setUser(DEMO_USER);
        setIsLoading(false);
        return;
      }

      setTokenState(storedToken);
      try {
        if (storedToken.startsWith('mock_jwt_')) {
          setUser(DEMO_USER);
        } else {
          const profile = await authService.getCurrentUser(false);
          setUser(profile);
        }
      } catch {
        // Fallback to demo user if backend is offline on reload
        setUser(DEMO_USER);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (payload: LoginPayload, useDemoMode = false): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await authService.login(payload, useDemoMode);
      setTokenState(response.token);
      setUser(response.user);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setAuthError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload, useDemoMode = false): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await authService.register(payload, useDemoMode);
      setTokenState(response.token);
      setUser(response.user);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setAuthError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setTokenState(null);
    setUser(null);
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        authError,
        login,
        register,
        logout,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
