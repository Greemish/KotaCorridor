import React from 'react';
import type { Order } from '../types';

interface OrderCardProps {
  order: Order;
  showActions?: boolean;
  onStatusChange?: (status: string) => void;
  onCancel?: () => void;
}

const statusColors: Record<string, string> = {
  PENDING: '#f59e0b',
  PREPARING: '#3b82f6',
  READY: '#10b981',
  COMPLETED: '#6b7280',
  CANCELLED: '#ef4444',
};

const nextStatus: Record<string, string | null> = {
  PENDING: 'PREPARING',
  PREPARING: 'READY',
  READY: 'COMPLETED',
  COMPLETED: null,
  CANCELLED: null,
};

const OrderCard: React.FC<OrderCardProps> = ({ order, showActions, onStatusChange, onCancel }) => {
  const next = nextStatus[order.status];

  return (
    <div className="order-card">
      <div className="order-card-header">
        <span className="order-id">Order #{order.id}</span>
        <span
          className="order-status"
          style={{ backgroundColor: statusColors[order.status] }}
        >
          {order.status}
        </span>
      </div>
      <div className="order-card-body">
        <p><strong>Student:</strong> {order.studentName} {order.roomNumber && `(Room ${order.roomNumber})`}</p>
        <p><strong>Total:</strong> R{order.totalAmount.toFixed(2)}</p>
        {order.specialInstructions && (
          <p><strong>Instructions:</strong> {order.specialInstructions}</p>
        )}
        <ul className="order-items-list">
          {order.items.map((item) => (
            <li key={item.id}>
              {item.quantity}x {item.menuItemName} — R{item.subtotal.toFixed(2)}
              {item.customizations && <span className="customizations"> ({item.customizations})</span>}
            </li>
          ))}
        </ul>
        <p className="order-time">
          {new Date(order.createdAt).toLocaleString()}
        </p>
      </div>
      {showActions && (
        <div className="order-card-actions">
          {next && onStatusChange && (
            <button
              className="btn btn-primary"
              onClick={() => onStatusChange(next)}
            >
              Mark {next}
            </button>
          )}
          {order.status === 'PENDING' && onCancel && (
            <button className="btn btn-danger" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
