import { useEffect, useState, useCallback } from 'react';
import {
  adminGetParcels, adminGetParcel, adminCreateParcel, adminUpdateParcel, adminDeleteParcel,
  adminGetProducts, adminCreateProduct, adminUpdateProduct,
  adminGetCategories, uploadProductImage,
} from '../../../services/adminApi';
import Toast from '../components/Toast';
import './Parcels.css';

const QUICK_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '38', '40', '42', '44', '46', '47'];

const IMG_BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

const resolveImg = url =>
  (!url || url.startsWith('http') || url.startsWith('blob')) ? url : `${IMG_BASE}${url}`;

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

// منتج موجود مسبقاً — نفس بيانات المنتج تُعرض هون بس، بلا أي تعديل على منطقه
function makeProdEntry(p) {
  return {
    _id:              p._id,
    _tempId:          null,
    _modified:        false,
    _expanded:        true,
    _newImageFile:    null,
    _newImagePreview: null,
    _soldQty:         p.soldQty ?? null,
    _soldProfit:      p.soldProfit ?? null,
    name:        p.name        || '',
    category:    p.category?._id || p.category || '',
    colorName:   p.colorName   || '',
    price:       p.price       != null ? String(p.price)     : '',
    rawCost:     p.rawCost     != null ? String(p.rawCost)   : '',
    salePrice:   p.salePrice   != null ? String(p.salePrice) : '',
    stock:       p.stock       != null ? String(p.stock)     : '',
    sizes:       (p.sizes || []).map(s => ({ label: s.label, stock: s.stock })),
    description: p.description || '',
    label:       p.label       || '',
    images:      p.images?.length ? p.images : (p.image ? [p.image] : []),
  };
}

// منتج جديد (فارغ) بيتولد مباشرة جوا الطرد
function makeEmptyProdEntry() {
  return {
    _id:              null,
    _tempId:          String(Date.now()) + Math.random(),
    _modified:        true,
    _expanded:        true,
    _newImageFile:    null,
    _newImagePreview: null,
    _soldQty:         null,
    _soldProfit:      null,
    name:        '',
    category:    '',
    colorName:   '',
    price:       '',
    rawCost:     '',
    salePrice:   '',
    stock:       '',
    sizes:       [],
    description: '',
    label:       '',
    images:      [],
  };
}

