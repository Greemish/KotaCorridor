import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../../api/orders';
import type { Order } from '../../types';

const statusColors: Record<string, string> = {
  PENDING: '#f59e0b',
  PREPARING: '#3b82f6',
  READY: '#10b981',
  COMPLETED: '#6b7280',
  CANCELLED: '#ef4444',
};

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyOrders()
      .then((res) => setOrders(res.data))
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading orders...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="page-container">
      <h1>My Orders</h1>
      {orders.length === 0 ? (
        <div className="empty-state">No orders yet. <Link to="/menu">Order something!</Link></div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`} className="order-list-item">
              <div>
                <strong>Order #{order.id}</strong>
                <span> — {order.items.length} item(s) — R{order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="order-list-right">
                <span
                  className="order-status"
                  style={{ backgroundColor: statusColors[order.status] }}
                >
                  {order.status}
                </span>
                <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
