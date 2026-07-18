import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProduct, imgUrl } from '../../services/api';
import { useCart } from '../../context/CartContext';
import CartDrawer from '../../components/CartDrawer/CartDrawer';
import Header from '../../components/Header/Header';
import './ProductPage.css';

function isSizeSoldOut(size) {
  return size.stock !== null && size.stock !== undefined && Number(size.stock) <= 0;
}

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState(null);

  const [selectedImg, setSelectedImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [added, setAdded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [validationMsg, setValidationMsg] = useState('');
  const [shakeBtn, setShakeBtn] = useState(false);

  const loadProduct = useCallback(async (signal) => {
    setLoading(true);
    setErrorType(null);

    try {
      const res = await getProduct(id, signal);
      const data = res.data;

      const sizes = data.sizes || [];
      const firstAvailable = sizes.find((s) => !isSizeSoldOut(s));

      setProduct(data);
      setSelectedSize(firstAvailable || sizes[0] || null);
      setSelectedImg(0);
      setLightboxOpen(false);
      setValidationMsg('');
    } catch (error) {
      if (error.code === 'ERR_CANCELED') return; // طلب أُلغي عمداً (تغيّر المنتج أو مغادرة الصفحة)

      setProduct(null);

      if (error.response?.status === 404) {
        setErrorType('not-found');
      } else {
        setErrorType('network');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    loadProduct(controller.signal);
    return () => controller.abort();
  }, [loadProduct]);

  const handleAdd = () => {
    if (product.sizes?.length > 0 && (!selectedSize || isSizeSoldOut(selectedSize))) {
      setValidationMsg('الرجاء اختيار مقاس متوفر');
      setShakeBtn(true);
      setTimeout(() => setShakeBtn(false), 600);
      return;
    }

    const cartColor = product.colorName ? { name: product.colorName } : null;

    addToCart(product, cartColor, selectedSize?.label || null);

    setValidationMsg('');
    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div>
        <Header activeType="" onTypeChange={() => {}} />

        <div className="product-page-container">
          <div className="pp-skeleton">
            <div className="pp-sk-gallery">
              <div className="pp-sk-main" />
              <div className="pp-sk-thumbs">
                <div className="pp-sk-thumb" />
                <div className="pp-sk-thumb" />
                <div className="pp-sk-thumb" />
              </div>
            </div>

            <div className="pp-sk-details">
              <div className="pp-sk-line w-70" />
              <div className="pp-sk-line w-40" />
              <div className="pp-sk-line w-55" />
              <div className="pp-sk-line w-25" />
              <div className="pp-sk-btn" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (errorType === 'network') {
    return (
      <div>
        <Header activeType="" onTypeChange={() => {}} />

        <div className="product-page-container">
          <div className="product-not-found">
            <span>📡</span>

            <h2>تعذر تحميل المنتج</h2>

            <p>
              تأكدي من اتصال الإنترنت وحاولي مرة أخرى
            </p>

            <button onClick={() => loadProduct()}>
              إعادة المحاولة
            </button>

            <Link to="/">
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (errorType === 'not-found' || !product) {
    return (
      <div>
        <Header activeType="" onTypeChange={() => {}} />

        <div className="product-page-container">
          <div className="product-not-found">
            <span>😕</span>

            <h2>المنتج غير موجود</h2>

            <Link to="/">
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const discount = product.salePrice && product.salePrice > product.price
    ? Math.round((1 - product.price / product.salePrice) * 100)
    : null;

  const hasLinkedColors = product.linkedColors?.some((c) => c.productId);

  const cartBtnLabel = !product.inStock
    ? 'نفد المخزون'
    : added
    ? '✓ تمت الإضافة للسلة'
    : 'أضيفي للسلة';

  const mobileCartButton = (
    <button
      className={`add-to-cart-btn pp-mobile-addcart ${added ? 'added' : ''} ${shakeBtn ? 'shake' : ''} ${!product.inStock ? 'out-of-stock' : ''}`}
      onClick={handleAdd}
      disabled={!product.inStock}
    >
      {cartBtnLabel}
    </button>
  );

  return (
    <div>
      <Header mobileBottomContent={mobileCartButton} />

      <div className="product-page-container">

        <button type="button" className="pp-back-btn" onClick={() => navigate('/')}>
          ← الرئيسية
        </button>

        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">الرئيسية</Link>
          {product.category?.name && (
            <>
              <span className="bc-sep">/</span>
              <span>{product.category.name}</span>
            </>
          )}
          <span className="bc-sep">/</span>
          <span className="bc-current">{product.name}</span>
        </div>

        <div className="product-layout">

          {/* معرض الصور */}
          <div className="product-gallery">
            <div
              className="main-img-wrap"
              style={{ cursor: product.images?.[selectedImg] ? 'zoom-in' : 'default' }}
              onClick={() => product.images?.[selectedImg] && setLightboxOpen(true)}
            >
              {product.images?.[selectedImg] ? (
                <img
                  src={imgUrl(product.images[selectedImg])}
                  alt={product.name}
                  className="main-img"
                />
              ) : (
                <div className="main-img placeholder-img" />
              )}

              {discount && (
                <span className="discount-badge">
                  -{discount}%
                </span>
              )}
            </div>

            {product.images?.length > 1 && (
              <div className="thumb-row">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`thumb-btn ${selectedImg === i ? 'active' : ''}`}
                    onClick={() => setSelectedImg(i)}
                  >
                    <img
                      src={imgUrl(img)}
                      alt={`${product.name} ${i + 1}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* معلومات المنتج */}
          <div className="product-details">

            <h1 className="product-title anim-item" style={{ '--delay': '0s' }}>
              {product.name}
            </h1>

            {product.description && (
              <p className="product-description-sub anim-item" style={{ '--delay': '0.02s' }}>
                {product.description}
              </p>
            )}

            <div className="price-section anim-item" style={{ '--delay': '0.05s' }}>
              <span className="price-current">
                {product.price} ₪
              </span>

              {discount && (
                <span className="price-original">
                  {product.salePrice} ₪
                </span>
              )}
            </div>

            {/* الألوان — colorName للمنتج الحالي + linkedColors كمنتجات مرتبطة */}
            {(product.colorName || hasLinkedColors) && (
              <div className="option-section anim-item" style={{ '--delay': '0.1s' }}>
                <p className="option-label">
                  اللون:{' '}
                  <span className="selected-color-name">{product.colorName || ''}</span>
                </p>

                <div className="color-swatches">
                  <div className="color-swatch active" title={product.colorName || product.name}>
                    {product.images?.[0] ? (
                      <img src={imgUrl(product.images[0])} alt={product.colorName || product.name} />
                    ) : (
                      <span className="swatch-label">{(product.colorName || product.name || '').slice(0, 2)}</span>
                    )}
                  </div>

                  {product.linkedColors
                    ?.filter((c) => c.productId)
                    .map((c) => {
                      const linked = c.productId;
                      const linkedId = linked?._id || linked;
                      const linkedImg = linked?.images?.[0] || linked?.image;
                      const linkedName = c.name || linked?.name || '';

                      return (
                        <button
                          key={linkedId}
                          type="button"
                          className="color-swatch"
                          title={linkedName}
                          onClick={() => navigate(`/product/${linkedId}`)}
                        >
                          {linkedImg ? (
                            <img src={imgUrl(linkedImg)} alt={linkedName} />
                          ) : (
                            <span className="swatch-label">{linkedName.slice(0, 2)}</span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* المقاسات */}
            {product.sizes?.length > 0 && (
              <div className="option-section anim-item" style={{ '--delay': '0.15s' }}>
                <p className="option-label">المقاس:</p>

                <div className="size-options">
                  {product.sizes.map((size) => {
                    const soldOut = isSizeSoldOut(size);

                    return (
                      <div key={size._id || size.label} className="size-option-wrap">
                        <button
                          type="button"
                          className={`size-option ${selectedSize?.label === size.label ? 'active' : ''} ${soldOut ? 'sold-out' : ''}`}
                          onClick={() => !soldOut && setSelectedSize(size)}
                          disabled={soldOut}
                        >
                          {size.label}
                        </button>
                        {soldOut && <span className="size-sold-label">نفدت</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {product.sizeGuide?.length > 0 && (
              <div className="size-guide-section anim-item" style={{ '--delay': '0.18s' }}>
                <p className="option-label">دليل المقاسات:</p>

                <table className="size-guide-table">
                  <thead>
                    <tr>
                      <th>المقاس</th>
                      <th>المواصفات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.sizeGuide.map((g, i) => (
                      <tr key={g._id || i}>
                        <td>{g.size}</td>
                        <td>{g.specs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {validationMsg && (
              <p className="validation-msg">{validationMsg}</p>
            )}

            <button
              className={`add-to-cart-btn add-cart-desktop ${added ? 'added' : ''} ${shakeBtn ? 'shake' : ''} ${!product.inStock ? 'out-of-stock' : ''}`}
              onClick={handleAdd}
              disabled={!product.inStock}
            >
              {cartBtnLabel}
            </button>

          </div>

        </div>

      </div>

      {lightboxOpen && product.images?.[selectedImg] && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <img
            src={imgUrl(product.images[selectedImg])}
            alt={product.name}
            className="lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="lightbox-close" onClick={() => setLightboxOpen(false)}>
            ✕
          </button>
        </div>
      )}

      <CartDrawer />
    </div>
  );
}
