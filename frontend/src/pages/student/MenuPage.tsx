import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAvailableMenu } from '../../api/menu';
import { placeOrder } from '../../api/orders';
import MenuItemCard from '../../components/MenuItemCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { MenuItem, CartItem, MenuCategory, Order } from '../../types';

const CATEGORIES: MenuCategory[] = ['KOTA', 'SIDE', 'DRINK', 'EXTRA'];

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('KOTA');
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');

  useEffect(() => {
    getAvailableMenu()
      .then((res) => setItems(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStatusUpdate = useCallback((msg: unknown) => {
    const order = msg as Order;
    setNotification(`Order #${order.orderNumber} is now ${order.status}`);
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const subscriptions = useMemo(
    () => [{ topic: '/topic/orders/status', handler: handleStatusUpdate }],
    [handleStatusUpdate]
  );

  useWebSocket({ enabled: true, subscriptions });

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) return prev.map((c) => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItem: item, quantity: 1 }];
    });
    setShowCart(true);
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) => prev.map((c) => c.menuItem.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter((c) => c.quantity > 0));
  };

  const total = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!cart.length) return;
    if (!customerName.trim()) {
      setNotification('❌ Please enter your name before placing an order.');
      setTimeout(() => setNotification(null), 5000);
      return;
    }
    setPlacing(true);
    try {
      const res = await placeOrder({
        customerName: customerName.trim(),
        customerContact: customerContact.trim() || undefined,
        items: cart.map((c) => ({ menuItemId: c.menuItem.id, quantity: c.quantity, customizations: c.customizations })),
        specialInstructions: specialInstructions || undefined,
      });
      const existing = localStorage.getItem('guest_order_ids');
      const ids: number[] = existing ? JSON.parse(existing) : [];
      if (!ids.includes(res.data.id)) {
        localStorage.setItem('guest_order_ids', JSON.stringify([res.data.id, ...ids].slice(0, 50)));
      }
      setNotification(`✅ Order #${res.data.orderNumber} placed! Queue position: ${res.data.queuePosition ?? 'N/A'}`);
      setTimeout(() => setNotification(null), 6000);
      setCart([]);
      setSpecialInstructions('');
      setShowCart(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setNotification(`❌ ${axiosErr.response?.data?.message || 'Failed to place order'}`);
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setPlacing(false);
    }
  };

  const categoryItems = items.filter((i) => i.category === activeCategory);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="relative">
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-amber-600 text-white px-5 py-3 rounded-xl shadow-lg max-w-sm">
          {notification}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Our Menu</h1>
        <button
          onClick={() => setShowCart(true)}
          className="relative bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
        >
          🛒 Cart
          {cart.length > 0 && (
            <span className="bg-white text-amber-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {cart.reduce((s, c) => s + c.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-amber-600 text-white' : 'bg-white text-gray-600 hover:bg-amber-50'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {categoryItems.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No items in this category right now.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {categoryItems.map((item) => (
            <MenuItemCard key={item.id} item={item} onAdd={addToCart} />
          ))}
        </div>
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="bg-black/30 flex-1" onClick={() => setShowCart(false)} />
          <div className="bg-white w-full max-w-md shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-xl font-bold">Your Cart</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Your cart is empty.</p>
              ) : cart.map((c) => (
                <div key={c.menuItem.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{c.menuItem.name}</p>
                    <p className="text-sm text-amber-600">R{(c.menuItem.price * c.quantity).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(c.menuItem.id, -1)} className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold">−</button>
                    <span className="w-6 text-center font-medium">{c.quantity}</span>
                    <button onClick={() => updateQty(c.menuItem.id, 1)} className="w-7 h-7 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center font-bold">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-5 border-t space-y-3">
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your name *"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <input
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                placeholder="Phone/Room (optional)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Special instructions (optional)..."
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total</span>
                <span className="text-amber-600">R{total.toFixed(2)}</span>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={placing || cart.length === 0}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors"
              >
                {placing ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
