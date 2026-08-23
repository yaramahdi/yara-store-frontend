import { useEffect, useState, useCallback } from 'react';
import {
  adminGetAnnouncements, adminCreateAnnouncement,
  adminToggleAnnouncement, adminDeleteAnnouncement
} from '../../../services/adminApi';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import './Announcements.css';

export default function Announcements() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [text, setText]         = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast]       = useState(null);

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGetAnnouncements();
      setItems(res.data || []);
    } catch {
      showToast('❌ فشل تحميل الإعلانات', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    if (!text.trim()) { showToast('❌ النص مطلوب', 'error'); return; }
    setSaving(true);
    try {
      // الإعلان يُضاف مخفياً بالأساس
      const res = await adminCreateAnnouncement({ text: text.trim(), textAr: text.trim(), isActive: false });
      const created = res.data?.announcement || res.data || { _id: Date.now().toString(), textAr: text.trim(), text: text.trim(), isActive: false };
      setItems(prev => [created, ...prev]);
      showToast('✅ تمت إضافة الإعلان بنجاح');
      setText('');
      setShowForm(false);
    } catch {
      showToast('❌ حدث خطأ، حاولي مرة أخرى', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id) {
    try {
      const res = await adminToggleAnnouncement(id);
      const updated = res.data?.announcement || res.data || null;
      setItems(prev => prev.map(item => {
        if (item._id !== id) return item;
        return updated ? { ...item, ...updated } : { ...item, isActive: !item.isActive };
      }));
    } catch {
      showToast('❌ حدث خطأ', 'error');
    }
  }

  async function handleDelete() {
    try {
      await adminDeleteAnnouncement(deleteId);
      setItems(prev => prev.filter(item => item._id !== deleteId));
      showToast('🗑️ تم الحذف');
      setDeleteId(null);
    } catch {
      showToast('❌ فشل الحذف', 'error');
    }
  }

  return (
    <div className="announcements-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">الإعلانات</h2>
          <p className="admin-page-sub">{items.length} إعلان</p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={() => { setText(''); setShowForm(true); }}>
          + إضافة إعلان
        </button>
      </div>

      {loading ? (
        <div className="admin-loading">جاري التحميل...</div>
      ) : (
        <div className="ann-list">
          {items.map(item => (
            <div key={item._id} className={`ann-card ${item.isActive ? 'ann-card--active' : ''}`}>
              <p className="ann-card__text">{item.textAr || item.text}</p>
              <div className="ann-card__actions">
                <div className="ann-toggle-wrap">
                  <button
                    className={`ann-toggle ${item.isActive ? 'ann-toggle--on' : 'ann-toggle--off'}`}
                    onClick={() => handleToggle(item._id)}
                  />
                  <span className="ann-toggle-label">
                    {item.isActive ? 'نشط' : 'مخفي'}
                  </span>
                </div>
                <button
                  className="admin-btn admin-btn--sm admin-btn--delete"
                  onClick={() => setDeleteId(item._id)}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="ann-empty">لا توجد إعلانات</div>
          )}
        </div>
      )}

      {showForm && (
        <Modal
          title="إضافة إعلان جديد"
          onClose={() => setShowForm(false)}
          onConfirm={handleAdd}
          confirmLabel={saving ? 'جاري الحفظ...' : 'إضافة'}
          confirmDisabled={saving}
        >
          <div className="simple-form">
            <div className="form-field">
              <label>نص الإعلان <span className="req">*</span></label>
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="مثال: 🎉 خصم 20% على جميع الطلبات اليوم!"
                autoFocus
              />
              <p className="field-hint">سيُضاف الإعلان مخفياً — فعّليه يدوياً من القائمة</p>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal
          title="حذف الإعلان"
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          confirmLabel="حذف"
          danger
        >
          <p>هل أنتِ متأكدة من حذف هذا الإعلان؟</p>
        </Modal>
      )}
    </div>
  );
}
