import React, { useEffect, useState } from 'react';
import { adminGetAuditLogs } from '../../api/admin';
import type { AuditLog } from '../../types';

const AdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = (p = 0) => {
    setLoading(true);
    adminGetAuditLogs({ page: p, size: 25 })
      .then((res) => {
        setLogs(res.data.content);
        setTotalPages(res.data.totalPages);
      })
      .catch(() => setError('Failed to load audit logs.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="page-container">
      <h1>Audit Logs</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Action</th><th>Performed By</th><th>Target</th><th>Details</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.action}</td>
                  <td>{log.performedBy}</td>
                  <td>{log.targetEntity}</td>
                  <td>{log.details || '—'}</td>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button disabled={page === 0} onClick={() => { setPage(p => p - 1); fetchLogs(page - 1); }} className="btn btn-secondary">Previous</button>
            <span>Page {page + 1} of {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => { setPage(p => p + 1); fetchLogs(page + 1); }} className="btn btn-secondary">Next</button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAuditPage;
