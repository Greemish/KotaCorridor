import type { Order } from '../types';
import Badge from './Badge';

interface Props {
  order: Order;
  actions?: React.ReactNode;
}

export default function OrderCard({ order, actions }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-bold text-gray-900 text-lg">#{order.orderNumber}</p>
          {order.studentName && <p className="text-sm text-gray-500">{order.studentName}</p>}
          {order.queuePosition != null && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
            <p className="text-xs text-amber-600 font-medium">Queue #{order.queuePosition}</p>
          )}
        </div>
        <Badge status={order.status} />
      </div>
      <div className="divide-y divide-gray-50">
        {order.items.map((item) => (
          <div key={item.id} className="py-1.5 flex justify-between text-sm">
            <span className="text-gray-700">{item.quantity}× {item.menuItemName}</span>
            <span className="text-gray-500">R{item.subtotal.toFixed(2)}</span>
          </div>
        ))}
      </div>
      {order.specialInstructions && (
        <p className="mt-2 text-xs text-gray-500 italic">Note: {order.specialInstructions}</p>
      )}
      <div className="mt-3 flex justify-between items-center">
        <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</span>
        <span className="font-bold text-gray-900">R{order.totalAmount.toFixed(2)}</span>
      </div>
      {actions && <div className="mt-3 flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
