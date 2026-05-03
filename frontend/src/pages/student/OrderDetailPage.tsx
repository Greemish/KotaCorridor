import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMyOrder, cancelOrder } from '../../api/orders';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { Order } from '../../types';

const statusColors: Record<string, string> = {
  PENDING: '#f59e0b',
  PREPARING: '#3b82f6',
  READY: '#10b981',
  COMPLETED: '#6b7280',
  CANCELLED: '#ef4444',
};

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchOrder = useCallback(() => {
    if (!id) return;
    getMyOrder(Number(id))
      .then((res) => setOrder(res.data))
      .catch(() => setError('Failed to load order.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useWebSocket({
    enabled: !!id,
    subscriptions: [
      {
        topic: `/topic/orders/status/${id}`,
        callback: (body) => {
          try {
            const updated = JSON.parse(body) as Order;
            setOrder(updated);
          } catch {
            fetchOrder();
          }
        },
      },
    ],
  });

  const handleCancel = async () => {
    if (!id) return;
    try {
      await cancelOrder(Number(id));
      fetchOrder();
    } catch {
      setError('Could not cancel order.');
    }
  };

  if (loading) return <div className="loading">Loading order...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!order) return <div className="alert alert-error">Order not found.</div>;

  return (
    <div className="page-container">
      <button className="btn btn-secondary" onClick={() => navigate('/orders')}>← Back</button>
      <h1>Order #{order.id}</h1>
      <div className="order-detail-status">
        <span className="order-status-large" style={{ backgroundColor: statusColors[order.status] }}>
          {order.status}
        </span>
        <p className="order-status-hint">
          {order.status === 'PENDING' && 'Your order is waiting to be prepared.'}
          {order.status === 'PREPARING' && 'Your order is being prepared!'}
          {order.status === 'READY' && '🎉 Your order is ready for collection!'}
          {order.status === 'COMPLETED' && 'Order completed.'}
          {order.status === 'CANCELLED' && 'This order was cancelled.'}
        </p>
      </div>
      <div className="order-detail-items">
        <h2>Items</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.menuItemName}{item.customizations && ` (${item.customizations})`}</td>
                <td>{item.quantity}</td>
                <td>R{item.unitPrice.toFixed(2)}</td>
                <td>R{item.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}><strong>Total</strong></td>
              <td><strong>R{order.totalAmount.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
      {order.specialInstructions && (
        <p><strong>Special Instructions:</strong> {order.specialInstructions}</p>
      )}
      <p className="order-time">Placed: {new Date(order.createdAt).toLocaleString()}</p>
      {order.status === 'PENDING' && (
        <button className="btn btn-danger" onClick={handleCancel}>Cancel Order</button>
      )}
    </div>
  );
};

export default OrderDetailPage;
