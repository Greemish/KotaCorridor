import { useState, useEffect, useCallback } from 'react';
import { adminGetStock, adminGetLowStock, adminRestockItem, adminAdjustStock, adminCreateStock } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { StockItem } from '../../types';

export default function StockPage() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [lowStock, setLowStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [adjustmentType, setAdjustmentType] = useState('ADD');
  const [reason, setReason] = useState('');

  const [newStock, setNewStock] = useState({
    itemName: '',
    quantityInStock: 0,
    minimumStockLevel: 10,
    unitOfMeasure: 'pieces'
  });

  const fetchData = useCallback(async () => {
    try {
      const [stockRes, lowStockRes] = await Promise.all([
        adminGetStock(),
        adminGetLowStock()
      ]);
      setStock(stockRes.data);
      setLowStock(lowStockRes.data);
    } catch (error) {
      console.error('Error fetching stock:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchData();
    };
    loadData();
  }, [fetchData]);

  const handleCreateStock = async () => {
    if (!newStock.itemName.trim()) {
      alert('Please enter an ingredient name');
      return;
    }
    if (newStock.quantityInStock < 0) {
      alert('Quantity cannot be negative');
      return;
    }
    if (newStock.minimumStockLevel <= 0) {
      alert('Minimum stock level must be greater than 0');
      return;
    }

    try {
      await adminCreateStock({
        itemName: newStock.itemName.trim(),
        quantityInStock: newStock.quantityInStock,
        minimumStockLevel: newStock.minimumStockLevel,
        unitOfMeasure: newStock.unitOfMeasure
      });
      setShowAddStockModal(false);
      setNewStock({
        itemName: '',
        quantityInStock: 0,
        minimumStockLevel: 10,
        unitOfMeasure: 'pieces'
      });
      setLoading(true);
      await fetchData();
      alert('Stock item added successfully!');
    } catch (error) {
      console.error('Failed to create stock:', error);
      //alert(error?.response?.data?.message || 'Failed to add stock item');
      alert('Failed to create stock')
      setLoading(false);
    }
  };

  const handleRestock = async () => {
    if (!selectedItem || quantity <= 0) return;
    try {
      await adminRestockItem(selectedItem.menuItemId, {
        quantity: quantity,
        notes: `Restocked ${quantity} ${selectedItem.unitOfMeasure}`
      });
      setShowRestockModal(false);
      setQuantity(0);
      setSelectedItem(null);
      setLoading(true);
      await fetchData();
    } catch (error) {
      console.error('Failed to restock',error)
      alert('Failed to restock');
      setLoading(false);
    }
  };

  const handleAdjust = async () => {
    if (!selectedItem || quantity <= 0) return;
    try {
      await adminAdjustStock(selectedItem.menuItemId, {
        quantity: quantity,
        adjustmentType: adjustmentType,
        reason: reason
      });
      setShowAdjustModal(false);
      setQuantity(0);
      setReason('');
      setSelectedItem(null);
      setLoading(true);
      await fetchData();
    } catch (error) {
      alert('Failed to adjust stock');
      console.error('Failed to adjust stock',error);
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  const getStockStatus = (item: StockItem) => {
    if (item.currentStock === 0) {
      return { color: 'text-red-600', bg: 'bg-red-100', text: 'Out of Stock' };
    }
    if (item.currentStock < item.minimumLevel) {
      return { color: 'text-orange-600', bg: 'bg-orange-100', text: 'Low Stock' };
    }
    return { color: 'text-green-600', bg: 'bg-green-100', text: 'In Stock' };
  };

  const getPercentage = (item: StockItem) => {
    return Math.min(100, (item.currentStock / item.minimumLevel) * 100);
  };

  if (loading) return <LoadingSpinner />;

  return (
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
          <div className="flex gap-2">
            <button
                onClick={() => setShowAddStockModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg"
            >
              + Add Ingredient
            </button>
            <button
                onClick={handleRefresh}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {lowStock.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <h2 className="text-red-800 font-semibold mb-3">⚠️ Low Stock Alerts</h2>
              <div className="space-y-2">
                {lowStock.map(item => (
                    <div key={item.menuItemId} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-red-800">{item.menuItemName}</span>
                        <span className="text-sm text-red-600 ml-2">
                    {item.currentStock} / {item.minimumLevel} {item.unitOfMeasure}
                  </span>
                      </div>
                      <button
                          onClick={() => {
                            setSelectedItem(item);
                            setQuantity(item.minimumLevel * 2);
                            setShowRestockModal(true);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Restock Now
                      </button>
                    </div>
                ))}
              </div>
            </div>
        )}

        {/* Stock Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Ingredient</th>
                <th className="text-left px-4 py-3 font-medium">Current Stock</th>
                <th className="text-left px-4 py-3 font-medium">Min Level</th>
                <th className="text-left px-4 py-3 font-medium">Unit</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
              {stock.map((item) => {
                const status = getStockStatus(item);
                const percentage = getPercentage(item);
                return (
                    <tr key={item.menuItemId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.menuItemName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${status.color}`}>{item.currentStock}</span>
                          <div className="flex-1 max-w-32 bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all ${
                                    percentage < 30 ? 'bg-red-500' : percentage < 60 ? 'bg-orange-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{item.minimumLevel}</td>
                      <td className="px-4 py-3 text-gray-500">{item.unitOfMeasure}</td>
                      <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        {status.text}
                      </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                            onClick={() => {
                              setSelectedItem(item);
                              setQuantity(item.minimumLevel);
                              setShowRestockModal(true);
                            }}
                            className="text-green-600 hover:text-green-700 text-sm"
                        >
                          Restock
                        </button>
                        <button
                            onClick={() => {
                              setSelectedItem(item);
                              setQuantity(1);
                              setAdjustmentType('REMOVE');
                              setReason('');
                              setShowAdjustModal(true);
                            }}
                            className="text-orange-600 hover:text-orange-700 text-sm"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Stock Modal */}
        {showAddStockModal && (
            <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
              <div className="bg-black/30 absolute inset-0" onClick={() => setShowAddStockModal(false)} />
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative z-50">
                <h2 className="text-xl font-bold mb-4">Add New Ingredient</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ingredient Name *</label>
                    <input
                        type="text"
                        value={newStock.itemName}
                        onChange={(e) => setNewStock({ ...newStock, itemName: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="e.g., White Bread Slices"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure *</label>
                    <select
                        value={newStock.unitOfMeasure}
                        onChange={(e) => setNewStock({ ...newStock, unitOfMeasure: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="pieces">Pieces</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="grams">Grams (g)</option>
                      <option value="liters">Liters (L)</option>
                      <option value="slices">Slices</option>
                      <option value="heads">Heads</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity</label>
                    <input
                        type="number"
                        value={newStock.quantityInStock}
                        onChange={(e) => setNewStock({ ...newStock, quantityInStock: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Level</label>
                    <input
                        type="number"
                        value={newStock.minimumStockLevel}
                        onChange={(e) => setNewStock({ ...newStock, minimumStockLevel: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        min="1"
                    />
                    <p className="text-xs text-gray-400 mt-1">Alert when stock falls below this level</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={handleCreateStock} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg font-semibold">
                    Add Ingredient
                  </button>
                  <button onClick={() => setShowAddStockModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg font-semibold hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Restock Modal */}
        {showRestockModal && selectedItem && (
            <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
              <div className="bg-black/30 absolute inset-0" onClick={() => setShowRestockModal(false)} />
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative z-50">
                <h2 className="text-xl font-bold mb-4">Restock: {selectedItem.menuItemName}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                    <p className="text-gray-900">{selectedItem.currentStock} {selectedItem.unitOfMeasure}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add</label>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">After Restock</label>
                    <p className="text-green-600 font-semibold">
                      {selectedItem.currentStock + quantity} {selectedItem.unitOfMeasure}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={handleRestock} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg font-semibold">
                    Confirm Restock
                  </button>
                  <button onClick={() => setShowRestockModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg font-semibold hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Adjust Modal */}
        {showAdjustModal && selectedItem && (
            <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
              <div className="bg-black/30 absolute inset-0" onClick={() => setShowAdjustModal(false)} />
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative z-50">
                <h2 className="text-xl font-bold mb-4">Adjust Stock: {selectedItem.menuItemName}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
                    <select
                        value={adjustmentType}
                        onChange={(e) => setAdjustmentType(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="ADD">Add Stock (Found extra)</option>
                      <option value="REMOVE">Remove Stock (Waste/Damage)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Damaged, Expired, Count correction"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
                    <p className={`font-semibold ${adjustmentType === 'ADD' ? 'text-green-600' : 'text-red-600'}`}>
                      {adjustmentType === 'ADD'
                          ? `${selectedItem.currentStock + quantity} ${selectedItem.unitOfMeasure}`
                          : `${selectedItem.currentStock - quantity} ${selectedItem.unitOfMeasure}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={handleAdjust} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg font-semibold">
                    Confirm Adjustment
                  </button>
                  <button onClick={() => setShowAdjustModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg font-semibold hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}