import React, { useEffect, useState } from 'react';
import { getQueue, updateOrderStatus } from '../../api/staff';
import { useWebSocket } from '../../hooks/useWebSocket';
import OrderCard from '../../components/OrderCard';
import type { Order } from '../../types';

const QueuePage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQueue = () => {
    getQueue()
      .then((res) => setOrders(res.data))
      .catch(() => setError('Failed to load queue.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  useWebSocket({
    enabled: true,
    subscriptions: [
      {
        topic: '/topic/orders/new',
        callback: () => fetchQueue(),
      },
    ],
  });

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await updateOrderStatus(orderId, status);
      fetchQueue();
    } catch {
      setError('Failed to update order status.');
    }
  };

  if (loading) return <div className="loading">Loading queue...</div>;

  return (
    <div className="page-container">
      <h1>Order Queue</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {orders.length === 0 ? (
        <div className="empty-state">No active orders in queue.</div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              showActions
              onStatusChange={(status) => handleStatusChange(order.id, status)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QueuePage;
