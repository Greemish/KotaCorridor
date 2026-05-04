import { useState, useEffect } from 'react';
import { getStockAlerts } from '../../api/staff';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { StockAlert } from '../../types';

export default function StockAlertsPage() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStockAlerts()
      .then((res) => setAlerts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Stock Alerts</h1>
      {alerts.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">✅</p>
          <p>No stock alerts. All items are well stocked!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {alerts.map((alert) => (
            <div key={alert.menuItemId} className="bg-white rounded-xl shadow-sm border border-red-100 p-5">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-gray-900">{alert.menuItemName}</h3>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${alert.stockStatus === 'OUT_OF_STOCK' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {alert.stockStatus}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>Current: <span className="font-bold text-red-600">{alert.currentStock} {alert.unitOfMeasure}</span></p>
                <p>Minimum: {alert.minimumLevel} {alert.unitOfMeasure}</p>
                {alert.lastRestockedDate && <p className="text-xs text-gray-400">Last restocked: {new Date(alert.lastRestockedDate).toLocaleDateString()}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
