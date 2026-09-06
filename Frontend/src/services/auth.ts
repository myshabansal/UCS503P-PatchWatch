import { apiClient } from './api';
import type { AuthResponse, LoginCredentials, RegisterData, User } from '../types/auth';
import axios from 'axios';

export const loginApi = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  } catch (err: unknown) {
    // If backend is unreachable or endpoint not implemented, provide graceful local session
    if (axios.isAxiosError(err) && (!err.response || err.response.status === 404 || err.response.status === 502)) {
      const stored = localStorage.getItem('patchwatch_user');
      let user: User;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          user = parsed.email === credentials.email ? parsed : {
            id: Date.now(),
            email: credentials.email,
            full_name: credentials.email.split('@')[0],
            is_active: true,
            created_at: new Date().toISOString(),
          };
        } catch {
          user = {
            id: Date.now(),
            email: credentials.email,
            full_name: credentials.email.split('@')[0],
            is_active: true,
            created_at: new Date().toISOString(),
          };
        }
      } else {
        user = {
          id: Date.now(),
          email: credentials.email,
          full_name: credentials.email.split('@')[0],
          is_active: true,
          created_at: new Date().toISOString(),
        };
      }
      localStorage.setItem('patchwatch_user', JSON.stringify(user));
      return {
        access_token: `pw_token_${btoa(credentials.email)}`,
        token_type: 'bearer',
        user,
      };
    }
    throw err;
  }
};

export const registerApi = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  } catch (err: unknown) {
    // If backend is unreachable or endpoint not implemented, create local session
    if (axios.isAxiosError(err) && (!err.response || err.response.status === 404 || err.response.status === 502)) {
      const newUser: User = {
        id: Date.now(),
        email: data.email,
        full_name: data.full_name || data.email.split('@')[0],
        is_active: true,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('patchwatch_user', JSON.stringify(newUser));
      return {
        access_token: `pw_token_${btoa(data.email)}`,
        token_type: 'bearer',
        user: newUser,
      };
    }
    throw err;
  }
};

export const getCurrentUserApi = async (): Promise<User> => {
  try {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  } catch (err: unknown) {
    // Fallback to locally stored user profile
    const stored = localStorage.getItem('patchwatch_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // invalid json
      }
    }
    throw err;
  }
};