export default function Parcels() {
  const [view, setView]           = useState('list');
  const [parcels, setParcels]     = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);

  const [editId, setEditId]       = useState(null);
  const [parName, setParName]     = useState('');
  const [styleCost, setStyleCost] = useState('');
  const [parProds, setParProds]   = useState([]);
  const [selectedExistingProductId, setSelectedExistingProductId] = useState('');
  const [deleteId, setDeleteId]   = useState(null);

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [parcelsRes, prodsRes, catsRes] = await Promise.all([
        adminGetParcels(),
        adminGetProducts({}),
        adminGetCategories(),
      ]);
      setParcels(Array.isArray(parcelsRes.data) ? parcelsRes.data : []);
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
    setEditId(null);
    setParName('');
    setStyleCost('');
    setParProds([]);
    setSelectedExistingProductId('');
    setView('form');
  }

  async function openEdit(id) {
    setLoading(true);
    try {
      const res = await adminGetParcel(id);
      const parcel = res.data;
      setEditId(parcel._id);
      setParName(parcel.name || '');
      setStyleCost(parcel.styleCost != null ? String(parcel.styleCost) : '');
      setParProds((parcel.products || []).map(makeProdEntry));
      setSelectedExistingProductId('');
      setView('form');
    } catch {
      showToast('❌ تعذر تحميل الطرد', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteParcel() {
    try {
      await adminDeleteParcel(deleteId);
      setParcels(prev => prev.filter(p => p._id !== deleteId));
      setDeleteId(null);
      showToast('🗑️ تم حذف الطرد');
    } catch { showToast('❌ فشل الحذف', 'error'); }
  }

  // ── FORM: منتجات ──
  const key = p => p._id || p._tempId;

  function addNewProduct() {
    setParProds(prev => [...prev, makeEmptyProdEntry()]);
  }

  function addExistingProduct() {
    if (!selectedExistingProductId) return;

    const product = allProducts.find(p => p._id === selectedExistingProductId);
    if (!product) return;

    setParProds(prev => {
      if (prev.some(p => p._id === product._id)) return prev;
      return [...prev, makeProdEntry(product)];
    });
    setSelectedExistingProductId('');
  }

  function removeProduct(k) {
    setParProds(prev => {
      const p = prev.find(x => key(x) === k);
      if (p?._newImagePreview) URL.revokeObjectURL(p._newImagePreview);
      return prev.filter(x => key(x) !== k);
    });
  }

  function toggleExpand(k) {
    setParProds(prev => prev.map(p => key(p) === k ? { ...p, _expanded: !p._expanded } : p));
  }

  function updateProd(k, field, value) {
    setParProds(prev => prev.map(p =>
      key(p) === k ? { ...p, [field]: value, _modified: true } : p
    ));
  }

  function toggleProdSize(k, label) {
    setParProds(prev => prev.map(p => {
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
    setParProds(prev => prev.map(p => {
      if (key(p) !== k) return p;
      if (p._newImagePreview) URL.revokeObjectURL(p._newImagePreview);
      return { ...p, _newImageFile: file, _newImagePreview: URL.createObjectURL(file), _modified: true };
    }));
  }

  // ── SAVE ──
  async function handleSave() {
    if (!parName.trim()) { showToast('❌ اسم الطرد مطلوب', 'error'); return; }

    const hasNegative = parProds.some(p =>
      Number(p.price) < 0 ||
      (p.rawCost !== '' && Number(p.rawCost) < 0) ||
      (p.salePrice !== '' && Number(p.salePrice) < 0) ||
      (p.stock !== '' && Number(p.stock) < 0)
    );
    if (hasNegative || Number(styleCost) < 0) {
      showToast('❌ لا يمكن إدخال قيم سالبة للأسعار أو الكميات', 'error');
      return;
    }

    setSaving(true);
    try {
      const savedIds = await Promise.all(parProds.map(async p => {
        let images = p.images;
        if (p._newImageFile) {
          const url = await uploadProductImage(p._newImageFile);
          images    = [url, ...images.slice(1)];
        }

        const payload = {
          name:        p.name,
          price:       Number(p.price) || 0,
          rawCost:     p.rawCost === '' ? 0 : Number(p.rawCost),
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
          if (p._modified) await adminUpdateProduct(p._id, payload);
          return p._id;
        } else {
          if (!p.name || !p.category) return null;
          const res = await adminCreateProduct(payload);
          return res.data._id || res.data.id;
        }
      }));

      const validIds = savedIds.filter(Boolean);

      const payload = {
        name: parName.trim(),
        styleCost: styleCost === '' ? 0 : Number(styleCost),
        products: validIds,
      };

      if (editId) {
        await adminUpdateParcel(editId, payload);
      } else {
        await adminCreateParcel(payload);
      }

      showToast('✅ تم حفظ الطرد');
      setView('list');
      await load();
    } catch (err) {
      showToast(`❌ ${err?.response?.data?.message || 'خطأ غير معروف'}`, 'error');
    } finally {
      setSaving(false);
    }
  }

  // ── مجاميع لحظية لشريط الحفظ (تُحسب من بيانات المنتجات المحمّلة وقت الفتح) ──
  const liveSoldQty    = parProds.reduce((s, p) => s + (p._soldQty || 0), 0);
  const liveSoldProfit = parProds.reduce((s, p) => s + (p._soldProfit || 0), 0);
  const liveNetProfit  = liveSoldProfit - (Number(styleCost) || 0);

  // ─────────────────────────────────────────
  return (
    <div className="parcels-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ══════════ LIST VIEW ══════════ */}
      {view === 'list' && (
        <>
          <div className="admin-page-header">
            <div>
              <h2 className="admin-page-title">الطرود</h2>
              <p className="admin-page-sub">تكلفة كل طرد توريد وربحه الفعلي بعد البيع</p>
            </div>
            <button className="admin-btn admin-btn--primary" onClick={openCreate}>+ إضافة طرد</button>
          </div>

          {loading ? (
            <div className="admin-loading">جاري التحميل...</div>
          ) : parcels.length === 0 ? (
            <div name="pcl-empty" className="pcl-empty">
              <span>📦</span>
              <p>لا توجد طرود بعد</p>
              <button className="admin-btn admin-btn--primary" onClick={openCreate}>+ إضافة أول طرد</button>
            </div>
          ) : (
            <div className="pcl-grid">
              {parcels.map((parcel) => (
                <div className="pcl-card" key={parcel._id}>
                  <div className="pcl-card__body">
                    <h3 className="pcl-card__name">{parcel.name}</h3>
                    <div className="pcl-card__meta">
                      <span>📦 {parcel.productsCount || 0} منتج</span>
                      <span>🧵 تنسيق: {fmt(parcel.styleCost)} ₪</span>
                      <span>🛒 مباع: {parcel.soldQty || 0} قطعة</span>
                    </div>
                  </div>
                  <div className="pcl-card__footer">
                    <span className={`pcl-net-profit ${parcel.netProfit >= 0 ? 'pos' : 'neg'}`}>
                      {parcel.netProfit >= 0 ? '✅ ربح' : '⚠️ خسارة'}: {fmt(Math.abs(parcel.netProfit))} ₪
                    </span>
                    <div className="pcl-card__actions">
                      <button className="action-btn" onClick={() => openEdit(parcel._id)}>✏️</button>
                      <button className="action-btn action-btn--delete" onClick={() => setDeleteId(parcel._id)}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {deleteId !== null && (
            <div className="col-confirm-overlay" onClick={() => setDeleteId(null)}>
              <div className="col-confirm" onClick={e => e.stopPropagation()}>
                <p>هل أنتِ متأكدة من حذف طرد "{parcels.find(p => p._id === deleteId)?.name}"؟ (المنتجات نفسها بتضل موجودة، بس رح تنفصل عن الطرد)</p>
                <div className="col-confirm__actions">
                  <button className="admin-btn" onClick={() => setDeleteId(null)}>إلغاء</button>
                  <button className="admin-btn admin-btn--danger" onClick={handleDeleteParcel}>حذف</button>
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
              <h2 className="admin-page-title">{editId ? 'تعديل طرد' : 'إضافة طرد جديد'}</h2>
            </div>
            <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? 'جاري الحفظ...' : '💾 حفظ الطرد'}
            </button>
          </div>

          {/* ── بيانات الطرد ── */}
          <div className="col-meta-section">
            <div className="form-row form-row--2">
              <div className="form-field">
                <label>اسم الطرد <span className="req">*</span></label>
                <input
                  value={parName}
                  onChange={e => setParName(e.target.value)}
                  placeholder="مثال: طرد بلايز فيكتوري"
                />
              </div>
              <div className="form-field">
                <label>تكلفة التنسيق/الشحن (₪)</label>
                <input
                  type="number" min="0"
                  value={styleCost}
                  onChange={e => setStyleCost(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* ── منتجات الطرد ── */}
          <div className="col-products-section">
            <div className="col-products-header">
              <h3 className="col-products-title">
                منتجات الطرد <span>({parProds.length})</span>
              </h3>
              <div className="col-product-actions">
                <div className="col-existing-product-picker">
                  <select
                    value={selectedExistingProductId}
                    onChange={e => setSelectedExistingProductId(e.target.value)}
                    aria-label="اختر منتج موجود"
                  >
                    <option value="">اختر منتج موجود</option>
                    {allProducts
                      .filter(p => !parProds.some(cp => cp._id === p._id))
                      .map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                  </select>
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary"
                    onClick={addExistingProduct}
                    disabled={!selectedExistingProductId}
                  >
                    + إضافة منتج موجود
                  </button>
                </div>
                <button type="button" className="admin-btn admin-btn--primary" onClick={addNewProduct}>
                  + إضافة منتج جديد
                </button>
              </div>
            </div>

            {parProds.length === 0 ? (
              <div className="col-no-products">
                <p>لا يوجد منتجات بعد</p>
                <button type="button" className="admin-btn admin-btn--primary" onClick={addNewProduct}>
                  + إضافة أول منتج
                </button>
              </div>
            ) : (
              <div className="col-prod-cards">
                {parProds.map((p, idx) => (
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
                        {p._soldQty != null && (
                          <span className="pcl-sold-pill">
                            بيع: {p._soldQty} قطعة · {fmt(p._soldProfit)} ₪ ربح
                          </span>
                        )}
                        <span className="col-prod-card__price">
                          {fmt(p.price)} ₪
                        </span>
                        <span className="col-prod-card__raw-cost">
                          خام: {fmt(p.rawCost)} ₪
                        </span>
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

                        <div className="form-row form-row--4">
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
                            <label>السعر الخام</label>
                            <input
                              type="number" min="0"
                              value={p.rawCost}
                              onChange={e => updateProd(key(p), 'rawCost', e.target.value)}
                              placeholder="تكلفة القطعة"
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
          <div className="col-save-bar pcl-save-bar">
            <span>
              {parProds.filter(p => !p._id).length > 0 && (
                <span className="new-count">{parProds.filter(p => !p._id).length} منتج جديد · </span>
              )}
              {parProds.length} منتج إجمالاً
              {editId && (
                <span className="pcl-save-bar__profit">
                  {' · '}مباع: {liveSoldQty} قطعة · صافي {liveNetProfit >= 0 ? 'ربح' : 'خسارة'}: {fmt(Math.abs(liveNetProfit))} ₪
                </span>
              )}
            </span>
            <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? 'جاري الحفظ...' : '💾 حفظ الطرد'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
