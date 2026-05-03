import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { placeOrder } from '../../api/orders';

const CartPage: React.FC = () => {
  const { items, removeItem, updateQuantity, clearCart, totalAmount } = useCart();
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const orderData = {
        items: items.map((i) => ({
          menuItemId: i.menuItem.id,
          quantity: i.quantity,
          customizations: i.customizations,
        })),
        specialInstructions: instructions || undefined,
      };
      const res = await placeOrder(orderData);
      clearCart();
      navigate(`/orders/${res.data.id}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="page-container">
        <h1>Cart</h1>
        <div className="empty-state">Your cart is empty. <a href="/menu">Browse menu</a></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>Cart</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="cart-items">
        {items.map((item) => (
          <div key={item.menuItem.id} className="cart-item">
            <div className="cart-item-info">
              <h3>{item.menuItem.name}</h3>
              <p>R{item.menuItem.price.toFixed(2)} each</p>
            </div>
            <div className="qty-control">
              <button onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}>−</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}>+</button>
            </div>
            <p className="cart-item-subtotal">R{(item.menuItem.price * item.quantity).toFixed(2)}</p>
            <button className="btn btn-danger btn-sm" onClick={() => removeItem(item.menuItem.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="cart-footer">
        <div className="form-group">
          <label>Special Instructions</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Any special requests?"
            rows={3}
          />
        </div>
        <div className="cart-total">
          <strong>Total: R{totalAmount.toFixed(2)}</strong>
        </div>
        <button
          className="btn btn-primary btn-full"
          onClick={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? 'Placing order...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
};

export default CartPage;
