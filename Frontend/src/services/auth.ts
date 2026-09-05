import { apiClient } from './api';
import type { AuthResponse, LoginCredentials, RegisterData, User } from '../types/auth';

export const loginApi = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
  return response.data;
};

export const registerApi = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/register', data);
  return response.data;
};

export const getCurrentUserApi = async (): Promise<User> => {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
};
