import client from './client';
import type { Order, StockAlert } from '../types';

export const getActiveOrders = () =>
  client.get<Order[]>('/api/staff/orders');

export const getOrderQueue = () =>
  client.get<Order[]>('/api/staff/orders/queue');

export const updateOrderStatus = (id: number, status: string) =>
  client.put(`/api/staff/orders/${id}/status`, { status });

export const getStockAlerts = () =>
  client.get<StockAlert[]>('/api/staff/stock/alerts');
