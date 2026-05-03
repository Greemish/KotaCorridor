import React, { useEffect, useState } from 'react';
import { getAvailableMenu } from '../../api/menu';
import { useCart } from '../../context/CartContext';
import type { MenuItem, MenuCategory } from '../../types';

const categories: MenuCategory[] = ['KOTA', 'SIDE', 'DRINK', 'EXTRA'];

const categoryLabels: Record<MenuCategory, string> = {
  KOTA: '🥪 Kotas',
  SIDE: '🍟 Sides',
  DRINK: '🥤 Drinks',
  EXTRA: '➕ Extras',
};

const MenuPage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const { addItem } = useCart();

  useEffect(() => {
    getAvailableMenu()
      .then((res) => setMenuItems(res.data))
      .catch(() => setError('Failed to load menu.'))
      .finally(() => setLoading(false));
  }, []);

  const getQty = (id: number) => quantities[id] || 1;

  const handleAdd = (item: MenuItem) => {
    addItem(item, getQty(item.id));
  };

  if (loading) return <div className="loading">Loading menu...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="page-container">
      <h1>Menu</h1>
      {categories.map((cat) => {
        const items = menuItems.filter((m) => m.category === cat);
        if (items.length === 0) return null;
        return (
          <section key={cat} className="menu-category">
            <h2>{categoryLabels[cat]}</h2>
            <div className="menu-grid">
              {items.map((item) => (
                <div key={item.id} className="menu-item-card">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} className="menu-item-img" />
                  )}
                  <div className="menu-item-info">
                    <h3>{item.name}</h3>
                    <p className="menu-item-desc">{item.description}</p>
                    <p className="menu-item-price">R{item.price.toFixed(2)}</p>
                    <p className={`menu-item-stock ${item.stockQuantity <= 5 ? 'low-stock' : ''}`}>
                      {item.stockQuantity <= 0 ? 'Out of stock' : `${item.stockQuantity} in stock`}
                    </p>
                  </div>
                  <div className="menu-item-actions">
                    <div className="qty-control">
                      <button
                        onClick={() => setQuantities((q) => ({ ...q, [item.id]: Math.max(1, getQty(item.id) - 1) }))}
                      >−</button>
                      <span>{getQty(item.id)}</span>
                      <button
                        onClick={() => setQuantities((q) => ({ ...q, [item.id]: Math.min(item.stockQuantity, getQty(item.id) + 1) }))}
                      >+</button>
                    </div>
                    <button
                      className="btn btn-primary"
                      disabled={item.stockQuantity <= 0}
                      onClick={() => handleAdd(item)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default MenuPage;
