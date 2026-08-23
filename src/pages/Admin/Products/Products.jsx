import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  adminGetProducts, adminCreateProduct, adminUpdateProduct,
  adminDeleteProduct, adminToggleProduct,
  adminGetCategories, uploadProductImage
} from '../../../services/adminApi';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import './Products.css';

const IMG_BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

const PRESET_LABELS = ['جديد', 'عرض خاص'];
const QUICK_SIZES   = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '38', '40', '42', '44', '46', '47'];

const EMPTY_FORM = {
  name: '', price: '', rawCost: '', salePrice: '',
  category: '', description: '',
  sizes: [], sizeGuide: [],
  label: '',
  colorName: '',
  linkedColors: [],
  isVisible: true, stock: '',
};

export default function Products() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');

  const [showModal, setShowModal]   = useState(false);
  const [editId, setEditId]         = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [saving, setSaving]         = useState(false);
  const [dragIdx, setDragIdx]       = useState(null);

  const [deleteId, setDeleteId]     = useState(null);
  const [toast, setToast]           = useState(null);
  const [variantSearch, setVariantSearch] = useState('');
  const [customSizeInput, setCustomSizeInput] = useState('');

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        adminGetProducts({}),
        adminGetCategories(),
      ]);
      const data = p.data?.products || p.data || [];
      setProducts(Array.isArray(data) ? data : []);
      setCategories(c.data || []);
    } catch {
      showToast('❌ فشل تحميل البيانات', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Stats ──
  const stats = useMemo(() => ({
    total:      products.length,
    available:  products.filter(p => p.inStock !== false).length,
    outOfStock: products.filter(p => p.inStock === false).length,
    deals:      products.filter(p => p.salePrice).length,
  }), [products]);

  const filtered = useMemo(() => products.filter(p => {
    if (filter === 'hidden') return !p.isVisible;
    if (filter === 'deals')  return !!p.salePrice;
    return true;
  }), [products, filter]);

  // ── Stock helper ──
  function getEffectiveStock(p) {
    if (p.sizes?.length > 0) {
      return p.sizes.reduce((sum, s) => {
        const st = s.stock;
        return sum + (st === null || st === undefined ? 999 : st);
      }, 0);
    }
    return p.stock === null || p.stock === undefined ? 999 : p.stock;
  }

  // ── Open modal ──
  function openCreate() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setImagePreviews([]);
    setVariantSearch('');
    setCustomSizeInput('');
    setShowModal(true);
  }

  function openEdit(p) {
    setForm({
      name:        p.name        || '',
      price:       p.price       != null ? String(p.price)     : '',
      rawCost:     p.rawCost     != null ? String(p.rawCost)   : '',
      salePrice:   p.salePrice   != null ? String(p.salePrice) : '',
      category:    p.category?._id || p.category || '',
      description: p.description  || '',
      sizes: (p.sizes || []).map(s => ({
        id: Math.random(), label: s.label || '',
        stock: s.stock != null ? String(s.stock) : '',
      })),
      sizeGuide: (p.sizeGuide || []).map(g => ({
        id: Math.random(), size: g.size || '', specs: g.specs || '',
      })),
      label: p.label || '',
      colorName: p.colorName || '',
      linkedColors: (p.linkedColors || []).map(c => ({
        id:        Math.random(),
        productId: c.productId?._id || c.productId || '',
        name:      c.name || '',
        _name:     typeof c.productId === 'object' ? c.productId?.name : '',
      })),
      isVisible: p.isVisible ?? true,
      stock:     p.stock != null ? String(p.stock) : '',
    });
    const imgs = p.images?.length ? p.images : (p.image ? [p.image] : []);
    setImagePreviews(imgs.map(url => ({ url, isExisting: true })));
    setEditId(p._id);
    setVariantSearch('');
    setCustomSizeInput('');
    setShowModal(true);
  }

  // ── Images ──
  function handleImageSelect(e) {
    const files = Array.from(e.target.files);
    setImagePreviews(prev => [
      ...prev,
      ...files.map(f => ({ url: URL.createObjectURL(f), isExisting: false, file: f })),
    ]);
  }
  function removeImage(i) {
    setImagePreviews(prev => {
      if (!prev[i].isExisting) URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, idx) => idx !== i);
    });
  }
  function handleDragStart(i)  { setDragIdx(i); }
  function handleDragOver(e)   { e.preventDefault(); }
  function handleDrop(i) {
    if (dragIdx === null || dragIdx === i) return;
    setImagePreviews(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(dragIdx, 1);
      arr.splice(i, 0, moved);
      return arr;
    });
    setDragIdx(null);
  }

  // ── Sizes ──
  function toggleQuickSize(label) {
    const exists = form.sizes.find(s => s.label === label);
    if (exists) {
      setForm(f => ({ ...f, sizes: f.sizes.filter(s => s.label !== label) }));
    } else {
      setForm(f => ({ ...f, sizes: [...f.sizes, { id: Math.random(), label, stock: '' }] }));
    }
  }
  function addCustomSize() {
    const lbl = customSizeInput.trim();
    if (!lbl || form.sizes.find(s => s.label === lbl)) return;
    setForm(f => ({ ...f, sizes: [...f.sizes, { id: Math.random(), label: lbl, stock: '' }] }));
    setCustomSizeInput('');
  }
  function updateSize(id, field, value) {
    setForm(f => ({ ...f, sizes: f.sizes.map(s => s.id === id ? { ...s, [field]: value } : s) }));
  }
  function removeSize(id) {
    setForm(f => ({ ...f, sizes: f.sizes.filter(s => s.id !== id) }));
  }

  // ── Size guide ──
  function addGuideRow() {
    setForm(f => ({ ...f, sizeGuide: [...f.sizeGuide, { id: Math.random(), size: '', specs: '' }] }));
  }
  function updateGuide(id, field, value) {
    setForm(f => ({ ...f, sizeGuide: f.sizeGuide.map(g => g.id === id ? { ...g, [field]: value } : g) }));
  }
  function removeGuide(id) {
    setForm(f => ({ ...f, sizeGuide: f.sizeGuide.filter(g => g.id !== id) }));
  }

  // ── Linked colors ──
  const variantResults = variantSearch
    ? products.filter(p =>
        p._id !== editId &&
        p.name.includes(variantSearch) &&
        !form.linkedColors.find(c => c.productId === p._id)
      ).slice(0, 5)
    : [];

  function addLinkedColor(p) {
    setForm(f => ({
      ...f,
      linkedColors: [...f.linkedColors, {
        id: Math.random(), productId: p._id,
        name: '', _name: p.name,
      }],
    }));
    setVariantSearch('');
  }
  function updateLinkedColor(id, field, value) {
    setForm(f => ({ ...f, linkedColors: f.linkedColors.map(c => c.id === id ? { ...c, [field]: value } : c) }));
  }
  function removeLinkedColor(id) {
    setForm(f => ({ ...f, linkedColors: f.linkedColors.filter(c => c.id !== id) }));
  }

  // ── Save ──
  async function handleSave() {
    if (!form.name || !form.price || !form.category) {
      showToast('❌ الاسم والسعر والفئة مطلوبة', 'error');
      return;
    }

    const negativeFields = [
      Number(form.price) < 0,
      form.rawCost !== '' && Number(form.rawCost) < 0,
      form.salePrice !== '' && Number(form.salePrice) < 0,
      form.stock !== '' && Number(form.stock) < 0,
      form.sizes.some(s => s.stock !== '' && Number(s.stock) < 0),
    ].some(Boolean);

    if (negativeFields) {
      showToast('❌ لا يمكن إدخال قيم سالبة للأسعار أو الكميات', 'error');
      return;
    }

    setSaving(true);
    try {
      const existingUrls = imagePreviews.filter(p => p.isExisting).map(p => p.url);
      const uploaded     = await Promise.all(imagePreviews.filter(p => !p.isExisting).map(p => uploadProductImage(p.file)));
      const allImages    = [...existingUrls, ...uploaded];

      const payload = {
        name:         form.name,
        price:        Number(form.price),
        rawCost:      form.rawCost === '' ? 0 : Number(form.rawCost),
        category:     form.category,
        description:  form.description,
        isVisible:    form.isVisible,
        images:       allImages,
        image:        allImages[0] || '',
        label:        form.label,
        sizeGuide:    form.sizeGuide.filter(g => g.size.trim()).map(({ size, specs }) => ({ size, specs })),
        colorName:    form.colorName,
        linkedColors: form.linkedColors.map(({ productId, name }) => ({ productId, name })),
      };

      if (form.salePrice) payload.salePrice = Number(form.salePrice);

      const validSizes = form.sizes.filter(s => s.label.trim());
      if (validSizes.length > 0) {
        payload.sizes   = validSizes.map(({ label, stock }) => ({
          label: label.trim(),
          stock: stock !== '' ? Number(stock) : null,
        }));
        payload.stock   = null;
        payload.inStock = payload.sizes.some(s => s.stock === null || s.stock > 0);
      } else {
        payload.sizes   = [];
        payload.stock   = form.stock !== '' ? Number(form.stock) : null;
        payload.inStock = payload.stock === null ? true : payload.stock > 0;
      }

      let savedProduct;
      if (editId) {
        const res = await adminUpdateProduct(editId, payload);
        savedProduct = res.data?.product || res.data || { ...payload, _id: editId };
        setProducts(prev => prev.map(p => p._id === editId ? { ...p, ...savedProduct } : p));
        showToast('✅ تم تحديث المنتج');
      } else {
        const res = await adminCreateProduct(payload);
        savedProduct = res.data?.product || res.data || { ...payload, _id: res.data?._id || Date.now().toString() };
        setProducts(prev => [savedProduct, ...prev]);
        showToast('✅ تمت إضافة المنتج');
      }
      setShowModal(false);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'خطأ غير معروف';
      showToast(`❌ ${msg}`, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await adminDeleteProduct(deleteId);
      setProducts(prev => prev.filter(p => p._id !== deleteId));
      showToast('🗑️ تم الحذف');
      setDeleteId(null);
    } catch {
      showToast('❌ فشل الحذف', 'error');
    }
  }

  async function handleToggleVisibility(id) {
    try {
      const res = await adminToggleProduct(id);
      const updated = res.data?.product || res.data || null;
      setProducts(prev => prev.map(p => {
        if (p._id !== id) return p;
        return updated ? { ...p, ...updated } : { ...p, isVisible: !p.isVisible };
      }));
    } catch {
      showToast('❌ حدث خطأ', 'error');
    }
  }

  async function handleToggleStock(p) {
    try {
      const res = await adminUpdateProduct(p._id, { inStock: !p.inStock });
      const updated = res.data?.product || res.data || null;
      setProducts(prev => prev.map(item => {
        if (item._id !== p._id) return item;
        return updated ? { ...item, ...updated } : { ...item, inStock: !item.inStock };
      }));
    } catch {
      showToast('❌ حدث خطأ', 'error');
    }
  }

  async function handleToggleLastPiece(p) {
    try {
      const res = await adminUpdateProduct(p._id, { hideLastPiece: !p.hideLastPiece });
      const updated = res.data?.product || res.data || null;
      setProducts(prev => prev.map(item => {
        if (item._id !== p._id) return item;
        return updated ? { ...item, ...updated } : { ...item, hideLastPiece: !item.hideLastPiece };
      }));
    } catch {
      showToast('❌ حدث خطأ', 'error');
    }
  }

  const resolveImg = url =>
    (!url || url.startsWith('http') || url.startsWith('blob')) ? url : `${IMG_BASE}${url}`;

  // ─────────────────────────────────────────
  return (
    <div className="products-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Header ── */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">المنتجات</h2>
          <p className="admin-page-sub">{products.length} منتج</p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={openCreate}>+ إضافة منتج</button>
      </div>

      {/* ── Stats Row ── */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-card__num">{stats.total}</span>
          <span className="stat-card__label">إجمالي المنتجات</span>
        </div>
        <div className="stat-card stat-card--green">
          <span className="stat-card__num">{stats.available}</span>
          <span className="stat-card__label">متوفر</span>
        </div>
        <div className="stat-card stat-card--red">
          <span className="stat-card__num">{stats.outOfStock}</span>
          <span className="stat-card__label">نفذ المخزون</span>
        </div>
        <div className="stat-card stat-card--gold">
          <span className="stat-card__num">{stats.deals}</span>
          <span className="stat-card__label">عروض نشطة</span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="product-filters">
        {[
          { key: 'all',    label: 'الكل',  count: products.length },
          { key: 'hidden', label: 'مخفي',  count: products.filter(p => !p.isVisible).length },
          { key: 'deals',  label: 'عروض',  count: products.filter(p => p.salePrice).length },
        ].map(f => (
          <button
            key={f.key}
            className={`filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className="filter-btn__count">{f.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-loading">جاري التحميل...</div>
      ) : (
        <>
          {/* ── Desktop Table ── */}
          <div className="admin-table-wrap products-table-desktop">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>الصورة</th>
                  <th>المنتج</th>
                  <th>الفئة</th>
                  <th>السعر</th>
                  <th>السعر الخام</th>
                  <th>المقاسات</th>
                  <th>الكمية</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const thumb     = p.images?.[0] || p.image;
                  const effStock  = getEffectiveStock(p);
                  return (
                    <tr key={p._id}>

                      {/* الصورة */}
                      <td>
                        {thumb
                          ? <img src={resolveImg(thumb)} alt="" className="product-img-thumb" />
                          : <div className="product-img-thumb product-img-thumb--empty">📦</div>
                        }
                      </td>

                      {/* المنتج */}
                      <td className="product-name-td">
                        <span className="product-name-text">{p.name}</span>
                        {p.label && <span className="prod-label-badge">{p.label}</span>}
                      </td>

                      {/* الفئة */}
                      <td>{p.category?.name || '—'}</td>

                      {/* السعر */}
                      <td className="price-td">
                        <span className="price-sale">{p.price} ₪</span>
                        {p.salePrice && <span className="price-orig">{p.salePrice} ₪</span>}
                      </td>

                      {/* السعر الخام */}
                      <td>
                        <span className="raw-cost-pill">{Number(p.rawCost || 0)} ₪</span>
                      </td>

                      {/* المقاسات */}
                      <td>
                        {p.sizes?.length > 0 ? (
                          <div className="sizes-mini">
                            {p.sizes.slice(0, 4).map((s, i) => (
                              <span
                                key={i}
                                className={`size-mini-badge ${s.stock === 0 ? 'out' : ''}`}
                              >
                                {s.label}
                              </span>
                            ))}
                            {p.sizes.length > 4 && (
                              <span className="size-mini-more">+{p.sizes.length - 4}</span>
                            )}
                          </div>
                        ) : <span className="no-sizes">—</span>}
                      </td>

                      {/* الكمية */}
                      <td>
                        <div className="qty-cell">
                          {p.sizes?.length > 0 ? (() => {
                            const avail = p.sizes.filter(s => s.stock === null || s.stock === undefined || s.stock > 0).length;
                            return avail === 0
                              ? <span className="stock-badge stock-zero">نفذت</span>
                              : <span className="stock-badge stock-unlimited">{avail}/{p.sizes.length}</span>;
                          })() : (
                            p.stock === null || p.stock === undefined
                              ? <span className="stock-badge stock-unlimited">∞</span>
                              : p.stock === 0
                                ? <span className="stock-badge stock-zero">نفذت</span>
                                : <span className="stock-badge stock-low">{p.stock}</span>
                          )}
                          {effStock === 1 && (
                            <button
                              className={`last-piece-toggle ${p.hideLastPiece ? 'lp-hidden' : 'lp-showing'}`}
                              onClick={() => handleToggleLastPiece(p)}
                              title={p.hideLastPiece ? 'إظهار شريط آخر قطعة' : 'إخفاء شريط آخر قطعة'}
                            >
                              {p.hideLastPiece ? '🏷️' : '🔖'}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* الحالة */}
                      <td>
                        <button
                          className={`visibility-toggle ${p.isVisible ? 'visible' : 'hidden'}`}
                          onClick={() => handleToggleVisibility(p._id)}
                          title={p.isVisible ? 'ظاهر' : 'مخفي'}
                        />
                      </td>

                      {/* الإجراءات */}
                      <td>
                        <div className="actions-cell">
                          <button className="action-btn" onClick={() => openEdit(p)} title="تعديل">✏️</button>
                          <button
                            className={`action-btn action-btn--stock`}
                            onClick={() => handleToggleStock(p)}
                            title={p.inStock ? 'متوفر — إيقاف' : 'نفذ — تفعيل'}
                          >
                            {p.inStock ? '✅' : '❌'}
                          </button>
                          <button className="action-btn action-btn--delete" onClick={() => setDeleteId(p._id)} title="حذف">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="empty-row">لا توجد منتجات</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Mobile Cards ── */}
          <div className="products-cards-mobile">
            {filtered.map(p => {
              const thumb    = p.images?.[0] || p.image;
              const effStock = getEffectiveStock(p);
              return (
                <div key={p._id} className="product-mobile-card">
                  {thumb && <img src={resolveImg(thumb)} alt="" className="product-mobile-card__img" />}
                  <div className="product-mobile-card__body">
                    <div className="product-mobile-card__row">
                      <span className="product-mobile-card__name">{p.name}</span>
                      {p.label && <span className="prod-label-badge">{p.label}</span>}
                    </div>
                    <div className="product-mobile-card__price">
                      <span className="price-sale">{p.price} ₪</span>
                      {p.salePrice && <span className="price-orig">{p.salePrice} ₪</span>}
                      <span className="raw-cost-pill">خام: {Number(p.rawCost || 0)} ₪</span>
                    </div>
                    <div className="product-mobile-card__meta">
                      <span>{p.category?.name || '—'}</span>
                      {p.sizes?.length > 0 && <span>{p.sizes.length} مقاس</span>}
                    </div>
                    <div className="product-mobile-card__actions">
                      <button
                        className={`visibility-toggle ${p.isVisible ? 'visible' : 'hidden'}`}
                        onClick={() => handleToggleVisibility(p._id)}
                      />
                      <button
                        className="action-btn action-btn--stock"
                        onClick={() => handleToggleStock(p)}
                        title={p.inStock ? 'متوفر' : 'نفذ'}
                      >
                        {p.inStock ? '✅' : '❌'}
                      </button>
                      {effStock === 1 && (
                        <button
                          className={`last-piece-toggle ${p.hideLastPiece ? 'lp-hidden' : 'lp-showing'}`}
                          onClick={() => handleToggleLastPiece(p)}
                        >
                          {p.hideLastPiece ? '🏷️' : '🔖'}
                        </button>
                      )}
                      <button className="action-btn" onClick={() => openEdit(p)}>✏️</button>
                      <button className="action-btn action-btn--delete" onClick={() => setDeleteId(p._id)}>🗑️</button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="empty-text">لا توجد منتجات</p>}
          </div>
        </>
      )}

      {/* ══════════ Modal ══════════ */}
      {showModal && (
        <Modal
          title={editId ? 'تعديل المنتج' : 'إضافة منتج جديد'}
          onClose={() => setShowModal(false)}
          onConfirm={handleSave}
          confirmLabel={saving ? 'جاري الحفظ...' : editId ? 'حفظ التعديلات' : 'إضافة'}
          confirmDisabled={saving}
          wide
        >
          <div className="product-form">

            {/* 1 ── اسم المنتج ── */}
            <div className="form-section">
              <div className="form-field">
                <label>اسم المنتج <span className="req">*</span></label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="مثال: فستان صيفي أنيق"
                />
              </div>
            </div>

            {/* 2 ── الفئة + سعر البيع + السعر الأصلي ── */}
            <div className="form-section">
              <div className="form-row form-row--4">
                <div className="form-field">
                  <label>الفئة <span className="req">*</span></label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    <option value="">-- اختري --</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>سعر البيع <span className="req">*</span></label>
                  <input
                    type="number" min="0"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="₪"
                  />
                </div>
                <div className="form-field">
                  <label>السعر الخام</label>
                  <input
                    type="number" min="0"
                    value={form.rawCost}
                    onChange={e => setForm(f => ({ ...f, rawCost: e.target.value }))}
                    placeholder="تكلفة القطعة"
                  />
                </div>
                <div className="form-field">
                  <label> السعر الأصلي المشطوب</label>
                  <input
                    type="number" min="0"
                    value={form.salePrice}
                    onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))}
                    placeholder="قبل الخصم"
                  />
                </div>
              </div>
            </div>

            {/* 3 ── المقاسات ── */}
            <div className="form-section">
              <h4 className="form-section__title">المقاسات</h4>
              <div className="quick-sizes">
                {QUICK_SIZES.map(sz => (
                  <button
                    key={sz}
                    type="button"
                    className={`quick-size-btn ${form.sizes.find(s => s.label === sz) ? 'active' : ''}`}
                    onClick={() => toggleQuickSize(sz)}
                  >
                    {sz}
                  </button>
                ))}
                <div className="custom-size-wrap">
                  <input
                    className="custom-size-field"
                    value={customSizeInput}
                    onChange={e => setCustomSizeInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSize(); } }}
                    placeholder="مخصص"
                  />
                  <button type="button" className="custom-size-add" onClick={addCustomSize}>+</button>
                </div>
              </div>

              {form.sizes.length > 0 && (
                <div className="sizes-stock-list">
                  <div className="sizes-stock-header">
                    <span>المقاس</span>
                    <span>الكمية (فارغ = غير محدود)</span>
                  </div>
                  {form.sizes.map(sz => (
                    <div key={sz.id} className="size-stock-row">
                      <span className="size-stock-label">{sz.label}</span>
                      <input
                        type="number" min="0"
                        className="size-stock-input"
                        value={sz.stock}
                        onChange={e => updateSize(sz.id, 'stock', e.target.value)}
                        placeholder="∞"
                      />
                      <button type="button" className="remove-color-btn" onClick={() => removeSize(sz.id)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4 ── الوصف ── */}
            <div className="form-section">
              <div className="form-field">
                <label>وصف المنتج</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="وصف تفاصيل المنتج، الخامة، اللون..."
                />
              </div>
            </div>

            {/* 5 ── الليبل ── */}
            <div className="form-section">
              <h4 className="form-section__title">ليبل المنتج</h4>
              <div className="label-picker">
                {PRESET_LABELS.map(lbl => (
                  <button
                    key={lbl}
                    type="button"
                    className={`label-preset-btn ${form.label === lbl ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, label: f.label === lbl ? '' : lbl }))}
                  >
                    {lbl}
                  </button>
                ))}
                {form.label && !PRESET_LABELS.includes(form.label) && (
                  <button type="button" className="label-preset-btn active">
                    {form.label}
                  </button>
                )}
              </div>
              <input
                className="label-custom-input"
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="أو اكتبي ليبل مخصص..."
              />
            </div>

            {/* 6 ── جدول المقاسات ── */}
            <div className="form-section">
              <div className="form-section__header">
                <h4 className="form-section__title">جدول المقاسات</h4>
                <button type="button" className="add-color-btn" onClick={addGuideRow}>+ صف</button>
              </div>
              {form.sizeGuide.length > 0 && (
                <table className="size-guide-table">
                  <thead>
                    <tr><th>المقاس</th><th>المواصفات</th><th></th></tr>
                  </thead>
                  <tbody>
                    {form.sizeGuide.map(g => (
                      <tr key={g.id}>
                        <td>
                          <input
                            className="guide-input"
                            value={g.size}
                            onChange={e => updateGuide(g.id, 'size', e.target.value)}
                            placeholder="S"
                          />
                        </td>
                        <td>
                          <input
                            className="guide-input guide-input--wide"
                            value={g.specs}
                            onChange={e => updateGuide(g.id, 'specs', e.target.value)}
                            placeholder="صدر 90، خصر 70"
                          />
                        </td>
                        <td>
                          <button type="button" className="remove-color-btn" onClick={() => removeGuide(g.id)}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* 7 ── الصور ── */}
            <div className="form-section">
              <h4 className="form-section__title">الصور</h4>
              <label className="upload-area">
                <input type="file" accept="image/*" multiple onChange={handleImageSelect} hidden />
                <span className="upload-area__icon">📸</span>
                <span className="upload-area__text">اضغطي لرفع الصور · اسحبي لإعادة الترتيب</span>
              </label>
              {imagePreviews.length > 0 && (
                <div className="image-previews-grid">
                  {imagePreviews.map((preview, i) => (
                    <div
                      key={i}
                      className={`preview-item ${dragIdx === i ? 'dragging' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(i)}
                    >
                      {i === 0 && <span className="preview-item__main">رئيسية</span>}
                      <img src={resolveImg(preview.url)} alt="" className="preview-item__img" />
                      <button type="button" className="preview-item__remove" onClick={() => removeImage(i)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 8 ── الكميات + الظهور ── */}
            <div className="form-section">
              <h4 className="form-section__title">الكمية والمخزون</h4>
              <div className="form-row">
                <div className="form-field">
                  <label>الكمية الإجمالية</label>
                  <input
                    type="number" min="0"
                    value={form.stock}
                    onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                    placeholder="فارغ = غير محدودة"
                  />
                  <span className="field-hint">
                    {form.stock === '' ? 'غير محدودة'
                      : Number(form.stock) === 0 ? 'نفذت الكمية'
                      : `${form.stock} قطعة`}
                  </span>
                </div>
                <div className="form-field">
                  <label>الظهور</label>
                  <div className="visibility-row">
                    <button
                      type="button"
                      className={`visibility-toggle-big ${form.isVisible ? 'visible' : 'hidden'}`}
                      onClick={() => setForm(f => ({ ...f, isVisible: !f.isVisible }))}
                    />
                    <span className="visibility-text">{form.isVisible ? 'مرئي للزبائن' : 'مخفي'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 9 ── ربط الألوان ── */}
            <div className="form-section">
              <h4 className="form-section__title">ربط ألوان المنتج</h4>
              <p className="field-hint">اربطي هذا المنتج بمنتجات أخرى لنفس القطعة بألوان مختلفة</p>

              {/* لون هذا المنتج */}
              <div className="form-field" style={{ marginBottom: 12 }}>
                <label>لون هذا المنتج</label>
                <input
                  value={form.colorName}
                  onChange={e => setForm(f => ({ ...f, colorName: e.target.value }))}
                  placeholder="مثال: أسود"
                />
              </div>

              {/* بحث عن منتج للربط */}
              <div className="variant-search-wrap">
                <input
                  className="variant-search-input"
                  value={variantSearch}
                  onChange={e => setVariantSearch(e.target.value)}
                  placeholder="ابحثي عن منتج بالاسم لإضافته كلون مرتبط..."
                />
                {variantResults.length > 0 && (
                  <ul className="variant-search-results">
                    {variantResults.map(p => (
                      <li key={p._id} onClick={() => addLinkedColor(p)}>
                        {p.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* الألوان المرتبطة */}
              {form.linkedColors.length > 0 && (
                <div className="color-variants-list">
                  {form.linkedColors.map(c => (
                    <div key={c.id} className="color-variant-row">
                      <span className="variant-product-name">
                        {c._name || products.find(p => p._id === c.productId)?.name || c.productId}
                      </span>
                      <input
                        className="color-name-input"
                        value={c.name}
                        onChange={e => updateLinkedColor(c.id, 'name', e.target.value)}
                        placeholder="لون هذا المنتج (مثال: بني)"
                      />
                      <button type="button" className="remove-color-btn" onClick={() => removeLinkedColor(c.id)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </Modal>
      )}

      {/* ── تأكيد الحذف ── */}
      {deleteId && (
        <Modal
          title="حذف المنتج"
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          confirmLabel="حذف"
          danger
        >
          <p>هل أنتِ متأكدة من حذف هذا المنتج؟ لا يمكن التراجع.</p>
        </Modal>
      )}
    </div>
  );
}
