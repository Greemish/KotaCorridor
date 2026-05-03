import React, { useEffect, useState } from 'react';
import { adminGetOrders, adminUpdateOrderStatus } from '../../api/admin';
import type { Order, OrderStatus } from '../../types';

const statuses: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = (p = 0, status = statusFilter) => {
    setLoading(true);
    adminGetOrders({ page: p, size: 20, status: status || undefined })
      .then((res) => {
        setOrders(res.data.content);
        setTotalPages(res.data.totalPages);
      })
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleFilter = () => {
    setPage(0);
    fetchOrders(0, statusFilter);
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await adminUpdateOrderStatus(id, status);
      fetchOrders(page);
    } catch {
      setError('Failed to update status.');
    }
  };

  return (
    <div className="page-container">
      <h1>Orders Management</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="filter-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-primary" onClick={handleFilter}>Filter</button>
      </div>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Student</th><th>Room</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.studentName}</td>
                  <td>{order.roomNumber || '—'}</td>
                  <td>R{order.totalAmount.toFixed(2)}</td>
                  <td>{order.status}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button disabled={page === 0} onClick={() => { setPage(p => p - 1); fetchOrders(page - 1); }} className="btn btn-secondary">Previous</button>
            <span>Page {page + 1} of {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => { setPage(p => p + 1); fetchOrders(page + 1); }} className="btn btn-secondary">Next</button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminOrdersPage;
