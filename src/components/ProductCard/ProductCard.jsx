import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { imgUrl } from '../../services/api';
import './ProductCard.css';

const FAV_KEY = 'yara-favorites';

function readFavIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(FAV_KEY)) || [];
    return Array.isArray(raw) ? raw.map(String) : [];
  } catch {
    return [];
  }
}

export default function ProductCard({ product, collectionName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [wished, setWished] = useState(() => readFavIds().includes(String(product._id)));
  const images = product.images?.length ? product.images : (product.image ? [product.image] : []);
  const [imgIndex, setImgIndex] = useState(0);
  const touchStartX = useRef(null);

  const openProduct = () => {
    let currentPageContext = {};
    try {
      currentPageContext = JSON.parse(sessionStorage.getItem('yara-page-context') || '{}');
    } catch {
      currentPageContext = {};
    }

    const returnTo = `${location.pathname}${location.search}` || '/';
    const scrollY = window.scrollY || 0;
    const returnContext = {
      pathname: location.pathname || '/',
      search: location.search || '',
      categoryId: currentPageContext.categoryId || null,
      collectionName: currentPageContext.collectionName || null,
      scrollY,
    };

    sessionStorage.setItem('yara-return-to', returnTo);
    sessionStorage.setItem('yara-return-scroll', String(scrollY));
    sessionStorage.setItem('yara-return-context', JSON.stringify(returnContext));

    navigate(`/product/${product._id}`, {
      state: {
        returnTo,
        returnToScrollY: scrollY,
        returnContext,
      },
    });
  };

  const effectiveQty = product.sizes?.length > 0
    ? product.sizes.reduce((sum, s) => sum + (s.stock === null || s.stock === undefined ? 999 : s.stock), 0)
    : (product.stock === null || product.stock === undefined ? 999 : product.stock);

  const isLastPiece = effectiveQty === 1 && product.inStock !== false && !product.hideLastPiece;

  const discount = product.salePrice && product.salePrice > product.price
    ? Math.round((1 - product.price / product.salePrice) * 100) : null;

  const visibleSizeLabel = product.sizes?.find((s) => s.stock === null || s.stock === undefined || Number(s.stock) > 0)?.label
    || product.sizes?.[0]?.label
    || null;

  const manualLabel = product.label ? String(product.label).trim() : '';
  const labelClass = manualLabel === 'جديد' ? 'new' : manualLabel === 'عرض خاص' ? 'special' : 'custom';
  const catName = product.category?.name || product.category || '';

  const handleAddToCart = (e) => {
    e.stopPropagation();
    openProduct();
  };

  const goTo = (e, idx) => { e.stopPropagation(); setImgIndex((idx + images.length) % images.length); };

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) setImgIndex(i => (i + (diff > 0 ? 1 : -1) + images.length) % images.length);
    touchStartX.current = null;
  };

  useEffect(() => {
    const sync = () => setWished(readFavIds().includes(String(product._id)));
    window.addEventListener('favorites:updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('favorites:updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, [product._id]);

  const toggleWish = (e) => {
    e.stopPropagation();
    const id = String(product._id);
    const next = readFavIds();
    const idx = next.indexOf(id);
    if (idx >= 0) {
      next.splice(idx, 1);
      setWished(false);
    } else {
      next.push(id);
      setWished(true);
    }
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
    } catch {
      // فشل التخزين (وضع خاص، أو امتلاء المساحة) — لا يوقف تفاعل الزر
    }
    window.dispatchEvent(new Event('favorites:updated'));
  };

  return (
    <div className="product-card" onClick={openProduct} role="button" tabIndex={0}>

      <div className="product-img-wrap"
        onTouchStart={images.length > 1 ? onTouchStart : undefined}
        onTouchEnd={images.length > 1 ? onTouchEnd : undefined}
      >
        {manualLabel && (
          <div className="product-badges">
            <span className={`product-badge ${labelClass}`}>{manualLabel}</span>
          </div>
        )}
        {isLastPiece && <div className="last-piece-ribbon">آخر قطعة</div>}

        {images.length > 1 ? (
          <div className="card-slider">
            {images.map((img, i) => {
              const shouldRender = i === imgIndex;
              return (
                <div key={i} className={`card-slide ${i === imgIndex ? 'active' : ''}`}>
                  {shouldRender ? (
                    <img src={imgUrl(img)} alt={product.name} loading="lazy" />
                  ) : null}
                </div>
              );
            })}
            <button className="card-arr card-prev" onClick={e => goTo(e, imgIndex - 1)} aria-label="السابق">‹</button>
            <button className="card-arr card-next" onClick={e => goTo(e, imgIndex + 1)} aria-label="التالي">›</button>
            <div className="card-dots">
              {images.map((_, i) => (
                <button key={i} className={`card-dot ${i === imgIndex ? 'active' : ''}`} onClick={e => goTo(e, i)} />
              ))}
            </div>
          </div>
        ) : images.length === 1 ? (
          <img src={imgUrl(images[0])} alt={product.name} loading="lazy" />
        ) : (
          <div className="placeholder-img" />
        )}

        {!product.inStock && <div className="out-of-stock-overlay">نفد المخزون</div>}
      </div>

      <div className="product-info" onClick={e => e.stopPropagation()}>
        {collectionName && <div className="product-collection-tag">{collectionName}</div>}
        {catName && <p className="product-cat-tag">{catName}</p>}

        <div className="product-name-row">
          <p className="product-name">{product.name}</p>
          <button
            className={`wish-btn ${wished ? 'wished' : ''}`}
            onClick={toggleWish}
            aria-label="المفضلة"
          >
            {wished ? '♥' : '♡'}
          </button>
        </div>

        <div className="product-rating">
          <span className="stars-sm">★★★★★</span>
          <span className="rating-count">({product.reviewCount ?? 0})</span>
        </div>

        <div className="product-price-row">
          <span className={`price-now ${discount ? 'on-sale' : ''}`}>{product.price} ₪</span>
          {product.salePrice && <span className="price-was">{product.salePrice} ₪</span>}
          {discount && <span className="price-save">وفري {discount}%</span>}
          {visibleSizeLabel && (
            <span className="price-size-inline">مقاس {visibleSizeLabel}</span>
          )}
        </div>
      </div>

      <button className="product-add-btn" onClick={handleAddToCart} disabled={!product.inStock}>
        تفاصيل القطعة
      </button>
    </div>
  );
}
