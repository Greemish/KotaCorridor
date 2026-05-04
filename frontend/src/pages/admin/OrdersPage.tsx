import { useState, useEffect } from 'react';
import { adminGetOrders, adminUpdateOrderStatus } from '../../api/admin';
import OrderCard from '../../components/OrderCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { Order, OrderStatus } from '../../types';

const STATUSES: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchOrders = () => {
    adminGetOrders({ status: statusFilter || undefined })
      .then((res) => setOrders(res.data.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setLoading(true); fetchOrders(); }, [statusFilter]);

  const handleStatus = async (id: number, status: OrderStatus) => {
    try {
      await adminUpdateOrderStatus(id, status);
      fetchOrders();
    } catch {
      alert('Failed to update status.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {orders.length === 0 ? (
        <p className="text-center py-12 text-gray-500">No orders found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              actions={
                <div className="flex flex-wrap gap-1">
                  {STATUSES.filter((s) => s !== order.status).map((s) => (
                    <button key={s} onClick={() => handleStatus(order.id, s)} className="text-xs bg-gray-100 hover:bg-amber-100 text-gray-700 px-2 py-1 rounded">
                      → {s}
                    </button>
                  ))}
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
