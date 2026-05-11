import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminGetOrderAnalytics, adminGetPopularItems, adminGetRevenue } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { AnalyticsOrderCount, PopularItem, RevenueStats } from '../../types';

export default function DashboardPage() {
  const [orderStats, setOrderStats] = useState<AnalyticsOrderCount[]>([]);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminGetOrderAnalytics(),
      adminGetPopularItems(),
      adminGetRevenue(),
    ]).then(([ordersResponse, popularResponse, revenueResponse]) => {
      const orderData = ordersResponse?.data;
      const popularData = popularResponse?.data;

      console.log('Raw order data:', orderData);
      console.log('Raw popular data:', popularData);

      // TRANSFORM: Convert object {COMPLETED: 4, PENDING: 3} to array [{status: 'COMPLETED', count: 4}, ...]
      let transformedOrderStats: AnalyticsOrderCount[] = [];

      if (orderData && typeof orderData === 'object' && !Array.isArray(orderData)) {
        // It's an object with status keys
        transformedOrderStats = Object.keys(orderData).map(status => ({
          status: status,
          count: orderData[status]
        }));
      } else if (Array.isArray(orderData)) {
        // It's already an array
        transformedOrderStats = orderData;
      }

      // Transform popular items if needed (similar pattern)
      let transformedPopularItems: PopularItem[] = [];
      if (Array.isArray(popularData)) {
        transformedPopularItems = popularData;
      } else if (popularData && typeof popularData === 'object') {
        // If popular items also comes as object
        transformedPopularItems = Object.keys(popularData).map(key => ({
          menuItemId: parseInt(key),
          menuItemName: key,
          totalOrdered: popularData[key]
        }));
      }

      console.log('Transformed order stats:', transformedOrderStats);
      console.log('Transformed popular items:', transformedPopularItems);

      setOrderStats(transformedOrderStats);
      setPopularItems(transformedPopularItems);
      setRevenue(revenueResponse?.data || null);

    }).catch((err) => {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      setOrderStats([]);
      setPopularItems([]);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Error loading dashboard: {error}</p>
            <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
    );
  }

  // Calculate totals (now safe because orderStats is array)
  const totalOrders = orderStats.reduce((s, o) => s + (o?.count || 0), 0);
  const completedOrders = orderStats.find(o => o?.status === 'COMPLETED')?.count || 0;

  return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="text-sm text-amber-700 font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-amber-800 mt-1">
              R{revenue?.totalRevenue?.toFixed(2) ?? '0.00'}
            </p>
            <p className="text-xs text-amber-600 mt-1">{revenue?.orderCount ?? 0} completed orders</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <p className="text-sm text-blue-700 font-medium">Total Orders</p>
            <p className="text-3xl font-bold text-blue-800 mt-1">{totalOrders}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <p className="text-sm text-green-700 font-medium">Completed Orders</p>
            <p className="text-3xl font-bold text-green-800 mt-1">{completedOrders}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Orders by Status</h2>
            <div className="space-y-2">
              {orderStats.map((stat) => (
                  <div key={stat.status} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{stat.status}</span>
                    <span className="font-semibold">{stat.count}</span>
                  </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Popular Items</h2>
            <div className="space-y-2">
              {popularItems.slice(0, 8).map((item, i) => (
                  <div key={item.menuItemId} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{i + 1}. {item.menuItemName}</span>
                    <span className="font-semibold text-amber-600">{item.totalOrdered} orders</span>
                  </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { to: '/admin/menu', label: '🍔 Menu', desc: 'Manage items' },
            { to: '/admin/orders', label: '📋 Orders', desc: 'All orders' },
            { to: '/admin/stock', label: '📦 Stock', desc: 'Inventory' },
            { to: '/admin/users', label: '👥 Users', desc: 'Manage users' },
            { to: '/admin/audit-logs', label: '📝 Audit', desc: 'Audit logs' },
            { to: '/staff/queue', label: '🔢 Queue', desc: 'Live queue' },
          ].map((link) => (
              <Link key={link.to} to={link.to} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:border-amber-300 hover:shadow-md transition-all text-center">
                <p className="text-xl mb-1">{link.label}</p>
                <p className="text-xs text-gray-500">{link.desc}</p>
              </Link>
          ))}
        </div>
      </div>
  );
}