import { useEffect, useState } from 'react';
import { adminGetSettings, adminUpdateSettings, uploadProductImage } from '../../../services/adminApi';
import Toast from '../components/Toast';
import { PRESET_LOGOS, resolveLogoSrc } from '../../../utils/paymentPresets';
import './Settings.css';

const EMPTY_METHOD = { name: '', accountNumber: '', iban: '', accountHolderName: '', logo: '', isVisible: true };
const EMPTY_DISCOUNT = { code: '', percent: '', isActive: true };

export default function Settings() {
  const [form, setForm] = useState({ whatsapp: '', storeName: '' });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [discountCodes, setDiscountCodes] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);

  // new-method form state
  const [showAddForm, setShowAddForm]       = useState(false);
  const [newMethod, setNewMethod]           = useState(EMPTY_METHOD);
  const [uploadingLogo, setUploadingLogo]   = useState(false);

  // new-discount-code form state
  const [showAddDiscount, setShowAddDiscount] = useState(false);
  const [newDiscount, setNewDiscount]         = useState(EMPTY_DISCOUNT);

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  useEffect(() => {
    adminGetSettings()
      .then(res => {
        const d = res.data || {};
        setForm({ whatsapp: d.whatsappNumber || '', storeName: d.storeName || '' });
        setPaymentMethods(d.paymentMethods || []);
        setDiscountCodes(d.discountCodes || []);
      })
      .catch(() => showToast('❌ فشل تحميل الإعدادات', 'error'))
      .finally(() => setLoading(false));
  }, []);


  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadProductImage(file);
      setNewMethod(m => ({ ...m, logo: url }));
    } catch {
      showToast('❌ فشل رفع الشعار', 'error');
    } finally {
      setUploadingLogo(false);
    }
  }

  function addMethod() {
    if (!newMethod.name.trim()) return;
    setPaymentMethods(ms => [...ms, { ...newMethod, _id: Date.now().toString() }]);
    setNewMethod(EMPTY_METHOD);
    setShowAddForm(false);
  }

  function deleteMethod(id) {
    setPaymentMethods(ms => ms.filter(m => (m._id || m.id) !== id));
  }

  function toggleMethod(id) {
    setPaymentMethods(ms => ms.map(m =>
      (m._id || m.id) === id ? { ...m, isVisible: !m.isVisible } : m
    ));
  }

  function addDiscount() {
    const code = newDiscount.code.trim().toUpperCase();
    const percent = Number(newDiscount.percent);
    if (!code || !percent || percent < 1 || percent > 100) return;
    setDiscountCodes(ds => [...ds, { code, percent, isActive: true, _id: Date.now().toString() }]);
    setNewDiscount(EMPTY_DISCOUNT);
    setShowAddDiscount(false);
  }

  function deleteDiscount(id) {
    setDiscountCodes(ds => ds.filter(d => (d._id || d.id) !== id));
  }

  function toggleDiscount(id) {
    setDiscountCodes(ds => ds.map(d =>
      (d._id || d.id) === id ? { ...d, isActive: !d.isActive } : d
    ));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminUpdateSettings({
        whatsappNumber: form.whatsapp,
        storeName: form.storeName,
        paymentMethods,
        discountCodes,
      });
      showToast('✅ تم حفظ الإعدادات بنجاح');
    } catch {
      showToast('❌ فشل الحفظ، حاولي مرة أخرى', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="admin-loading">جاري التحميل...</div>;

  return (
    <div className="settings-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">الإعدادات</h2>
          <p className="admin-page-sub">إعدادات عامة للمتجر</p>
        </div>
      </div>

      <form className="settings-card" onSubmit={handleSave}>

        {/* رقم الواتساب */}
        <div className="settings-field">
          <label className="settings-label">رقم الواتساب</label>
          <input
            className="admin-input-field"
            value={form.whatsapp}
            onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
            placeholder="970599123456"
            dir="ltr"
          />
          <p className="settings-hint">مثال: 970599123456 (بدون + أو مسافات)</p>
        </div>

        {/* اسم المتجر */}
        <div className="settings-field">
          <label className="settings-label">اسم المتجر</label>
          <input
            className="admin-input-field"
            value={form.storeName}
            onChange={e => setForm(f => ({ ...f, storeName: e.target.value }))}
            placeholder="يارا ستور"
          />
        </div>


        {/* ── طرق الدفع ── */}
        <div className="settings-field">
          <label className="settings-label">طرق الدفع</label>
          <p className="settings-hint">أضيفي طرق الدفع التي تريدين إظهارها للزبائن</p>

          {/* قائمة طرق الدفع */}
          {paymentMethods.length > 0 && (
            <div className="pm-list">
              {paymentMethods.map(method => {
                const id = method._id || method.id;
                return (
                  <div key={id} className={`pm-item ${!method.isVisible ? 'pm-hidden' : ''}`}>
                    <div className="pm-item-left">
                      {resolveLogoSrc(method.logo)
                        ? <img src={resolveLogoSrc(method.logo)} alt={method.name} className="pm-logo" />
                        : <div className="pm-logo-placeholder">💳</div>
                      }
                      <div className="pm-info">
                        <span className="pm-name">{method.name}</span>
                        {method.accountNumber && <span className="pm-detail">رقم: {method.accountNumber}</span>}
                        {method.iban && <span className="pm-detail">IBAN: {method.iban}</span>}
                        {method.accountHolderName && <span className="pm-detail">الاسم: {method.accountHolderName}</span>}
                      </div>
                    </div>
                    <div className="pm-item-actions">
                      <button
                        type="button"
                        className={`pm-toggle-btn ${method.isVisible ? 'visible' : 'hidden'}`}
                        onClick={() => toggleMethod(id)}
                        title={method.isVisible ? 'إخفاء' : 'إظهار'}
                      >
                        {method.isVisible ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        className="pm-delete-btn"
                        onClick={() => deleteMethod(id)}
                        title="حذف"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* نموذج إضافة طريقة دفع جديدة */}
          {showAddForm ? (
            <div className="pm-add-form">
              <h4 className="pm-add-title">إضافة طريقة دفع جديدة</h4>

              <div className="pm-add-field">
                <label>اسم الطريقة *</label>
                <input
                  className="admin-input-field"
                  value={newMethod.name}
                  onChange={e => setNewMethod(m => ({ ...m, name: e.target.value }))}
                  placeholder="مثال: بنك فلسطين"
                />
              </div>

              <div className="pm-add-field">
                <label>رقم الهاتف / الحساب</label>
                <input
                  className="admin-input-field"
                  dir="ltr"
                  value={newMethod.accountNumber}
                  onChange={e => setNewMethod(m => ({ ...m, accountNumber: e.target.value }))}
                  placeholder="05xxxxxxxx"
                />
              </div>

              <div className="pm-add-field">
                <label>الآيبان (IBAN)</label>
                <input
                  className="admin-input-field"
                  dir="ltr"
                  value={newMethod.iban}
                  onChange={e => setNewMethod(m => ({ ...m, iban: e.target.value }))}
                  placeholder="PS00XXXX..."
                />
              </div>

              <div className="pm-add-field">
                <label>اسم صاحب الحساب / المحفظة</label>
                <input
                  className="admin-input-field"
                  value={newMethod.accountHolderName}
                  onChange={e => setNewMethod(m => ({ ...m, accountHolderName: e.target.value }))}
                  placeholder="مثال: يارا حاتم جواد مهدي"
                />
                <p className="settings-hint">هذا الاسم يظهر للزبونة في بطاقة الدفع أثناء تأكيد الطلب</p>
              </div>

              <div className="pm-add-field">
                <label>شعار الطريقة</label>
                <div className="pm-preset-row">
                  {PRESET_LOGOS.map(p => (
                    <button
                      key={p.key}
                      type="button"
                      className={`pm-preset-btn ${newMethod.logo === p.key ? 'selected' : ''}`}
                      onClick={() => setNewMethod(m => ({ ...m, logo: p.key }))}
                      title={p.label}
                    >
                      <img src={p.src} alt={p.label} />
                    </button>
                  ))}
                  <label className={`pm-preset-upload ${newMethod.logo && !newMethod.logo.startsWith('preset:') ? 'selected' : ''}`} title="رفع شعار مخصص">
                    <input type="file" accept="image/*" onChange={handleLogoUpload} hidden />
                    {uploadingLogo ? '...' : '📸'}
                  </label>
                </div>
                {newMethod.logo && (
                  <div className="pm-logo-chosen">
                    <img src={resolveLogoSrc(newMethod.logo)} alt="preview" className="pm-logo-preview" />
                    <span>{PRESET_LOGOS.find(p => p.key === newMethod.logo)?.label || 'شعار مخصص'}</span>
                    <button type="button" className="pm-logo-clear" onClick={() => setNewMethod(m => ({ ...m, logo: '' }))}>✕</button>
                  </div>
                )}
              </div>

              <div className="pm-add-actions">
                <button
                  type="button"
                  className="pm-cancel-btn"
                  onClick={() => { setShowAddForm(false); setNewMethod(EMPTY_METHOD); }}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  className="pm-confirm-add-btn"
                  disabled={!newMethod.name.trim()}
                  onClick={addMethod}
                >
                  إضافة
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="pm-add-btn"
              onClick={() => setShowAddForm(true)}
            >
              + إضافة طريقة دفع
            </button>
          )}
        </div>

        {/* ── أكواد الخصم ── */}
        <div className="settings-field">
          <label className="settings-label">أكواد الخصم</label>
          <p className="settings-hint">أنشئي كود خصم بنسبة مئوية عن كامل الطلب — تقدري تفعّليه أو تعطّليه بأي وقت</p>

          {discountCodes.length > 0 && (
            <div className="pm-list">
              {discountCodes.map(d => {
                const id = d._id || d.id;
                return (
                  <div key={id} className={`pm-item ${!d.isActive ? 'pm-hidden' : ''}`}>
                    <div className="pm-item-left">
                      <div className="pm-logo-placeholder">🏷️</div>
                      <div className="pm-info">
                        <span className="pm-name" dir="ltr">{d.code}</span>
                        <span className="pm-detail">خصم {d.percent}%</span>
                      </div>
                    </div>
                    <div className="pm-item-actions">
                      <button
                        type="button"
                        className={`pm-toggle-btn ${d.isActive ? 'visible' : 'hidden'}`}
                        onClick={() => toggleDiscount(id)}
                        title={d.isActive ? 'تعطيل' : 'تفعيل'}
                      >
                        {d.isActive ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        className="pm-delete-btn"
                        onClick={() => deleteDiscount(id)}
                        title="حذف"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showAddDiscount ? (
            <div className="pm-add-form">
              <h4 className="pm-add-title">إضافة كود خصم جديد</h4>

              <div className="pm-add-field">
                <label>الكود *</label>
                <input
                  className="admin-input-field"
                  dir="ltr"
                  value={newDiscount.code}
                  onChange={e => setNewDiscount(d => ({ ...d, code: e.target.value }))}
                  placeholder="مثال: Yar22"
                />
              </div>

              <div className="pm-add-field">
                <label>نسبة الخصم (%) *</label>
                <input
                  className="admin-input-field"
                  type="number"
                  min="1"
                  max="100"
                  dir="ltr"
                  value={newDiscount.percent}
                  onChange={e => setNewDiscount(d => ({ ...d, percent: e.target.value }))}
                  placeholder="30"
                />
              </div>

              <div className="pm-add-actions">
                <button
                  type="button"
                  className="pm-cancel-btn"
                  onClick={() => { setShowAddDiscount(false); setNewDiscount(EMPTY_DISCOUNT); }}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  className="pm-confirm-add-btn"
                  disabled={!newDiscount.code.trim() || !newDiscount.percent}
                  onClick={addDiscount}
                >
                  إضافة
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="pm-add-btn"
              onClick={() => setShowAddDiscount(true)}
            >
              + إضافة كود خصم
            </button>
          )}
        </div>

        {/* زر الحفظ */}
        <button type="submit" className="settings-save-btn" disabled={saving}>
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>

      </form>
    </div>
  );
}
