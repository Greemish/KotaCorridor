import api from './axios';
import type { MenuItem, Order, User, StockAlert, StockTransaction, AuditLog, PageResponse, AnalyticsOrderCounts, PopularItem, RevenueData } from '../types';

// Menu
export const adminGetMenu = () => api.get<MenuItem[]>('/admin/menu');
export const adminCreateMenuItem = (data: Partial<MenuItem>) =>
  api.post<MenuItem>('/admin/menu', data);
export const adminUpdateMenuItem = (id: number, data: Partial<MenuItem>) =>
  api.put<MenuItem>(`/admin/menu/${id}`, data);
export const adminDeleteMenuItem = (id: number) =>
  api.delete<void>(`/admin/menu/${id}`);

// Orders
export const adminGetOrders = (params?: {
  status?: string;
  studentId?: number;
  date?: string;
  page?: number;
  size?: number;
}) => api.get<PageResponse<Order>>('/admin/orders', { params });

export const adminUpdateOrderStatus = (id: number, status: string) =>
  api.put<Order>(`/admin/orders/${id}/status`, { status });

// Stock
export const adminGetStock = () => api.get<MenuItem[]>('/admin/stock');
export const adminGetLowStock = () => api.get<StockAlert[]>('/admin/stock/low-stock');
export const adminRestockItem = (menuItemId: number, data: { quantity: number; notes?: string }) =>
  api.put<void>(`/admin/stock/restock/${menuItemId}`, data);
export const adminAdjustStock = (menuItemId: number, data: { adjustmentType: string; quantity: number; reason?: string }) =>
  api.put<void>(`/admin/stock/adjust/${menuItemId}`, data);
export const adminGetStockTransactions = (params?: { page?: number; size?: number }) =>
  api.get<PageResponse<StockTransaction>>('/admin/stock/transactions', { params });

// Users
export const adminGetUsers = () => api.get<User[]>('/admin/users');
export const adminGetUser = (id: number) => api.get<User>(`/admin/users/${id}`);
export const adminCreateStaff = (data: { firstName: string; lastName: string; email: string; password: string }) =>
  api.post<User>('/admin/users/staff', data);
export const adminActivateUser = (id: number) => api.put<void>(`/admin/users/${id}/activate`);
export const adminDeactivateUser = (id: number) => api.put<void>(`/admin/users/${id}/deactivate`);

// Analytics
export const adminGetOrderAnalytics = () => api.get<AnalyticsOrderCounts>('/admin/analytics/orders');
export const adminGetPopularItems = () => api.get<PopularItem[]>('/admin/analytics/popular-items');
export const adminGetRevenue = () => api.get<RevenueData>('/admin/analytics/revenue');

// Audit
export const adminGetAuditLogs = (params?: { page?: number; size?: number }) =>
  api.get<PageResponse<AuditLog>>('/admin/audit-logs', { params });
