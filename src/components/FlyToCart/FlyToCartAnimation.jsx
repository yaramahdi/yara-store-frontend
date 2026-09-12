import { useEffect, useState } from 'react';
import './FlyToCartAnimation.css';

// أنيميشن "طيران" صورة المنتج من مكانها لأيقونة السلة بالهيدر، بدل ما نفتح
// السلة الجانبية تلقائياً — تأكيد بصري أفخم إنه القطعة انضافت.
export default function FlyToCartAnimation({ imgSrc, startRect, onDone }) {
  const [style, setStyle] = useState({
    left: startRect.left,
    top: startRect.top,
    width: startRect.width,
    height: startRect.height,
    opacity: 1,
    transform: 'scale(1) rotate(0deg)',
  });

  useEffect(() => {
    const cartIcon = document.getElementById('header-cart-icon');
    const targetRect = cartIcon
      ? cartIcon.getBoundingClientRect()
      : { left: window.innerWidth - 40, top: 16, width: 24, height: 24 };

    // فريم إضافي حتى يسجّل المتصفح الحالة الابتدائية قبل ما يبلش الانتقال (transition)
    const raf = requestAnimationFrame(() => {
      setStyle({
        left: targetRect.left + targetRect.width / 2 - 14,
        top: targetRect.top + targetRect.height / 2 - 14,
        width: 28,
        height: 28,
        opacity: 0.2,
        transform: 'scale(0.3) rotate(20deg)',
      });
    });

    const timeout = setTimeout(() => {
      if (cartIcon) {
        cartIcon.classList.add('cart-icon-pulse');
        setTimeout(() => cartIcon.classList.remove('cart-icon-pulse'), 500);
      }
      onDone();
    }, 700);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <img
      src={imgSrc}
      alt=""
      aria-hidden="true"
      className="fly-to-cart-img"
      style={style}
    />
  );
}
