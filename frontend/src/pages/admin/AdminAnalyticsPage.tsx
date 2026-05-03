import React, { useEffect, useState } from 'react';
import { adminGetOrderAnalytics, adminGetPopularItems, adminGetRevenue } from '../../api/admin';
import type { AnalyticsOrderCounts, PopularItem, RevenueData } from '../../types';

const AdminAnalyticsPage: React.FC = () => {
  const [orderCounts, setOrderCounts] = useState<AnalyticsOrderCounts | null>(null);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([adminGetOrderAnalytics(), adminGetPopularItems(), adminGetRevenue()])
      .then(([ordersRes, popularRes, revenueRes]) => {
        setOrderCounts(ordersRes.data);
        setPopularItems(popularRes.data);
        setRevenue(revenueRes.data);
      })
      .catch(() => setError('Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading analytics...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="page-container">
      <h1>Analytics Dashboard</h1>
      <div className="analytics-grid">
        <div className="analytics-card">
          <h2>Revenue</h2>
          <p className="analytics-big">R{revenue?.totalRevenue?.toFixed(2) ?? '0.00'}</p>
        </div>
        <div className="analytics-card">
          <h2>Order Status Breakdown</h2>
          {orderCounts && (
            <table className="table">
              <thead><tr><th>Status</th><th>Count</th></tr></thead>
              <tbody>
                {Object.entries(orderCounts).map(([status, count]) => (
                  <tr key={status}>
                    <td>{status}</td>
                    <td>{count as number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="analytics-card">
          <h2>Popular Items</h2>
          <table className="table">
            <thead><tr><th>Item</th><th>Total Sold</th></tr></thead>
            <tbody>
              {popularItems.map((item) => (
                <tr key={item.menuItemId}>
                  <td>{item.menuItemName}</td>
                  <td>{item.totalQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
