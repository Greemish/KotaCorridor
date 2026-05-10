import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/auth/LoginPage';
import MenuPage from './pages/student/MenuPage';
import OrdersPage from './pages/student/OrdersPage';
import TrackOrderPage from './pages/student/TrackOrderPage';
import QueuePage from './pages/staff/QueuePage';
import StockAlertsPage from './pages/staff/StockAlertsPage';
import DashboardPage from './pages/admin/DashboardPage';
import MenuManagementPage from './pages/admin/MenuManagementPage';
import AdminOrdersPage from './pages/admin/OrdersPage';
import StockPage from './pages/admin/StockPage';
import UsersPage from './pages/admin/UsersPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';

function RootRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/menu" replace />;
  if (user?.role === 'STAFF') return <Navigate to="/staff/queue" replace />;
  return <Navigate to="/admin/dashboard" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<TrackOrderPage />} />
            <Route path="/staff/queue" element={<ProtectedRoute roles={['STAFF', 'ADMIN']}><QueuePage /></ProtectedRoute>} />
            <Route path="/staff/stock-alerts" element={<ProtectedRoute roles={['STAFF', 'ADMIN']}><StockAlertsPage /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute roles={['ADMIN']}><DashboardPage /></ProtectedRoute>} />
            <Route path="/admin/menu" element={<ProtectedRoute roles={['ADMIN']}><MenuManagementPage /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute roles={['ADMIN']}><AdminOrdersPage /></ProtectedRoute>} />
            <Route path="/admin/stock" element={<ProtectedRoute roles={['ADMIN']}><StockPage /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><UsersPage /></ProtectedRoute>} />
            <Route path="/admin/audit-logs" element={<ProtectedRoute roles={['ADMIN']}><AuditLogsPage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
