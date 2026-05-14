import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
      <nav className="bg-amber-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">🍔</span>
              <span className="font-bold text-xl text-white">KotaCorridor</span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-6">
              {/* STUDENT links */}
              {user?.role === 'STUDENT' && (
                  <>
                    <Link to="/menu" className="text-white hover:text-gray-100 transition-colors">
                      Menu
                    </Link>
                    <Link to="/orders" className="text-white hover:text-gray-100 transition-colors">
                      My Orders
                    </Link>
                  </>
              )}

              {/* STAFF links */}
              {user?.role === 'STAFF' && (
                  <>
                    <Link to="/menu" className="text-white hover:text-gray-100 transition-colors">
                      Menu
                    </Link>
                    <Link to="/staff/queue" className="text-white hover:text-gray-100 transition-colors">
                      Queue
                    </Link>
                    <Link to="/display" className="text-white hover:text-gray-100 transition-colors">
                      Display
                    </Link>
                  </>
              )}

              {/* ADMIN links */}
              {user?.role === 'ADMIN' && (
                  <>
                    <Link to="/admin/dashboard" className="text-white hover:text-gray-100 transition-colors">
                      Dashboard
                    </Link>
                    <Link to="/admin/menu" className="text-white hover:text-gray-100 transition-colors">
                      Menu
                    </Link>
                    <Link to="/admin/orders" className="text-white hover:text-gray-100 transition-colors">
                      Orders
                    </Link>
                    <Link to="/admin/stock" className="text-white hover:text-gray-100 transition-colors">
                      Stock
                    </Link>
                    <Link to="/admin/users" className="text-white hover:text-gray-100 transition-colors">
                      Users
                    </Link>
                    <Link to="/admin/audit-logs" className="text-white hover:text-gray-100 transition-colors">
                      Audit
                    </Link>
                    <Link to="/display" className="text-white hover:text-gray-100 transition-colors">
                      Display
                    </Link>
                  </>
              )}

              {/* User Info & Logout */}
              <div className="ml-4 flex items-center gap-3 pl-4 border-l border-amber-500">
              <span className="text-sm text-white">
                {user?.name}
              </span>
                <button
                    onClick={handleLogout}
                    className="bg-white hover:bg-gray-100 text-amber-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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