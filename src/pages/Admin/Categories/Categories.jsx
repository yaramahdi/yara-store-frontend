import { useEffect, useState, useCallback } from 'react';
import {
  adminGetCategories, adminCreateCategory,
  adminUpdateCategory, adminDeleteCategory, uploadProductImage
} from '../../../services/adminApi';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import './Categories.css';

const IMG_BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

const EMPTY = { name: '', image: '', isVisible: true };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [form, setForm]             = useState(EMPTY);
  const [editId, setEditId]         = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [deleteId, setDeleteId]     = useState(null);
  const [toast, setToast]           = useState(null);
  const [uploading, setUploading]   = useState(false);

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGetCategories();
      setCategories(res.data || []);
    } catch {
      showToast('❌ فشل تحميل الفئات', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setForm(EMPTY); setEditId(null); setShowForm(true); }

  function openEdit(c) {
    setForm({ name: c.name || '', image: c.image || '', isVisible: c.isVisible ?? true });
    setEditId(c._id);
    setShowForm(true);
  }

  async function handleToggleVisibility(c) {
    try {
      await adminUpdateCategory(c._id, { isVisible: !c.isVisible });
      load();
    } catch {
      showToast('❌ حدث خطأ', 'error');
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      setForm(f => ({ ...f, image: url }));
    } catch {
      showToast('❌ فشل رفع الصورة', 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!form.name) { showToast('❌ اسم الفئة مطلوب', 'error'); return; }
    try {
      if (editId) {
        await adminUpdateCategory(editId, form);
        showToast('✅ تم تحديث الفئة');
      } else {
        await adminCreateCategory(form);
        showToast('✅ تمت إضافة الفئة بنجاح');
      }
      setShowForm(false);
      load();
    } catch {
      showToast('❌ حدث خطأ، حاولي مرة أخرى', 'error');
    }
  }

  async function handleDelete() {
    try {
      await adminDeleteCategory(deleteId);
      showToast('🗑️ تم الحذف');
      setDeleteId(null);
      load();
    } catch (err) {
      showToast(err?.response?.data?.message || '❌ فشل الحذف', 'error');
    }
  }

  return (
    <div className="categories-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">الفئات</h2>
          <p className="admin-page-sub">{categories.length} فئة</p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={openCreate}>+ إضافة فئة</button>
      </div>

      {loading ? (
        <div className="admin-loading">جاري التحميل...</div>
      ) : (
        <div className="cat-table-wrap">
          <table className="cat-table">
            <thead>
              <tr>
                <th>#</th>
                <th>الصورة</th>
                <th>اسم الفئة</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={c._id} className="cat-row">
                  <td className="cat-row__num">{i + 1}</td>
                  <td>
                    {c.image ? (
                      <img
                        src={c.image.startsWith('http') ? c.image : `${IMG_BASE}${c.image}`}
                        alt={c.name}
                        className="cat-thumb"
                      />
                    ) : (
                      <div className="cat-thumb cat-thumb--empty">📁</div>
                    )}
                  </td>
                  <td className="cat-row__name">{c.name}</td>
                  <td>
                    <button
                      className={`visibility-toggle ${c.isVisible ? 'visible' : 'hidden'}`}
                      onClick={() => handleToggleVisibility(c)}
                      title={c.isVisible ? 'ظاهرة في الصفحة الرئيسية' : 'مخفية عن الصفحة الرئيسية'}
                    />
                  </td>
                  <td>
                    <div className="cat-row__actions">
                      <button className="admin-btn admin-btn--sm admin-btn--edit" onClick={() => openEdit(c)}>تعديل</button>
                      <button className="admin-btn admin-btn--sm admin-btn--delete" onClick={() => setDeleteId(c._id)}>حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="cat-table__empty">لا توجد فئات</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal
          title={editId ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
          onClose={() => setShowForm(false)}
          onConfirm={handleSave}
          confirmLabel={editId ? 'حفظ' : 'إضافة'}
        >
          <div className="simple-form">
            <div className="form-field">
              <label>اسم الفئة <span className="req">*</span></label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="مثال: فساتين"
              />
            </div>
            <div className="form-field form-field--row">
              <label>إظهار في الصفحة الرئيسية</label>
              <button
                type="button"
                className={`visibility-toggle-big ${form.isVisible ? 'visible' : 'hidden'}`}
                onClick={() => setForm(f => ({ ...f, isVisible: !f.isVisible }))}
              />
            </div>
            <div className="form-field">
              <label>الصورة <span className="req">*</span></label>
              <p className="field-hint">هذه الصورة تظهر في الدائرة على الموقع</p>
              <div className="image-upload-area">
                {form.image && (
                  <img
                    src={form.image.startsWith('http') ? form.image : `${IMG_BASE}${form.image}`}
                    alt=""
                    className="image-preview"
                  />
                )}
                <label className="image-upload-btn">
                  {uploading ? 'جاري الرفع...' : 'اختري صورة'}
                  <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                </label>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal
          title="حذف الفئة"
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          confirmLabel="حذف"
          danger
        >
          <p>هل أنتِ متأكدة من حذف هذه الفئة؟</p>
        </Modal>
      )}
    </div>
  );
}
