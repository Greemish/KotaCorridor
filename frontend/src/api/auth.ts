import api from './axios';
import type { AuthResponse, User } from '../types';

export const register = (data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roomNumber: string;
}) => api.post<AuthResponse>('/auth/register', data);

export const login = (data: { email: string; password: string }) =>
  api.post<AuthResponse>('/auth/login', data);

export const getMe = () => api.get<User>('/auth/me');
