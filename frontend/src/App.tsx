import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MenuPage from './pages/student/MenuPage';
import CartPage from './pages/student/CartPage';
import OrdersPage from './pages/student/OrdersPage';
import OrderDetailPage from './pages/student/OrderDetailPage';
import QueuePage from './pages/staff/QueuePage';
import StockAlertsPage from './pages/staff/StockAlertsPage';
import AdminMenuPage from './pages/admin/AdminMenuPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminStockPage from './pages/admin/AdminStockPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminAuditPage from './pages/admin/AdminAuditPage';

const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'STUDENT') return <Navigate to="/menu" replace />;
  if (user?.role === 'STAFF') return <Navigate to="/staff/queue" replace />;
  return <Navigate to="/admin/menu" replace />;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/menu" element={<ProtectedRoute roles={['STUDENT']}><MenuPage /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute roles={['STUDENT']}><CartPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute roles={['STUDENT']}><OrdersPage /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute roles={['STUDENT']}><OrderDetailPage /></ProtectedRoute>} />
            <Route path="/staff/queue" element={<ProtectedRoute roles={['STAFF', 'ADMIN']}><QueuePage /></ProtectedRoute>} />
            <Route path="/staff/stock" element={<ProtectedRoute roles={['STAFF', 'ADMIN']}><StockAlertsPage /></ProtectedRoute>} />
            <Route path="/admin/menu" element={<ProtectedRoute roles={['ADMIN']}><AdminMenuPage /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute roles={['ADMIN']}><AdminOrdersPage /></ProtectedRoute>} />
            <Route path="/admin/stock" element={<ProtectedRoute roles={['ADMIN']}><AdminStockPage /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><AdminUsersPage /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute roles={['ADMIN']}><AdminAnalyticsPage /></ProtectedRoute>} />
            <Route path="/admin/audit" element={<ProtectedRoute roles={['ADMIN']}><AdminAuditPage /></ProtectedRoute>} />
            <Route path="/unauthorized" element={<div className="page-container"><h1>Unauthorized</h1><p>You do not have permission to view this page.</p></div>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
