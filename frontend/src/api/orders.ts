import api from './axios';
import type { Order } from '../types';

export interface PlaceOrderRequest {
  items: { menuItemId: number; quantity: number; customizations?: string }[];
  specialInstructions?: string;
}

export const placeOrder = (data: PlaceOrderRequest) =>
  api.post<Order>('/orders', data);

export const getMyOrders = () => api.get<Order[]>('/orders/my');

export const getMyOrder = (id: number) => api.get<Order>(`/orders/my/${id}`);

export const cancelOrder = (id: number) =>
  api.delete<void>(`/orders/my/${id}/cancel`);
