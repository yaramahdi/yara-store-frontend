import { useEffect, useState, useCallback } from 'react';
import {
  adminGetSettings, adminUpdateSettings,
  adminGetProducts, adminCreateProduct, adminUpdateProduct,
  adminGetCategories, uploadProductImage,
} from '../../../services/adminApi';
import Toast from '../components/Toast';
import './Collections.css';

const QUICK_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '38', '40', '42', '44', '46', '47'];

function formatLaunch(val) {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleString('ar', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return val; }
}

const IMG_BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

const resolveImg = url =>
  (!url || url.startsWith('http') || url.startsWith('blob')) ? url : `${IMG_BASE}${url}`;

// منتج موجود مسبقاً
function makeProdEntry(p) {
  return {
    _id:              p._id,
    _tempId:          null,
    _modified:        false,
    _expanded:        true,
    _newImageFile:    null,
    _newImagePreview: null,
    name:        p.name        || '',
    category:    p.category?._id || p.category || '',
    colorName:   p.colorName   || '',
    price:       p.price       != null ? String(p.price)     : '',
    salePrice:   p.salePrice   != null ? String(p.salePrice) : '',
    stock:       p.stock       != null ? String(p.stock)     : '',
    sizes:       (p.sizes || []).map(s => ({ label: s.label, stock: s.stock })),
    description: p.description || '',
    label:       p.label       || '',
    images:      p.images?.length ? p.images : (p.image ? [p.image] : []),
  };
}

// منتج جديد (فارغ)
function makeEmptyProdEntry() {
  return {
    _id:              null,
    _tempId:          String(Date.now()) + Math.random(),
    _modified:        true,
    _expanded:        true,
    _newImageFile:    null,
    _newImagePreview: null,
    name:        '',
    category:    '',
    colorName:   '',
    price:       '',
    salePrice:   '',
    stock:       '',
    sizes:       [],
    description: '',
    label:       '',
    images:      [],
  };
}

