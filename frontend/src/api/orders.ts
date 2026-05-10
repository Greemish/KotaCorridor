import client from './client';
import type { Order, PlaceOrderRequest } from '../types';

export const placeOrder = (data: PlaceOrderRequest) =>
  client.post<Order>('/api/orders', data);

export const getOrder = (id: number) =>
  client.get<Order>(`/api/orders/${id}`);

export const cancelOrder = (id: number) =>
  client.delete(`/api/orders/${id}/cancel`);
