import { useState, useEffect, useMemo } from 'react';
import { getProducts, getProductsStockStatus } from '../../services/api';
import ProductCard from '../ProductCard/ProductCard';
import './ProductGrid.css';

const FAV_KEY = 'yara-favorites';

function readFavIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(FAV_KEY)) || [];
    return Array.isArray(raw) ? raw.map(String) : [];
  } catch {
    return [];
  }
}

const SORT_OPTIONS = [
  { key: 'newest', label: 'الأحدث' },
  { key: 'low',    label: 'السعر: من الأقل' },
  { key: 'high',   label: 'السعر: من الأعلى' },
];

// خريطة: productId → معلومات الكولكشن
function buildCollectionMap(collections = []) {
  const map = {};
  const now = new Date();
  collections.forEach(col => {
    const launched = !col.launchDate || new Date(col.launchDate) <= now;
    (col.products || []).forEach(pid => {
      map[String(pid)] = { name: col.name, launched, launchDate: col.launchDate };
    });
  });
  return map;
}

export default function ProductGrid({
  categoryId,
  searchQuery,
  activeCollection,
  favoritesOnly = false,
  collections = [],
  onClearCollection,
  onExitFavorites,
}) {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [loadError, setLoadError] = useState('');
  const [visible,  setVisible]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [hasMore,  setHasMore]  = useState(false);
  const [total,    setTotal]    = useState(0);
  const [sort,     setSort]     = useState('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(() => readFavIds());

  const collectionMap = useMemo(() => buildCollectionMap(collections), [collections]);

  const buildParams = () => {
    const limit = favoritesOnly ? 200 : (activeCollection ? 100 : 12);
    const params = { page, limit };
    if (categoryId) params.category = categoryId;
    if (searchQuery) params.search = searchQuery;
    return params;
  };

  const fetchProducts = async (signal) => {
    setLoading(true);
    setLoadError('');

    try {
      const { data } = await getProducts(buildParams(), signal);
      const incoming = data.products || [];
      setProducts(prev => data.page === 1 ? incoming : [...prev, ...incoming]);
      setHasMore(data.page < data.pages);
      if (data.page === 1) setTotal(data.total ?? incoming.length);
    } catch (err) {
      if (err.code === 'ERR_CANCELED') return; // طلب أُلغي عمداً (تغيّر الفلتر أو مغادرة الصفحة)
      setLoadError('تعذر تحميل البطاقات بسبب ضعف الشبكة.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  // إعادة تعيين عند تغيير الفلاتر
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => {
      setPage(1);
      setProducts([]);
      setLoadError('');
      setVisible(true);
    }, 200);
    return () => clearTimeout(t);
  }, [categoryId, searchQuery, activeCollection]);

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
    return () => controller.abort();
  }, [categoryId, searchQuery, activeCollection, page]);

  useEffect(() => {
    const syncFavorites = () => setFavoriteIds(readFavIds());
    window.addEventListener('favorites:updated', syncFavorites);
    window.addEventListener('storage', syncFavorites);
    return () => {
      window.removeEventListener('favorites:updated', syncFavorites);
      window.removeEventListener('storage', syncFavorites);
    };
  }, []);

  // ── الترتيب ──
  const sorted = useMemo(() => [...products].sort((a, b) => {
    if (sort === 'low')  return a.price - b.price;
    if (sort === 'high') return b.price - a.price;
    return 0;
  }), [products, sort]);

  // ── الفلترة ──
  const displayed = useMemo(() => sorted.filter(p => {
    if (favoritesOnly && !favoriteIds.includes(String(p._id))) return false;
    const col = collectionMap[String(p._id)];
    // أخفِ منتجات الكولكشنات المجدولة في المستقبل
    if (col && !col.launched) return false;
    // إذا كولكشن محددة، اعرض فقط منتجاتها
    if (activeCollection) return col?.name === activeCollection;
    return true;
  }), [sorted, favoritesOnly, favoriteIds, collectionMap, activeCollection]);

  const displayedIds = displayed.map((p) => String(p._id)).filter(Boolean);
  const displayedIdsKey = displayedIds.join(',');

  // تحديث صامت للمخزون للمنتجات المعروضة حالياً فقط
  useEffect(() => {
    if (displayedIds.length === 0) return undefined;

    const interval = setInterval(() => {
      getProductsStockStatus(displayedIds)
        .then(({ data }) => {
          const stockMap = {};
          (data.products || []).forEach((p) => {
            stockMap[p._id] = { inStock: p.inStock, stock: p.stock };
          });

          setProducts((prev) => prev.map((p) => (stockMap[p._id] ? { ...p, ...stockMap[p._id] } : p)));
        })
        .catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, [displayedIdsKey]);

  // ── العنوان ──
  const titleNode = favoritesOnly ? (
    <span className="pg-title-collection">
      المفضلة
      <span className="pg-header__count">({displayed.length})</span>
      <button className="collection-clear-btn" onClick={onExitFavorites}>
        ← العودة للرئيسية
      </button>
    </span>
  ) : activeCollection ? (
    <span className="pg-title-collection">
      كولكشن: <strong>{activeCollection}</strong>
      <span className="pg-header__count">({displayed.length})</span>
      <button className="collection-clear-btn" onClick={onClearCollection}>
        ✕ عرض الكل
      </button>
    </span>
  ) : (
    <>
      جميع المنتجات
      <span className="pg-header__count">({total})</span>
    </>
  );

  if (loading && products.length === 0) {
    return (
      <section className="product-grid-section">
        <div className="products-grid">
          {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton" />)}
        </div>
      </section>
    );
  }

  if (!loading && loadError && products.length === 0) {
    return (
      <section className="product-grid-section">
        <div className="pg-load-error">
          <p>{loadError}</p>
          <button className="pg-retry-btn" onClick={() => fetchProducts()}>
            إعادة التحميل
          </button>
        </div>
      </section>
    );
  }

  if (!loading && displayed.length === 0) {
    return (
      <div className="empty-state">
        <span>🌸</span>
        <p>
          {searchQuery
            ? `لم يتم العثور على نتائج لـ "${searchQuery}"`
            : favoritesOnly
              ? 'لا توجد منتجات في المفضلة حتى الآن'
            : activeCollection
              ? `لا توجد منتجات في كولكشن "${activeCollection}" حالياً`
              : 'لا توجد منتجات في هذا القسم حالياً'}
        </p>
        {favoritesOnly && (
          <button className="collection-clear-btn collection-clear-btn--standalone" onClick={onExitFavorites}>
            ← العودة للرئيسية
          </button>
        )}
        {activeCollection && (
          <button className="collection-clear-btn collection-clear-btn--standalone" onClick={onClearCollection}>
            ✕ عرض جميع المنتجات
          </button>
        )}
      </div>
    );
  }

  return (
    <section className={`product-grid-section ${visible ? 'fade-in' : 'fade-out'}`}>

      {/* ── Header ── */}
      {!searchQuery && (
        <div className="pg-header">
          <div className="pg-header__top">
            <h2 className="pg-header__title">{titleNode}</h2>
            <div className="pg-sort">
              <button className="pg-sort__btn" onClick={() => setSortOpen(o => !o)}>
                ترتيب
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {sortOpen && (
                <ul className="pg-sort__menu">
                  {SORT_OPTIONS.map(o => (
                    <li key={o.key}>
                      <button
                        className={sort === o.key ? 'active' : ''}
                        onClick={() => { setSort(o.key); setSortOpen(false); }}
                      >
                        {o.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="products-grid">
        {displayed.map(p => (
          <ProductCard
            key={p._id}
            product={p}
            collectionName={collectionMap[String(p._id)]?.name || null}
          />
        ))}
        {loading && Array(4).fill(0).map((_, i) => (
          <div key={`sk-${i}`} className="skeleton" />
        ))}
      </div>

      {hasMore && !loading && !activeCollection && (
        <button className="load-more-btn" onClick={() => setPage(p => p + 1)}>
          عرض المزيد
        </button>
      )}
    </section>
  );
}
