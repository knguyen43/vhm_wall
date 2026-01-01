import { apiGet, apiSend } from './apiClient';

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export const register = async (email: string, password: string): Promise<AuthResponse> => {
  return apiSend<AuthResponse>('/auth/register', 'POST', { email, password });
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  return apiSend<AuthResponse>('/auth/login', 'POST', { email, password });
};

export const getMe = async (): Promise<AuthUser> => {
  return apiGet<AuthUser>('/auth/me');
};
