import client from './client';
import type { MenuItem, Order, StockItem, StockTransaction, AppUser, AuditLog, AnalyticsOrderCount, PopularItem, RevenueStats, PagedResponse } from '../types';

type AdminMenuPayload = {
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  imageUrl?: string;
  stockRequirements?: {
    stockItemName: string;
    quantityRequired: number;
    unitOfMeasure?: string;
    minimumStockLevel?: number;
    initialStockQuantity?: number;
  }[];
};

export const adminGetMenu = () =>
  client.get<MenuItem[]>('/api/admin/menu');

export const adminCreateMenuItem = (data: AdminMenuPayload) =>
  client.post<MenuItem>('/api/admin/menu', data);

export const adminUpdateMenuItem = (id: number, data: AdminMenuPayload) =>
  client.put<MenuItem>(`/api/admin/menu/${id}`, data);

export const adminDeleteMenuItem = (id: number) =>
  client.delete(`/api/admin/menu/${id}`);

export const adminGetOrders = (params?: { status?: string; studentId?: number; startDate?: string; endDate?: string; page?: number; size?: number }) =>
  client.get<PagedResponse<Order>>('/api/admin/orders', { params });

export const adminUpdateOrderStatus = (id: number, status: string) =>
  client.put(`/api/admin/orders/${id}/status`, { status });

export const adminGetStock = () =>
  client.get<StockItem[]>('/api/admin/stock');

export const adminGetLowStock = () =>
  client.get<StockItem[]>('/api/admin/stock/low-stock');

export const adminRestockItem = (menuItemId: number, data: { quantity: number; notes?: string }) =>
  client.put(`/api/admin/stock/restock/${menuItemId}`, data);

export const adminAdjustStock = (menuItemId: number, data: { quantity: number; adjustmentType: string; reason: string }) =>
  client.put(`/api/admin/stock/adjust/${menuItemId}`, data);

export const adminGetStockTransactions = (params?: { page?: number; size?: number }) =>
  client.get<PagedResponse<StockTransaction>>('/api/admin/stock/transactions', { params });

export const adminGetUsers = () =>
  client.get<AppUser[]>('/api/admin/users');

export const adminCreateStaff = (data: { name: string; email: string; password: string }) =>
  client.post<AppUser>('/api/admin/users/staff', data);

export const adminActivateUser = (id: number) =>
  client.put(`/api/admin/users/${id}/activate`);

export const adminDeactivateUser = (id: number) =>
  client.put(`/api/admin/users/${id}/deactivate`);

export const adminGetOrderAnalytics = () =>
  client.get<AnalyticsOrderCount[]>('/api/admin/analytics/orders');

export const adminGetPopularItems = () =>
  client.get<PopularItem[]>('/api/admin/analytics/popular-items');

export const adminGetRevenue = (params?: { startDate?: string; endDate?: string }) =>
  client.get<RevenueStats>('/api/admin/analytics/revenue', { params });

export const adminGetAuditLogs = (params?: { page?: number; size?: number }) =>
  client.get<PagedResponse<AuditLog>>('/api/admin/audit-logs', { params });
