import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailableMenu } from '../../api/menu';
import { placeOrder } from '../../api/orders';
import MenuItemCard from '../../components/MenuItemCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { MenuItem, CartItem, MenuCategory, Order } from '../../types';

const CATEGORIES: MenuCategory[] = ['KOTA', 'SIDE', 'DRINK', 'EXTRA'];
const MAX_STORED_GUEST_ORDERS = 50;

export default function MenuPage() {
  const navigate = useNavigate();
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

  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Order confirmation modal
  const [showOrderConfirm, setShowOrderConfirm] = useState(false);
  const [lastOrderNumber, setLastOrderNumber] = useState('');
  const [lastQueuePosition, setLastQueuePosition] = useState<number | null>(null);

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

  const openPaymentModal = () => {
    if (!cart.length) return;
    if (!customerName.trim()) {
      setNotification('❌ Please enter your name before placing an order.');
      setTimeout(() => setNotification(null), 5000);
      return;
    }
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (paymentMethod === 'card') {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
        setNotification('❌ Please enter a valid 16-digit card number');
        setTimeout(() => setNotification(null), 5000);
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        setNotification('❌ Please enter valid expiry date (MM/YY)');
        setTimeout(() => setNotification(null), 5000);
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setNotification('❌ Please enter valid CVV');
        setTimeout(() => setNotification(null), 5000);
        return;
      }
    }

    setProcessingPayment(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setNotification(`💳 Payment ${paymentMethod === 'cash' ? 'confirmed' : 'processed'}! Placing your order...`);
    await placeOrderAndComplete();
  };

  const placeOrderAndComplete = async () => {
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
        localStorage.setItem('guest_order_ids', JSON.stringify([res.data.id, ...ids].slice(0, MAX_STORED_GUEST_ORDERS)));
      }

      // Store order info for the confirmation modal
      setLastOrderNumber(res.data.orderNumber);
      setLastQueuePosition(res.data.queuePosition ?? null);

      // Reset everything
      setCart([]);
      setSpecialInstructions('');
      setShowCart(false);
      setShowPaymentModal(false);
      setCustomerName('');
      setCustomerContact('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setPaymentMethod('cash');

      // Show the confirmation modal instead of a brief notification
      setShowOrderConfirm(true);

    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setNotification(`❌ ${axiosErr.response?.data?.message || 'Failed to place order'}`);
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setProcessingPayment(false);
      setPlacing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart.length) return;
    if (!customerName.trim()) {
      setNotification('❌ Please enter your name before placing an order.');
      setTimeout(() => setNotification(null), 5000);
      return;
    }
    setPlacing(true);
    openPaymentModal();
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '').slice(0, 16);
    return cleaned.replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  const categoryItems = items.filter((i) => i.category === activeCategory);

  if (loading) return <LoadingSpinner />;

  return (
      <div className="relative">
        {/* Quick notification for non-order events */}
        {notification && (
            <div className="fixed top-4 right-4 z-50 bg-amber-600 text-white px-5 py-3 rounded-xl shadow-lg max-w-sm">
              {notification}
            </div>
        )}

        {/* Order Confirmation Modal - Stays until user clicks OK */}
        {showOrderConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-black/60 absolute inset-0" />
              <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-50 text-center">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
                <p className="text-gray-600 mb-4">Thank you for your order!</p>

                <div className="bg-amber-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-1">Your Order Number</p>
                  <p className="text-3xl font-bold text-amber-600">{lastOrderNumber}</p>
                  {lastQueuePosition && (
                      <p className="text-sm text-gray-600 mt-2">
                        Queue Position: <span className="font-bold text-amber-600">#{lastQueuePosition}</span>
                      </p>
                  )}
                </div>

                <p className="text-sm text-gray-500 mb-6">
                  {paymentMethod === 'cash'
                      ? 'Please pay with cash at the counter when collecting your order.'
                      : 'Your payment has been processed. You will receive a notification when your order is ready.'}
                </p>

                <div className="flex gap-3">
                  <button
                      onClick={() => {
                        setShowOrderConfirm(false);
                        setLastOrderNumber('');
                        setLastQueuePosition(null);
                      }}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-semibold transition-colors"
                  >
                    Continue Shopping
                  </button>
                  <button
                      onClick={() => {
                        setShowOrderConfirm(false);
                        setLastOrderNumber('');
                        setLastQueuePosition(null);
                        navigate('/orders');
                      }}
                      className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    View My Orders
                  </button>
                </div>
              </div>
            </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Our Menu</h1>
          <div className="flex gap-2">
            <button
                onClick={() => navigate('/login')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
            >
              🔐 Staff/Admin Login
            </button>
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
                    {placing ? 'Processing...' : 'Proceed to Payment'}
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-black/50 absolute inset-0" onClick={() => setShowPaymentModal(false)} />
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative z-50">
                <h2 className="text-xl font-bold mb-4">💳 Payment</h2>
                <p className="text-gray-600 mb-4">Total amount: <span className="font-bold text-amber-600">R{total.toFixed(2)}</span></p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <div className="flex gap-3">
                    <button
                        onClick={() => setPaymentMethod('cash')}
                        className={`flex-1 py-2 rounded-lg border font-medium transition-colors ${
                            paymentMethod === 'cash'
                                ? 'bg-amber-600 border-amber-600 text-white'
                                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      💵 Cash
                    </button>
                    <button
                        onClick={() => setPaymentMethod('card')}
                        className={`flex-1 py-2 rounded-lg border font-medium transition-colors ${
                            paymentMethod === 'card'
                                ? 'bg-amber-600 border-amber-600 text-white'
                                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      💳 Card
                    </button>
                  </div>
                </div>

                {paymentMethod === 'card' && (
                    <div className="space-y-3 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                        <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                          <input
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                              placeholder="MM/YY"
                              maxLength={5}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                          <input
                              type="password"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                              placeholder="123"
                              maxLength={3}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">Demo mode: No actual payment will be processed</p>
                    </div>
                )}

                {paymentMethod === 'cash' && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">💰 Pay with cash at the counter when collecting your order.</p>
                    </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                      onClick={processPayment}
                      disabled={processingPayment}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold"
                  >
                    {processingPayment ? 'Processing...' : `Confirm ${paymentMethod === 'cash' ? 'Order' : 'Payment'}`}
                  </button>
                  <button
                      onClick={() => setShowPaymentModal(false)}
                      className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}