import api from './axios';
import type { Order, StockAlert } from '../types';

export const getActiveOrders = () => api.get<Order[]>('/staff/orders');

export const getQueue = () => api.get<Order[]>('/staff/orders/queue');

export const updateOrderStatus = (id: number, status: string) =>
  api.put<Order>(`/staff/orders/${id}/status`, { status });

export const getStockAlerts = () => api.get<StockAlert[]>('/staff/stock/alerts');
