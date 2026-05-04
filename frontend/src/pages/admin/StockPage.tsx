import { useState, useEffect } from 'react';
import { adminGetStock, adminRestockItem } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { StockItem } from '../../types';

export default function StockPage() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restockModal, setRestockModal] = useState<StockItem | null>(null);
  const [restockQty, setRestockQty] = useState(0);
  const [restockNotes, setRestockNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchStock = () => {
    adminGetStock().then((res) => setStock(res.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchStock(); }, []);

  const handleRestock = async () => {
    if (!restockModal) return;
    setSaving(true);
    try {
      await adminRestockItem(restockModal.menuItemId, { quantity: restockQty, notes: restockNotes });
      setRestockModal(null);
      setRestockQty(0);
      setRestockNotes('');
      fetchStock();
    } catch {
      alert('Failed to restock.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Stock Management</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Item</th>
              <th className="text-left px-4 py-3 font-medium">Current Stock</th>
              <th className="text-left px-4 py-3 font-medium">Minimum</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {stock.map((item) => (
              <tr key={item.menuItemId} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{item.menuItemName}</td>
                <td className="px-4 py-3 font-bold text-gray-900">{item.currentStock} {item.unitOfMeasure}</td>
                <td className="px-4 py-3 text-gray-500">{item.minimumLevel} {item.unitOfMeasure}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    item.stockStatus === 'OK' ? 'bg-green-100 text-green-700' :
                    item.stockStatus === 'OUT_OF_STOCK' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {item.stockStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setRestockModal(item); setRestockQty(0); setRestockNotes(''); }} className="text-amber-600 hover:underline text-sm">Restock</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {restockModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="bg-black/30 absolute inset-0" onClick={() => setRestockModal(null)} />
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative z-50">
            <h2 className="text-xl font-bold mb-4">Restock: {restockModal.menuItemName}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add</label>
                <input type="number" min="1" value={restockQty} onChange={(e) => setRestockQty(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input type="text" value={restockNotes} onChange={(e) => setRestockNotes(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Delivery reference..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleRestock} disabled={saving || restockQty <= 0} className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold">
                {saving ? 'Restocking...' : 'Restock'}
              </button>
              <button onClick={() => setRestockModal(null)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg font-semibold hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
