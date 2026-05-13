import { useState, useEffect, useCallback } from 'react';
import { adminGetMenu, adminCreateMenuItem, adminUpdateMenuItem, adminDeleteMenuItem, adminGetStock } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { MenuItem, MenuCategory, StockItem } from '../../types';

const CATEGORIES: MenuCategory[] = ['KOTA', 'SIDE', 'DRINK', 'EXTRA'];

const emptyForm = {
  name: '',
  description: '',
  price: 0,
  category: 'KOTA' as MenuCategory,
  isAvailable: true,
  imageUrl: '',
  stockRequirements: [] as { stockId: number; stockItemName: string; quantityRequired: number }[],
};

export function MenuManagementPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState<number>(0);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  const fetchItems = useCallback(async () => {
    try {
      const [menuRes, stockRes] = await Promise.all([
        adminGetMenu(),
        adminGetStock()
      ]);
      setItems(menuRes.data);
      setStockItems(stockRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchItems();
      setLoading(false);
    };
    loadData();
  }, [fetchItems]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      isAvailable: item.isAvailable,
      imageUrl: item.imageUrl || '',
      stockRequirements: item.stockRequirements?.map(r => ({
        stockId: r.stockItemId,
        stockItemName: r.stockItemName,
        quantityRequired: r.quantityRequired
      })) || [],
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert('Please enter a menu item name');
      return;
    }
    if (form.price <= 0) {
      alert('Please enter a valid price');
      return;
    }
    if (form.stockRequirements.length === 0) {
      alert('Please add at least one ingredient to this menu item');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || '',
        price: form.price,
        category: form.category,
        isAvailable: form.isAvailable,
        imageUrl: form.imageUrl || undefined,
        stockRequirements: form.stockRequirements.map(req => ({
          stockItemName: req.stockItemName,
          quantityRequired: req.quantityRequired,
          unitOfMeasure: 'pieces',
          minimumStockLevel: 5,
          initialStockQuantity: 0
        }))
      };

      if (editing) {
        await adminUpdateMenuItem(editing.id, payload);
      } else {
        await adminCreateMenuItem(payload);
      }
      setShowForm(false);
      await fetchItems();
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this menu item? This will also remove all its ingredient associations.')) return;
    try {
      await adminDeleteMenuItem(id);
      await fetchItems();
      alert('Menu item deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete:', err);
      // Check if it's a foreign key constraint error
      if (err?.response?.data?.message?.includes('constraint') ||
          err?.response?.data?.message?.includes('foreign key')) {
        alert('Cannot delete: This menu item has associated orders or ingredients. Please remove all ingredients first.');
      } else {
        alert(err?.response?.data?.message || 'Failed to delete item.');
      }
    }
  };

  const addStockRequirement = () => {
    if (selectedStockId === 0) {
      alert('Please select a stock item');
      return;
    }
    const stockItem = stockItems.find(s => s.menuItemId === selectedStockId);
    if (!stockItem) return;

    if (form.stockRequirements.some(r => r.stockId === selectedStockId)) {
      alert('This ingredient is already added');
      return;
    }

    setForm({
      ...form,
      stockRequirements: [
        ...form.stockRequirements,
        {
          stockId: selectedStockId,
          stockItemName: stockItem.menuItemName,
          quantityRequired: selectedQuantity
        }
      ]
    });
    setSelectedStockId(0);
    setSelectedQuantity(1);
  };

  const removeStockRequirement = (stockId: number) => {
    setForm({
      ...form,
      stockRequirements: form.stockRequirements.filter(r => r.stockId !== stockId)
    });
  };

  const updateQuantity = (stockId: number, quantity: number) => {
    setForm({
      ...form,
      stockRequirements: form.stockRequirements.map(r =>
          r.stockId === stockId ? { ...r, quantityRequired: quantity } : r
      )
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <button onClick={openCreate} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium">
            + Add Item
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Price</th>
              <th className="text-left px-4 py-3 font-medium">Ingredients</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
            {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.category}</td>
                  <td className="px-4 py-3 text-amber-600 font-medium">R{item.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {item.stockRequirements?.length
                        ? `${item.stockRequirements.length} ingredient${item.stockRequirements.length !== 1 ? 's' : ''}`
                        : 'No ingredients'}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(item)} className="text-amber-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:underline">Delete</button>
                  </td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>

        {showForm && (
            <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
              <div className="bg-black/30 absolute inset-0" onClick={() => setShowForm(false)} />
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl relative z-50 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Menu Item' : 'Create Menu Item'}</h2>

                <div className="space-y-4">
                  <div className="border-b pb-3">
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="e.g., Chicken Kota"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                        <select
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value as MenuCategory })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (R) *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="0.00"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={2}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Describe the menu item..."
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                        <input
                            type="text"
                            value={form.imageUrl}
                            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="https://..."
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                              type="checkbox"
                              checked={form.isAvailable}
                              onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                              className="rounded w-4 h-4"
                          />
                          <span>Available for ordering</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-3">
                    <h3 className="text-md font-semibold text-gray-700 mb-3">🧂 Ingredients</h3>
                    <p className="text-xs text-gray-500 mb-3">Select what goes into this menu item and how much</p>

                    {form.stockRequirements.length > 0 && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Current Ingredients:</label>
                          <div className="space-y-2">
                            {form.stockRequirements.map((req) => (
                                <div key={req.stockId} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                                  <span className="flex-1 font-medium text-gray-700">{req.stockItemName}</span>
                                  <input
                                      type="number"
                                      value={req.quantityRequired}
                                      onChange={(e) => updateQuantity(req.stockId, Number(e.target.value))}
                                      className="w-20 border border-gray-300 rounded px-2 py-1 text-center"
                                      min="0.5"
                                      step="0.5"
                                  />
                                  <span className="text-sm text-gray-500">units</span>
                                  <button
                                      onClick={() => removeStockRequirement(req.stockId)}
                                      className="text-red-500 hover:text-red-700 text-sm px-2"
                                  >
                                    ✕ Remove
                                  </button>
                                </div>
                            ))}
                          </div>
                        </div>
                    )}

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Add Ingredient:</label>
                      <div className="flex gap-2">
                        <select
                            value={selectedStockId}
                            onChange={(e) => setSelectedStockId(Number(e.target.value))}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value={0}>-- Select ingredient --</option>
                          {stockItems
                              .filter(s => !form.stockRequirements.some(r => r.stockId === s.menuItemId))
                              .map((stock) => (
                                  <option key={stock.menuItemId} value={stock.menuItemId}>
                                    {stock.menuItemName} ({stock.currentStock} {stock.unitOfMeasure} in stock)
                                  </option>
                              ))}
                        </select>
                        <input
                            type="number"
                            value={selectedQuantity}
                            onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                            className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-center"
                            min="0.5"
                            step="0.5"
                            placeholder="Qty"
                        />
                        <button
                            onClick={addStockRequirement}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap"
                        >
                          + Add
                        </button>
                      </div>
                    </div>

                    {stockItems.length === 0 && (
                        <p className="text-xs text-amber-600 mt-2">
                          ⚠️ No stock items found. Go to Stock Management first to add ingredients.
                        </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={handleSave} disabled={saving} className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold">
                    {saving ? 'Saving...' : 'Save Menu Item'}
                  </button>
                  <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg font-semibold hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}