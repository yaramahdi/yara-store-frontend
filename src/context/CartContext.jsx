import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getProduct } from '../services/api';

const CartContext = createContext();

export function CartProvider({ children }) {
  const closeTimerRef = useRef(null);

  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('yara-cart')) || [];
      // توافق مع عناصر سلة قديمة قد تحمل selectedSize ككائن {label, stock, _id}
      // بدلاً من label نصي — نحوّلها هنا بدل مسح السلة بالكامل
      return saved.map((item) => ({
        ...item,
        selectedSize: item.selectedSize && typeof item.selectedSize === 'object'
          ? (item.selectedSize.label ?? null)
          : (item.selectedSize ?? null),
        quantity: 1,
      }));
    }
    catch { return []; }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  // حفظ السلة في localStorage عند كل تغيير
  useEffect(() => {
    try {
      localStorage.setItem('yara-cart', JSON.stringify(cartItems));
    } catch {
      // فشل التخزين (وضع خاص، أو امتلاء المساحة) — لا يوقف عمل السلة
    }
  }, [cartItems]);

  const addToCart = (product, selectedColor = null, selectedSize = null) => {
    // selectedSize يجب أن يكون دائمًا label نصي، وليس كائن المقاس الكامل
    const sizeLabel = selectedSize && typeof selectedSize === 'object'
      ? selectedSize.label ?? ''
      : selectedSize;
    const cartId = `${product._id}-${selectedColor?.name || ''}-${sizeLabel || ''}`;
    setCartItems(prev => {
      const existing = prev.find(i => i.cartId === cartId);
      if (existing) {
        return prev;
      }
      return [...prev, { ...product, cartId, selectedColor, selectedSize: sizeLabel, quantity: 1 }];
    });

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    setIsOpen(true);
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 2000);
  };

  // مرجع ثابت لأحدث cartItems حتى يبقى syncCartWithStock بنفس المرجع (useCallback deps: [])
  // بدل إعادة إنشائه بكل تغيير في السلة — كان هذا يسبب سباقاً مع useEffect في
  // CartDrawer (الذي يعتمد على syncCartWithStock ضمن deps) فيعيد الجلب فوراً
  // بدل انتظار الفاصل الزمني (8 ثوانٍ) في كل مرة تتحدث فيها السلة.
  const cartItemsRef = useRef(cartItems);
  useEffect(() => { cartItemsRef.current = cartItems; }, [cartItems]);

  const syncCartWithStock = useCallback(async () => {
    const items = cartItemsRef.current;
    if (!items.length) return { hasUnavailable: false };

    const ids = [...new Set(items.map(i => i._id).filter(Boolean))];
    if (!ids.length) return { hasUnavailable: false };

    const entries = await Promise.all(
      ids.map(async (id) => {
        try {
          const { data } = await getProduct(id);
          return [id, data];
        } catch {
          return [id, null];
        }
      })
    );

    const productMap = Object.fromEntries(entries);

    let hasUnavailable = false;

    setCartItems((prev) => prev.map((item) => {
      const product = productMap[item._id];
      if (!product) {
        hasUnavailable = true;
        return { ...item, _available: false };
      }

      let availableQty = null;
      if (item.selectedSize) {
        const size = Array.isArray(product.sizes)
          ? product.sizes.find((s) => s.label === item.selectedSize)
          : null;
        if (!size) {
          availableQty = 0;
        } else if (size.stock === null || size.stock === undefined) {
          availableQty = null;
        } else {
          availableQty = Number(size.stock);
        }
      } else if (product.stock === null || product.stock === undefined) {
        availableQty = product.inStock === false ? 0 : null;
      } else {
        availableQty = Number(product.stock);
      }

      const available = product.inStock !== false && (availableQty === null || availableQty > 0);
      if (!available) hasUnavailable = true;

      const nextQty = 1;

      return {
        ...item,
        name: product.name,
        price: product.price,
        images: product.images || item.images,
        stock: product.stock,
        sizes: product.sizes || item.sizes,
        inStock: product.inStock,
        quantity: nextQty,
        _available: available,
      };
    }));

    return { hasUnavailable };
  }, []);

  const removeFromCart = (cartId) => {
    setCartItems(prev => prev.filter(i => i.cartId !== cartId));
  };

  const clearCart = () => setCartItems([]);

  const totalItems = cartItems.length;
  const totalPrice = cartItems.reduce((sum, i) => sum + i.price, 0);

  return (
    <CartContext.Provider value={{
      cartItems, isOpen, setIsOpen,
      addToCart, removeFromCart, clearCart,
      totalItems, totalPrice, syncCartWithStock
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
