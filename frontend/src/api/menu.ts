import api from './axios';
import type { MenuItem } from '../types';

export const getAvailableMenu = () => api.get<MenuItem[]>('/menu/available');
export const getMenuItem = (id: number) => api.get<MenuItem>(`/menu/${id}`);
