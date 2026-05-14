import { useState, useEffect } from 'react';
import { getOrder, cancelOrder } from '../../api/orders';
import OrderCard from '../../components/OrderCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Link } from 'react-router-dom';
import type { Order } from '../../types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const stored = localStorage.getItem('guest_order_ids');
      const ids: number[] = stored ? JSON.parse(stored) : [];
      const results = await Promise.all(ids.map((id) => getOrder(id).then((res) => res.data).catch(() => null)));
      setOrders(results.filter((o): o is Order => o !== null).sort((a, b) => b.id - a.id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchOrders(); }, []);

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this order?')) return;
    try {
      await cancelOrder(id);
      await fetchOrders();
    } catch {
      alert('Unable to cancel order.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Orders</h1>
        <Link to="/menu" className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + New Order
        </Link>
      </div>
      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">🥪</p>
          <p>No orders yet. <Link to="/menu" className="text-amber-600 hover:underline">Order your first kota!</Link></p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              actions={
                <>
                  <Link to={`/orders/${order.id}`} className="text-sm text-amber-600 hover:underline">Track</Link>
                  {(order.status === 'PENDING') && (
                    <button onClick={() => handleCancel(order.id)} className="text-sm text-red-500 hover:underline">Cancel</button>
                  )}
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
