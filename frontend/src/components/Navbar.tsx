import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🥪 KotaCorridor</Link>
      </div>
      <div className="navbar-links">
        {user?.role === 'STUDENT' && (
          <>
            <Link to="/menu">Menu</Link>
            <Link to="/cart">Cart {totalItems > 0 && <span className="badge">{totalItems}</span>}</Link>
            <Link to="/orders">My Orders</Link>
          </>
        )}
        {(user?.role === 'STAFF' || user?.role === 'ADMIN') && (
          <>
            <Link to="/staff/queue">Queue</Link>
            <Link to="/staff/stock">Stock Alerts</Link>
          </>
        )}
        {user?.role === 'ADMIN' && (
          <>
            <Link to="/admin/menu">Menu Mgmt</Link>
            <Link to="/admin/orders">Orders</Link>
            <Link to="/admin/stock">Stock</Link>
            <Link to="/admin/users">Users</Link>
            <Link to="/admin/analytics">Analytics</Link>
            <Link to="/admin/audit">Audit</Link>
          </>
        )}
      </div>
      <div className="navbar-user">
        <span>{user?.firstName} ({user?.role})</span>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
