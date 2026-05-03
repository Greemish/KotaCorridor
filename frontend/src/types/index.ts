export type Role = 'STUDENT' | 'STAFF' | 'ADMIN';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type MenuCategory = 'KOTA' | 'SIDE' | 'DRINK' | 'EXTRA';
export type AdjustmentType = 'ADD' | 'REMOVE' | 'SET';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  roomNumber?: string;
  active: boolean;
}

export interface AuthResponse {
  token: string;
  role: Role;
  email: string;
  firstName: string;
  lastName: string;
  id: number;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  isAvailable: boolean;
  imageUrl?: string;
  stockQuantity: number;
}

export interface OrderItem {
  id: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  customizations?: string;
}

export interface Order {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  roomNumber?: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  customizations?: string;
}

export interface StockAlert {
  menuItemId: number;
  menuItemName: string;
  currentStock: number;
  threshold: number;
}

export interface StockTransaction {
  id: number;
  menuItemId: number;
  menuItemName: string;
  transactionType: string;
  quantity: number;
  notes?: string;
  createdAt: string;
  performedBy: string;
}

export interface AnalyticsOrderCounts {
  PENDING: number;
  PREPARING: number;
  READY: number;
  COMPLETED: number;
  CANCELLED: number;
}

export interface PopularItem {
  menuItemId: number;
  menuItemName: string;
  totalQuantity: number;
}

export interface RevenueData {
  totalRevenue: number;
  date?: string;
}

export interface AuditLog {
  id: number;
  action: string;
  performedBy: string;
  targetEntity: string;
  details?: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
