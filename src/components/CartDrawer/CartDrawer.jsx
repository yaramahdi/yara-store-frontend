import { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { imgUrl, getSettings } from '../../services/api';
import OrderForm from '../OrderForm/OrderForm';
import './CartDrawer.css';

export default function CartDrawer() {
  const {
    cartItems,
    isOpen,
    setIsOpen,
    removeFromCart,
    totalItems,
    totalPrice,
    clearCart,
    syncCartWithStock,
  } = useCart();
  const [whatsapp, setWhatsapp] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);

  const hasUnavailableItems = cartItems.some((item) => item._available === false);

  useEffect(() => {
    getSettings()
      .then(res => { if (res.data.whatsappNumber) setWhatsapp(res.data.whatsappNumber); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    syncCartWithStock().catch(() => {});
    const interval = setInterval(() => {
      syncCartWithStock().catch(() => {});
    }, 8000);

    return () => clearInterval(interval);
  }, [isOpen, syncCartWithStock]);

  const handleOrder = () => {
    if (!cartItems.length || hasUnavailableItems) return;
    setShowOrderForm(true);
  };

  return (
    <>
      <OrderForm
        isOpen={showOrderForm}
        onClose={() => setShowOrderForm(false)}
        cartItems={cartItems}
        totalPrice={totalPrice}
        whatsappNumber={whatsapp}
        onOrderComplete={() => { clearCart(); setIsOpen(false); }}
        onStockConflict={async () => {
          await syncCartWithStock().catch(() => {});
          setIsOpen(true);
        }}
      />
      {isOpen && <div className="cart-overlay" onClick={() => setIsOpen(false)} />}

      <div className={`cart-drawer ${isOpen ? '' : 'closed'}`}>
        {/* Header */}
        <div className="cart-header">
          <h2>سلتي 🛒 {totalItems > 0 && <span className="cart-count">({totalItems})</span>}</h2>
          <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
        </div>

        {/* Body */}
        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <span>🛍️</span>
              <p>سلتك فارغة</p>
              <small>أضيفي منتجاتك المفضلة</small>
              <button className="continue-btn" onClick={() => setIsOpen(false)}>تصفحي المنتجات</button>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.cartId} className="cart-item">
                {/* صورة */}
                <div className="item-img">
                  {item.images?.[0]
                    ? <img src={imgUrl(item.images[0])} alt={item.name} />
                    : <div className="item-img-placeholder" />
                  }
                </div>

                {/* معلومات */}
                <div className="item-info">
                  <p className="item-name">{item.name}</p>
                  {item.selectedColor?.name && <p className="item-meta">لون: {item.selectedColor.name}</p>}
                  {item.selectedSize        && <p className="item-meta">مقاس: {item.selectedSize}</p>}
                  {item._available === false && <p className="item-stock-alert">نفد المخزون</p>}
                  <p className="item-price">{item.price} ₪</p>
                </div>

                {/* حذف */}
                <div className="item-qty">
                  <button className="delete-btn" onClick={() => removeFromCart(item.cartId)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>المجموع:</span>
              <strong>₪{totalPrice}</strong>
            </div>
            <button className="order-btn" onClick={handleOrder} disabled={hasUnavailableItems}>
             متابعة للحجز ← 
            </button>
            {hasUnavailableItems && <p className="cart-stock-warning">يوجد عنصر نفد مخزونه في السلة. احذفيه قبل المتابعة.</p>}
          </div>
        )}
      </div>
    </>
  );
}
