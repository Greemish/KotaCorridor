import client from './client';
import type { MenuItem } from '../types';

export const getAvailableMenu = () =>
  client.get<MenuItem[]>('/api/menu/available');

export const getMenuItem = (id: number) =>
  client.get<MenuItem>(`/api/menu/${id}`);
