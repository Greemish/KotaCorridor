import client from './client';
import type { AuthResponse } from '../types';

export const login = (email: string, password: string) =>
  client.post<AuthResponse>('/api/auth/login', { email, password });

export const register = (data: {
  name: string;
  email: string;
  password: string;
  studentNumber?: string;
  residenceBlock?: string;
}) => client.post<AuthResponse>('/api/auth/register', data);

export const getMe = () => client.get('/api/auth/me');
