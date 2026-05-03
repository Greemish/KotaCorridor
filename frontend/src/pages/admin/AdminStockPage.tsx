import React, { useEffect, useState } from 'react';
import { adminGetStock, adminRestockItem, adminGetStockTransactions } from '../../api/admin';
import type { MenuItem, StockTransaction } from '../../types';

const AdminStockPage: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restockId, setRestockId] = useState<number | null>(null);
  const [restockQty, setRestockQty] = useState(0);
  const [restockNotes, setRestockNotes] = useState('');

  const fetchData = () => {
    Promise.all([adminGetStock(), adminGetStockTransactions()])
      .then(([stockRes, txRes]) => {
        setItems(stockRes.data);
        setTransactions(txRes.data.content);
      })
      .catch(() => setError('Failed to load stock data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (restockId === null) return;
    try {
      await adminRestockItem(restockId, { quantity: restockQty, notes: restockNotes });
      setRestockId(null);
      setRestockQty(0);
      setRestockNotes('');
      fetchData();
    } catch {
      setError('Failed to restock.');
    }
  };

  if (loading) return <div className="loading">Loading stock...</div>;

  return (
    <div className="page-container">
      <h1>Stock Management</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <table className="table">
        <thead>
          <tr>
            <th>Item</th><th>Category</th><th>Stock</th><th>Available</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={item.stockQuantity <= 5 ? 'row-warning' : ''}>
              <td>{item.name}</td>
              <td>{item.category}</td>
              <td>{item.stockQuantity}</td>
              <td>{item.isAvailable ? '✅' : '❌'}</td>
              <td>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => { setRestockId(item.id); setRestockQty(10); }}
                >
                  Restock
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {restockId !== null && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Restock Item</h2>
            <form onSubmit={handleRestock}>
              <div className="form-group">
                <label>Quantity to Add</label>
                <input type="number" value={restockQty} min={1}
                  onChange={(e) => setRestockQty(Number(e.target.value))} required />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input value={restockNotes} onChange={(e) => setRestockNotes(e.target.value)} />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Restock</button>
                <button type="button" className="btn btn-secondary" onClick={() => setRestockId(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <h2 style={{ marginTop: '2rem' }}>Recent Transactions</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Item</th><th>Type</th><th>Qty</th><th>Notes</th><th>By</th><th>Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td>{tx.menuItemName}</td>
              <td>{tx.transactionType}</td>
              <td>{tx.quantity}</td>
              <td>{tx.notes || '—'}</td>
              <td>{tx.performedBy}</td>
              <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminStockPage;
