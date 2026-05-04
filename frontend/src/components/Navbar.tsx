import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-amber-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <span>🥪</span>
            <span>KotaCorridor</span>
          </Link>
          <div className="flex items-center gap-4">
            {user?.role === 'STUDENT' && (
              <>
                <Link to="/menu" className="hover:text-amber-200 text-sm font-medium">Menu</Link>
                <Link to="/orders" className="hover:text-amber-200 text-sm font-medium">My Orders</Link>
              </>
            )}
            {(user?.role === 'STAFF' || user?.role === 'ADMIN') && (
              <>
                <Link to="/staff/queue" className="hover:text-amber-200 text-sm font-medium">Queue</Link>
                <Link to="/staff/stock-alerts" className="hover:text-amber-200 text-sm font-medium">Stock Alerts</Link>
              </>
            )}
            {user?.role === 'ADMIN' && (
              <>
                <Link to="/admin/dashboard" className="hover:text-amber-200 text-sm font-medium">Dashboard</Link>
                <Link to="/admin/menu" className="hover:text-amber-200 text-sm font-medium">Menu Mgmt</Link>
                <Link to="/admin/users" className="hover:text-amber-200 text-sm font-medium">Users</Link>
              </>
            )}
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-amber-500">
              <span className="text-sm text-amber-200">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-amber-700 hover:bg-amber-800 px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