export default function Collections() {
  const [view, setView]               = useState('list');
  const [collections, setCollections] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState(null);

  const [editIdx, setEditIdx]     = useState(null);
  const [colName, setColName]     = useState('');
  const [colDate, setColDate]     = useState('');   // datetime-local string
  const [colBanner, setColBanner] = useState(false);
  const [colProds, setColProds]   = useState([]);
  const [deleteIdx, setDeleteIdx] = useState(null);

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, prodsRes, catsRes] = await Promise.all([
        adminGetSettings(),
        adminGetProducts({}),
        adminGetCategories(),
      ]);
      setCollections(settingsRes.data?.collections || []);
      const prods = prodsRes.data?.products || prodsRes.data || [];
      setAllProducts(Array.isArray(prods) ? prods : []);
      setCategories(catsRes.data || []);
    } catch {
      showToast('❌ فشل تحميل البيانات', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── LIST actions ──
  function openCreate() {
    setEditIdx(null);
    setColName('');
    setColDate('');
    setColBanner(false);
    setColProds([]);
    setView('form');
  }

  function openEdit(idx) {
    const col = collections[idx];
    setEditIdx(idx);
    setColName(col.name || '');
    // حوّل التاريخ المخزون لصيغة datetime-local
    setColDate(col.launchDate ? new Date(col.launchDate).toISOString().slice(0, 16) : '');
    setColBanner(col.showBanner || false);

    const prods = (col.products || []).map(pid => {
      const id = typeof pid === 'object' ? pid : pid;
      const p  = allProducts.find(ap => ap._id === id);
      return p ? makeProdEntry(p) : null;
    }).filter(Boolean);

    setColProds(prods);
    setView('form');
  }

  async function handleToggleBanner(idx) {
    try {
      const updated = collections.map((c, i) =>
        i === idx ? { ...c, showBanner: !c.showBanner } : c
      );
      await adminUpdateSettings({ collections: updated });
      setCollections(updated);
    } catch { showToast('❌ حدث خطأ', 'error'); }
  }

  async function handleDeleteCollection() {
    try {
      const updated = collections.filter((_, i) => i !== deleteIdx);
      await adminUpdateSettings({ collections: updated });
      setCollections(updated);
      setDeleteIdx(null);
      showToast('🗑️ تم حذف الكولكشن');
    } catch { showToast('❌ فشل الحذف', 'error'); }
  }

  // ── FORM: منتجات ──
  const key = p => p._id || p._tempId;

  function addNewProduct() {
    setColProds(prev => [...prev, makeEmptyProdEntry()]);
  }

  function removeProduct(k) {
    setColProds(prev => {
      const p = prev.find(x => key(x) === k);
      if (p?._newImagePreview) URL.revokeObjectURL(p._newImagePreview);
      return prev.filter(x => key(x) !== k);
    });
  }

  function toggleExpand(k) {
    setColProds(prev => prev.map(p => key(p) === k ? { ...p, _expanded: !p._expanded } : p));
  }

  function updateProd(k, field, value) {
    setColProds(prev => prev.map(p =>
      key(p) === k ? { ...p, [field]: value, _modified: true } : p
    ));
  }

  function toggleProdSize(k, label) {
    setColProds(prev => prev.map(p => {
      if (key(p) !== k) return p;
      const exists = p.sizes.find(s => s.label === label);
      const sizes  = exists
        ? p.sizes.filter(s => s.label !== label)
        : [...p.sizes, { label, stock: null }];
      return { ...p, sizes, _modified: true };
    }));
  }

  function handleProdImage(k, file) {
    if (!file) return;
    setColProds(prev => prev.map(p => {
      if (key(p) !== k) return p;
      if (p._newImagePreview) URL.revokeObjectURL(p._newImagePreview);
      return { ...p, _newImageFile: file, _newImagePreview: URL.createObjectURL(file), _modified: true };
    }));
  }

  // ── SAVE ──
  async function handleSave() {
    if (!colName.trim()) { showToast('❌ اسم الكولكشن مطلوب', 'error'); return; }

    const hasNegative = colProds.some(p =>
      Number(p.price) < 0 ||
      (p.salePrice !== '' && Number(p.salePrice) < 0) ||
      (p.stock !== '' && Number(p.stock) < 0)
    );
    if (hasNegative) {
      showToast('❌ لا يمكن إدخال قيم سالبة للأسعار أو الكميات', 'error');
      return;
    }

    setSaving(true);
    try {
      const savedIds = await Promise.all(colProds.map(async p => {
        // رفع الصورة إن وجدت
        let images = p.images;
        if (p._newImageFile) {
          const url = await uploadProductImage(p._newImageFile);
          images    = [url, ...images.slice(1)];
        }

        const payload = {
          name:        p.name,
          price:       Number(p.price) || 0,
          salePrice:   p.salePrice ? Number(p.salePrice) : null,
          category:    p.category,
          colorName:   p.colorName || '',
          stock:       p.stock !== '' ? Number(p.stock) : null,
          sizes:       p.sizes,
          description: p.description,
          label:       p.label,
          images,
          image:       images[0] || '',
          inStock:     p.sizes.length > 0
            ? p.sizes.some(s => s.stock === null || s.stock > 0)
            : (p.stock === '' || Number(p.stock) > 0),
          isVisible: true,
        };

        if (p._id) {
          // منتج موجود — حدّثه إذا عُدّل
          if (p._modified) await adminUpdateProduct(p._id, payload);
          return p._id;
        } else {
          // منتج جديد — أنشئه
          if (!p.name || !p.category) return null;
          const res = await adminCreateProduct(payload);
          return res.data._id || res.data.id;
        }
      }));

      const validIds = savedIds.filter(Boolean);

      const entry = {
        id:         editIdx !== null ? (collections[editIdx]?.id || String(Date.now())) : String(Date.now()),
        name:       colName.trim(),
        launchDate: colDate ? new Date(colDate).toISOString() : null,
        showBanner: colBanner,
        products:   validIds,
      };

      const newCols = editIdx !== null
        ? collections.map((c, i) => i === editIdx ? entry : c)
        : [...collections, entry];

      await adminUpdateSettings({ collections: newCols });
      setCollections(newCols);
      showToast('✅ تم حفظ الكولكشن');
      setView('list');
      const res = await adminGetProducts({});
      const prods = res.data?.products || res.data || [];
      setAllProducts(Array.isArray(prods) ? prods : []);
    } catch (err) {
      showToast(`❌ ${err?.response?.data?.message || 'خطأ غير معروف'}`, 'error');
    } finally {
      setSaving(false);
    }
  }

  // ─────────────────────────────────────────
  return (
    <div className="collections-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ══════════ LIST VIEW ══════════ */}
      {view === 'list' && (
        <>
          <div className="admin-page-header">
            <div>
              <h2 className="admin-page-title">الكولكشنات</h2>
              <p className="admin-page-sub">{collections.length} كولكشن</p>
            </div>
            <button className="admin-btn admin-btn--primary" onClick={openCreate}>+ إضافة كولكشن</button>
          </div>

          {loading ? (
            <div className="admin-loading">جاري التحميل...</div>
          ) : collections.length === 0 ? (
            <div className="col-empty">
              <span>🗂️</span>
              <p>لا توجد كولكشنات بعد</p>
              <button className="admin-btn admin-btn--primary" onClick={openCreate}>+ إضافة أول كولكشن</button>
            </div>
          ) : (
            <div className="collections-grid">
              {collections.map((col, idx) => (
                <div className={`collection-card ${col.showBanner ? 'banner-on' : ''}`} key={col.id || idx}>
                  <div className="collection-card__body">
                    <h3 className="collection-card__name">{col.name}</h3>
                    <div className="collection-card__meta">
                      <span>🕐 {formatLaunch(col.launchDate)}</span>
                      <span>📦 {col.products?.length || 0} منتج</span>
                    </div>
                  </div>
                  <div className="collection-card__footer">
                    <button
                      className={`banner-toggle-btn ${col.showBanner ? 'active' : ''}`}
                      onClick={() => handleToggleBanner(idx)}
                    >
                      {col.showBanner ? '📢 بانر نشط' : '📣 تفعيل البانر'}
                    </button>
                    <div className="collection-card__actions">
                      <button className="action-btn" onClick={() => openEdit(idx)}>✏️</button>
                      <button className="action-btn action-btn--delete" onClick={() => setDeleteIdx(idx)}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {deleteIdx !== null && (
            <div className="col-confirm-overlay" onClick={() => setDeleteIdx(null)}>
              <div className="col-confirm" onClick={e => e.stopPropagation()}>
                <p>هل أنتِ متأكدة من حذف كولكشن "{collections[deleteIdx]?.name}"؟</p>
                <div className="col-confirm__actions">
                  <button className="admin-btn" onClick={() => setDeleteIdx(null)}>إلغاء</button>
                  <button className="admin-btn admin-btn--danger" onClick={handleDeleteCollection}>حذف</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════ FORM VIEW ══════════ */}
      {view === 'form' && (
        <>
          <div className="admin-page-header">
            <div>
              <button className="col-back-btn" onClick={() => setView('list')}>← العودة</button>
              <h2 className="admin-page-title">{editIdx !== null ? 'تعديل كولكشن' : 'إضافة كولكشن جديد'}</h2>
            </div>
            <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? 'جاري الحفظ...' : '💾 حفظ الكولكشن'}
            </button>
          </div>

          {/* ── بيانات الكولكشن ── */}
          <div className="col-meta-section">
            <div className="form-row form-row--3">
              <div className="form-field">
                <label>اسم الكولكشن <span className="req">*</span></label>
                <input
                  value={colName}
                  onChange={e => setColName(e.target.value)}
                  placeholder="مثال: صيف 2025"
                />
              </div>
              <div className="form-field">
                <label>موعد الظهور (تاريخ + وقت)</label>
                <input
                  type="datetime-local"
                  value={colDate}
                  onChange={e => setColDate(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>شريط البانر</label>
                <div className="banner-toggle-field">
                  <button
                    type="button"
                    className={`visibility-toggle-big ${colBanner ? 'visible' : 'hidden'}`}
                    onClick={() => setColBanner(v => !v)}
                  />
                  <span className="visibility-text">{colBanner ? 'البانر مفعّل' : 'البانر مخفي'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── منتجات الكولكشن ── */}
          <div className="col-products-section">
            <div className="col-products-header">
              <h3 className="col-products-title">
                منتجات الكولكشن <span>({colProds.length})</span>
              </h3>
              <button type="button" className="admin-btn admin-btn--primary" onClick={addNewProduct}>
                + إضافة منتج
              </button>
            </div>

            {colProds.length === 0 ? (
              <div className="col-no-products">
                <p>لا يوجد منتجات بعد</p>
                <button type="button" className="admin-btn admin-btn--primary" onClick={addNewProduct}>
                  + إضافة أول منتج
                </button>
              </div>
            ) : (
              <div className="col-prod-cards">
                {colProds.map((p, idx) => (
                  <div className={`col-prod-card ${p._expanded ? 'expanded' : ''}`} key={key(p)}>

                    {/* رأس البطاقة */}
                    <div className="col-prod-card__header" onClick={() => toggleExpand(key(p))}>
                      <div className="col-prod-card__hd-left">
                        {(p._newImagePreview || p.images?.[0]) && (
                          <img
                            src={p._newImagePreview || resolveImg(p.images[0])}
                            alt=""
                            className="col-prod-card__thumb"
                          />
                        )}
                        <span className="col-prod-card__hd-name">
                          {p.name || `منتج ${idx + 1}`}
                        </span>
                        {!p._id && <span className="new-badge">جديد</span>}
                        {p._modified && p._id && <span className="modified-badge">معدّل</span>}
                      </div>
                      <div className="col-prod-card__hd-right">
                        <button
                          type="button"
                          className="col-prod-remove"
                          onClick={e => { e.stopPropagation(); removeProduct(key(p)); }}
                        >×</button>
                        <span className="col-expand-icon">{p._expanded ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {/* جسم البطاقة */}
                    {p._expanded && (
                      <div className="col-prod-card__body">

                        {/* صف 1: اسم | فئة | لون */}
                        <div className="form-row form-row--3">
                          <div className="form-field">
                            <label>اسم المنتج <span className="req">*</span></label>
                            <input
                              value={p.name}
                              onChange={e => updateProd(key(p), 'name', e.target.value)}
                              placeholder="اسم المنتج"
                            />
                          </div>
                          <div className="form-field">
                            <label>الفئة <span className="req">*</span></label>
                            <select
                              value={p.category}
                              onChange={e => updateProd(key(p), 'category', e.target.value)}
                            >
                              <option value="">-- اختاري الفئة --</option>
                              {categories.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-field">
                            <label>لون المنتج (اختياري)</label>
                            <input
                              value={p.colorName}
                              onChange={e => updateProd(key(p), 'colorName', e.target.value)}
                              placeholder="مثال: بني، أسود"
                            />
                          </div>
                        </div>

                        {/* صف 2: سعر البيع | السعر الأصلي | الكمية */}
                        <div className="form-row form-row--3">
                          <div className="form-field">
                            <label>سعر البيع <span className="req">*</span></label>
                            <input
                              type="number" min="0"
                              value={p.price}
                              onChange={e => updateProd(key(p), 'price', e.target.value)}
                              placeholder="₪"
                            />
                          </div>
                          <div className="form-field">
                            <label>السعر قبل الخصم (₪)</label>
                            <input
                              type="number" min="0"
                              value={p.salePrice}
                              onChange={e => updateProd(key(p), 'salePrice', e.target.value)}
                              placeholder="اتركيه فارغاً"
                            />
                          </div>
                          <div className="form-field">
                            <label>الكمية المتاحة</label>
                            <input
                              type="number" min="0"
                              value={p.stock}
                              onChange={e => updateProd(key(p), 'stock', e.target.value)}
                              placeholder="∞"
                            />
                          </div>
                        </div>

                        {/* صف 3: ليبل | وصف */}
                        <div className="form-row form-row--2">
                          <div className="form-field">
                            <label>ليبل المنتج</label>
                            <input
                              value={p.label}
                              onChange={e => updateProd(key(p), 'label', e.target.value)}
                              placeholder="مثال: جديد، حصري"
                            />
                          </div>
                          <div className="form-field">
                            <label>الوصف</label>
                            <textarea
                              value={p.description}
                              onChange={e => updateProd(key(p), 'description', e.target.value)}
                              rows={2}
                              placeholder="وصف المنتج..."
                            />
                          </div>
                        </div>

                        {/* المقاسات */}
                        <div className="form-field">
                          <label>المقاسات</label>
                          <div className="mini-sizes">
                            {QUICK_SIZES.map(sz => (
                              <button
                                key={sz}
                                type="button"
                                className={`mini-size-btn ${p.sizes.find(s => s.label === sz) ? 'active' : ''}`}
                                onClick={() => toggleProdSize(key(p), sz)}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* الصورة */}
                        <div className="form-field">
                          <label>الصورة الرئيسية</label>
                          <div className="mini-image-field">
                            {(p._newImagePreview || p.images?.[0]) && (
                              <img
                                src={p._newImagePreview || resolveImg(p.images[0])}
                                alt=""
                                className="mini-img-preview"
                              />
                            )}
                            <label className="mini-upload-btn">
                              {p._newImageFile ? '✅ تم الاختيار' : 'رفع صورة'}
                              <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={e => handleProdImage(key(p), e.target.files[0])}
                              />
                            </label>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* شريط الحفظ */}
          <div className="col-save-bar">
            <span>
              {colProds.filter(p => !p._id).length > 0 && (
                <span className="new-count">{colProds.filter(p => !p._id).length} منتج جديد · </span>
              )}
              {colProds.length} منتج إجمالاً
            </span>
            <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? 'جاري الحفظ...' : '💾 حفظ الكولكشن'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
