import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { getProduct, imgUrl } from '../../services/api';
import { useCart } from '../../context/CartContext';
import CartDrawer from '../../components/CartDrawer/CartDrawer';
import Header from '../../components/Header/Header';
import SimilarProducts from '../../components/SimilarProducts/SimilarProducts';
import FlyToCartAnimation from '../../components/FlyToCart/FlyToCartAnimation';
import './ProductPage.css';

function isSizeSoldOut(size) {
  return size.stock !== null && size.stock !== undefined && Number(size.stock) <= 0;
}

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();

  const savedReturnContext = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('yara-return-context') || 'null');
    } catch {
      return null;
    }
  })();

  const returnTo = location.state?.returnTo || savedReturnContext?.pathname + (savedReturnContext?.search || '') || sessionStorage.getItem('yara-return-to') || '/';
  const returnToScrollY = Number(location.state?.returnToScrollY ?? savedReturnContext?.scrollY ?? Number(sessionStorage.getItem('yara-return-scroll') || 0));

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState(null);

  const [selectedImg, setSelectedImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [added, setAdded] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [validationMsg, setValidationMsg] = useState('');
  const [shakeBtn, setShakeBtn] = useState(false);
  const [flyAnim, setFlyAnim] = useState(null);
  const similarSectionRef = useRef(null);
  const mainImgRef = useRef(null);

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
    // منتج جديد (رابط مباشر، بطاقة من "قد يعجبكِ أيضاً"، أو سواتش لون) لازم يبلش
    // من فوق دايماً — بلا هيك بيورّث سكرول الصفحة السابقة (ممكن يكون نازل
    // لتحت لقسم المنتجات المشابهة) على الصفحة الجديدة القصيرة.
    window.scrollTo({ top: 0, behavior: 'auto' });

    const controller = new AbortController();
    loadProduct(controller.signal);
    return () => controller.abort();
  }, [loadProduct]);

  const goBackToSource = () => {
    const target = returnTo || '/';
    navigate(target);
    setTimeout(() => {
      window.scrollTo({ top: Number.isFinite(returnToScrollY) ? returnToScrollY : 0, behavior: 'auto' });
    }, 80);
  };

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

    // أنيميشن "طيران" صورة المنتج لأيقونة السلة — بدل فتح السلة الجانبية تلقائياً
    const imgEl = mainImgRef.current;
    if (imgEl) {
      const rect = imgEl.getBoundingClientRect();
      setFlyAnim({
        key: Date.now(),
        imgSrc: imgEl.src,
        startRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      });
    }

    similarSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    setTimeout(() => setAdded(false), 2000);
  };

  const openShareModal = () => {
    setLinkCopied(false);
    setShareModalOpen(true);
  };

  const handleCopyLink = async () => {
    const productUrl = window.location.href;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(productUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = productUrl;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      setLinkCopied(true);
      setTimeout(() => {
        setLinkCopied(false);
        setShareModalOpen(false);
      }, 1400);
    } catch {
      setLinkCopied(false);
    }
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

        <button type="button" className="pp-back-btn" onClick={goBackToSource}>
          ← {returnTo === '/' ? 'الرئيسية' : 'عودة'}
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
                  ref={mainImgRef}
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

            <div className="product-header anim-item" style={{ '--delay': '0s' }}>
              <div className="product-title-row">
                <h1 className="product-title">
                  {product.name}
                </h1>

                <button
                  type="button"
                  className="product-share-btn"
                  onClick={openShareModal}
                  aria-label="مشاركة المنتج"
                  title="مشاركة المنتج"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 16V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="m7 8 5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {selectedSize && (
                <span className="product-selected-size">{selectedSize.label}</span>
              )}
            </div>

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
                          onClick={() => {
                            const targetReturnTo = location.state?.returnTo || (savedReturnContext?.pathname || '/') + (savedReturnContext?.search || '');
                            const targetScrollY = Number(location.state?.returnToScrollY ?? savedReturnContext?.scrollY ?? Number(sessionStorage.getItem('yara-return-scroll') || 0));

                            navigate(`/product/${linkedId}`, {
                              state: {
                                returnTo: targetReturnTo,
                                returnToScrollY: targetScrollY,
                                returnContext: savedReturnContext,
                              },
                            });
                          }}
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

            {product.description && (
              <p className="product-description-sub anim-item" style={{ '--delay': '0.02s' }}>
                {product.description}
              </p>
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

        <SimilarProducts
          categoryId={product.category?._id || product.category}
          excludeId={product._id}
          excludeIds={(product.linkedColors || []).map((c) => c.productId?._id || c.productId).filter(Boolean)}
          sectionRef={similarSectionRef}
        />

      </div>

      {shareModalOpen && (
        <div className="share-modal-backdrop" onClick={() => setShareModalOpen(false)}>
          <div
            className="share-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="share-modal-close"
              onClick={() => setShareModalOpen(false)}
              aria-label="إغلاق"
            >
              ×
            </button>
            <h2 id="share-modal-title">هل تريدين نسخ رابط القطعة؟</h2>
            <p>يمكنك مشاركة رابط المنتج مع صديقاتك بسهولة.</p>
            <button type="button" className="share-copy-btn" onClick={handleCopyLink}>
              {linkCopied ? (
                <span>✓ تم نسخ الرابط</span>
              ) : (
                <>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <span>نسخ الرابط</span>
                </>
              )}
            </button>
            <button type="button" className="share-cancel-btn" onClick={() => setShareModalOpen(false)}>
              ليس الآن
            </button>
          </div>
        </div>
      )}

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

      {flyAnim && (
        <FlyToCartAnimation
          key={flyAnim.key}
          imgSrc={flyAnim.imgSrc}
          startRect={flyAnim.startRect}
          onDone={() => setFlyAnim(null)}
        />
      )}

      <CartDrawer />
    </div>
  );
}
