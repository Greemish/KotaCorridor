import { useState, useEffect, useCallback, useMemo } from 'react';
import { getOrderQueue, updateOrderStatus } from '../../api/staff';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../hooks/useAuth';
import OrderCard from '../../components/OrderCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { Order, OrderStatus } from '../../types';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: 'PREPARING',
  PREPARING: 'READY',
  READY: 'COMPLETED',
};

export default function QueuePage() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchQueue = useCallback(() => {
    getOrderQueue()
      .then((res) => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const handleNewOrder = useCallback((msg: unknown) => {
    const order = msg as Order;
    setNotification(`🆕 New order #${order.orderNumber} received!`);
    setTimeout(() => setNotification(null), 5000);
    fetchQueue();
  }, [fetchQueue]);

  const handleStockAlert = useCallback((msg: unknown) => {
    const alert = msg as { menuItemName: string };
    setNotification(`⚠️ Low stock: ${alert.menuItemName}`);
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const subscriptions = useMemo(
    () => [
      { topic: '/topic/orders/new', handler: handleNewOrder },
      { topic: '/topic/stock/alerts', handler: handleStockAlert },
    ],
    [handleNewOrder, handleStockAlert]
  );

  useWebSocket({ enabled: isAuthenticated, subscriptions });

  const handleUpdateStatus = async (id: number, status: OrderStatus) => {
    try {
      await updateOrderStatus(id, status);
      fetchQueue();
    } catch {
      alert('Failed to update order status.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-amber-600 text-white px-5 py-3 rounded-xl shadow-lg max-w-sm">
          {notification}
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Order Queue</h1>
        <button onClick={fetchQueue} className="text-sm text-amber-600 hover:underline">↻ Refresh</button>
      </div>
      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">✅</p>
          <p>No active orders. All caught up!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              actions={
                <div className="flex gap-2 flex-wrap">
                  {NEXT_STATUS[order.status] && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, NEXT_STATUS[order.status]!)}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                    >
                      → {NEXT_STATUS[order.status]}
                    </button>
                  )}
                  {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
