import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrder } from '../../api/orders';
import { useWebSocket } from '../../hooks/useWebSocket';
import OrderCard from '../../components/OrderCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { Order } from '../../types';

const STEPS = ['PENDING', 'PREPARING', 'READY', 'COMPLETED'];

export default function TrackOrderPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(() => {
    if (!id) return;
    getOrder(Number(id)).then((res) => setOrder(res.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const handleStatusUpdate = useCallback((msg: unknown) => {
    const updated = msg as Order;
    if (String(updated.id) === id) setOrder(updated);
  }, [id]);

  const subscriptions = useMemo(
    () => [{ topic: '/topic/orders/status', handler: handleStatusUpdate }],
    [handleStatusUpdate]
  );

  useWebSocket({ enabled: true, subscriptions });

  if (loading) return <LoadingSpinner />;
  if (!order) return <div className="text-center py-16 text-gray-500">Order not found.</div>;

  const currentStep = STEPS.indexOf(order.status);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/orders" className="text-amber-600 hover:underline text-sm">← My Orders</Link>
        <h1 className="text-2xl font-bold text-gray-900">Track Order</h1>
      </div>

      {order.status !== 'CANCELLED' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-4">Order Progress</h2>
          <div className="relative flex justify-between">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
            <div
              className="absolute top-4 left-0 h-0.5 bg-amber-500 z-0 transition-all duration-500"
              style={{ width: `${currentStep >= 0 ? (currentStep / (STEPS.length - 1)) * 100 : 0}%` }}
            />
            {STEPS.map((step, i) => (
              <div key={step} className="flex flex-col items-center z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${i <= currentStep ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span className={`mt-2 text-xs ${i <= currentStep ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <OrderCard order={order} />
    </div>
  );
}
