export type UserRole = 'STAFF' | 'ADMIN';

export interface User {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  token: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  name: string;
  email: string;
  role: UserRole;
}

export type MenuCategory = 'KOTA' | 'SIDE' | 'DRINK' | 'EXTRA';

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  isAvailable: boolean;
  imageUrl?: string;
  stockLevel?: number;
  stockRequirements?: {
    stockItemId: number;
    stockItemName: string;
    quantityRequired: number;
    unitOfMeasure: string;
  }[];
}

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

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
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  queuePosition?: number;
  specialInstructions?: string;
  items: OrderItem[];
  createdAt: string;
  completedAt?: string;
  studentName?: string;
  studentNumber?: string;
}

export interface PlaceOrderRequest {
  customerName: string;
  customerContact?: string;
  items: { menuItemId: number; quantity: number; customizations?: string }[];
  specialInstructions?: string;
}

export interface StockAlert {
  menuItemId: number;
  menuItemName: string;
  currentStock: number;
  minimumLevel: number;
  unitOfMeasure: string;
  stockStatus: string;
  lastRestockedDate?: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  customizations?: string;
}

export interface AnalyticsOrderCount {
  status: string;
  count: number;
}

export interface PopularItem {
  menuItemId: number;
  menuItemName: string;
  totalOrdered: number;
}

export interface RevenueStats {
  totalRevenue: number;
  orderCount: number;
  startDate: string;
  endDate: string;
}

export interface StockItem {
  menuItemId: number;
  menuItemName: string;
  currentStock: number;
  minimumLevel: number;
  unitOfMeasure: string;
  stockStatus: string;
  lastRestockedDate?: string;
}

export interface StockTransaction {
  id: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  adjustmentType: string;
  reason?: string;
  notes?: string;
  createdAt: string;
  performedBy?: string;
}

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  studentNumber?: string;
  residenceBlock?: string;
  active: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  action: string;
  performedBy: string;
  targetEntity?: string;
  details?: string;
  createdAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
