import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { loginApi, registerApi, getCurrentUserApi } from '../services/auth';
import type { User, LoginCredentials, RegisterData } from '../types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('patchwatch_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('patchwatch_token');
      if (storedToken) {
        try {
          const currentUser = await getCurrentUserApi();
          setUser(currentUser);
          setToken(storedToken);
        } catch {
          // Token is invalid or expired
          localStorage.removeItem('patchwatch_token');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const authData = await loginApi(credentials);
    localStorage.setItem('patchwatch_token', authData.access_token);
    setToken(authData.access_token);
    setUser(authData.user);
  };

  const register = async (data: RegisterData) => {
    const authData = await registerApi(data);
    localStorage.setItem('patchwatch_token', authData.access_token);
    setToken(authData.access_token);
    setUser(authData.user);
  };

  const logout = () => {
    localStorage.removeItem('patchwatch_token');
    localStorage.removeItem('patchwatch_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
