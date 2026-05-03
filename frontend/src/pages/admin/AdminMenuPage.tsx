import React, { useEffect, useState } from 'react';
import { adminGetMenu, adminCreateMenuItem, adminUpdateMenuItem, adminDeleteMenuItem } from '../../api/admin';
import type { MenuItem, MenuCategory } from '../../types';

const emptyForm = {
  name: '',
  description: '',
  price: 0,
  category: 'KOTA' as MenuCategory,
  isAvailable: true,
  imageUrl: '',
  stockQuantity: 0,
};

const AdminMenuPage: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchItems = () => {
    adminGetMenu()
      .then((res) => setItems(res.data))
      .catch(() => setError('Failed to load menu items.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      isAvailable: item.isAvailable,
      imageUrl: item.imageUrl || '',
      stockQuantity: item.stockQuantity,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editItem) {
        await adminUpdateMenuItem(editItem.id, form);
      } else {
        await adminCreateMenuItem(form);
      }
      setShowForm(false);
      fetchItems();
    } catch {
      setError('Failed to save menu item.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item?')) return;
    try {
      await adminDeleteMenuItem(id);
      fetchItems();
    } catch {
      setError('Failed to delete item.');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Menu Management</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Item</button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editItem ? 'Edit Item' : 'New Menu Item'}</h2>
            <form onSubmit={handleSubmit}>
              {(['name', 'description', 'imageUrl'] as const).map((f) => (
                <div className="form-group" key={f}>
                  <label>{f}</label>
                  <input
                    value={form[f]}
                    onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))}
                    required={f !== 'imageUrl'}
                  />
                </div>
              ))}
              <div className="form-group">
                <label>Price (R)</label>
                <input type="number" step="0.01" value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))} required />
              </div>
              <div className="form-group">
                <label>Stock Quantity</label>
                <input type="number" value={form.stockQuantity}
                  onChange={(e) => setForm((p) => ({ ...p, stockQuantity: Number(e.target.value) }))} required />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as MenuCategory }))}>
                  {(['KOTA', 'SIDE', 'DRINK', 'EXTRA'] as MenuCategory[]).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group form-check">
                <label>
                  <input type="checkbox" checked={form.isAvailable}
                    onChange={(e) => setForm((p) => ({ ...p, isAvailable: e.target.checked }))} />
                  {' '}Available
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <table className="table">
        <thead>
          <tr>
            <th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Available</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.category}</td>
              <td>R{item.price.toFixed(2)}</td>
              <td>{item.stockQuantity}</td>
              <td>{item.isAvailable ? '✅' : '❌'}</td>
              <td>
                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(item)}>Edit</button>
                {' '}
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminMenuPage;
