import client from './client';
import type { Order, PlaceOrderRequest } from '../types';

export const placeOrder = (data: PlaceOrderRequest) =>
  client.post<Order>('/api/orders', data);

export const getMyOrders = () =>
  client.get<Order[]>('/api/orders/my');

export const getMyOrder = (id: number) =>
  client.get<Order>(`/api/orders/my/${id}`);

export const cancelOrder = (id: number) =>
  client.delete(`/api/orders/my/${id}/cancel`);
