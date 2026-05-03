import React, { useEffect, useState } from 'react';
import { getStockAlerts } from '../../api/staff';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { StockAlert } from '../../types';

const StockAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAlerts = () => {
    getStockAlerts()
      .then((res) => setAlerts(res.data))
      .catch(() => setError('Failed to load stock alerts.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  useWebSocket({
    enabled: true,
    subscriptions: [
      { topic: '/topic/stock/alerts', callback: () => fetchAlerts() },
    ],
  });

  if (loading) return <div className="loading">Loading alerts...</div>;

  return (
    <div className="page-container">
      <h1>Stock Alerts</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {alerts.length === 0 ? (
        <div className="empty-state success">All stock levels are healthy ✅</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Current Stock</th>
              <th>Threshold</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.menuItemId}>
                <td>{alert.menuItemName}</td>
                <td>{alert.currentStock}</td>
                <td>{alert.threshold}</td>
                <td>
                  <span className={`badge ${alert.currentStock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                    {alert.currentStock === 0 ? 'Out of Stock' : 'Low Stock'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StockAlertsPage;
