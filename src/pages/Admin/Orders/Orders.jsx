import { useEffect, useState } from 'react';
import { adminGetOrders, adminConfirmOrder, adminDeleteOrder } from '../../../services/adminApi';
import { imgUrl } from '../../../services/api';
import Toast from '../components/Toast';
import './Orders.css';

/* ── Status badge ── */
const STATUS = {
  pending:   { label: 'قيد الانتظار', cls: 'status--pending'   },
  confirmed: { label: 'مؤكد',         cls: 'status--confirmed' },
  cancelled: { label: 'ملغي',         cls: 'status--cancelled' },
};

/* ── Invoice Modal ── */
function InvoiceModal({ order, onClose, onConfirm, onDelete }) {
  if (!order) return null;

  const st = STATUS[order.status] || STATUS.pending;
  const invoiceDate = new Date(order.createdAt).toLocaleDateString('ar-PS');

  return (
    <div className="inv-overlay" onClick={onClose}>
      <div className="inv-modal" onClick={e => e.stopPropagation()}>

        <div className="inv-header">
          <div className="inv-header-info">
            <span className="inv-order-num">{order.orderNumber}</span>
            <span className={`order-status-badge ${st.cls}`}>{st.label}</span>
          </div>
          <button className="inv-close" onClick={onClose}>✕</button>
        </div>

        <div className="inv-body">
          <div className="inv-summary-grid inv-summary-grid--compact">
            <div className="inv-summary-card inv-summary-card--compact">
              <div className="inv-mini-row">
                <span>الزبون</span>
                <strong>{order.customer?.name}</strong>
              </div>
              <div className="inv-mini-row">
                <span>الهاتف</span>
                <strong dir="ltr">{order.customer?.phone || '—'}</strong>
              </div>
            </div>
            <div className="inv-summary-card inv-summary-card--compact">
              <div className="inv-mini-row">
                <span>التاريخ</span>
                <strong>{invoiceDate}</strong>
              </div>
              <div className="inv-mini-row">
                <span>الدفع</span>
                <strong>{order.paymentMethod?.name || 'بدون طريقة دفع محددة'}</strong>
              </div>
            </div>
          </div>

          <section className="inv-section inv-section--condensed">
            <div className="inv-delivery-card inv-delivery-card--compact">
              <div className="inv-mini-row">
                <span>العنوان</span>
                <strong>{order.customer?.address || '—'}</strong>
              </div>
            </div>
          </section>

          <section className="inv-section inv-section--condensed">
            <h3 className="inv-section-title">المنتجات</h3>
            <div className="inv-items">
              {order.items?.map((item, i) => (
                <div key={i} className="inv-item">
                  <div className="inv-item-img">
                    {item.images?.[0]
                      ? <img src={imgUrl(item.images[0])} alt={item.name} />
                      : <div className="inv-img-placeholder" />
                    }
                  </div>
                  <div className="inv-item-info">
                    <p className="inv-item-name">{item.name}</p>
                    <div className="inv-item-meta">
                      {item.selectedColor?.name && <span>اللون: {item.selectedColor.name}</span>}
                      {item.selectedSize         && <span>المقاس: {item.selectedSize}</span>}
                      <span>الكمية: {item.quantity}</span>
                      {order.status === 'confirmed' && <span>سعر البيع: ₪{Number(item.salePrice ?? item.price ?? 0)}</span>}
                      {order.status === 'confirmed' && <span>السعر الخام: ₪{Number(item.rawCost ?? 0)}</span>}
                      {order.status === 'confirmed' && <span className="meta-profit">ربح: ₪{Number(item.profit ?? 0).toFixed(2)}</span>}
                    </div>
                  </div>
                  <div className="inv-item-price">
                    ₪{(
                      Number(order.status === 'confirmed' ? (item.salePrice ?? item.price) : item.price || 0) *
                      Number(item.quantity || 1)
                    ).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="inv-total-row">
            <span>المجموع الكلي</span>
            <strong>₪{order.totalPrice}</strong>
          </div>
          {order.status === 'confirmed' && (
            <div className="inv-profit-row">
              <span>إجمالي الربح</span>
              <strong>₪{Number(order.confirmedProfit || 0).toFixed(2)}</strong>
            </div>
          )}
        </div>

        <div className="inv-footer">
          {order.status !== 'confirmed' && (
            <button className="inv-btn inv-btn--confirm" onClick={() => onConfirm(order._id)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              تأكيد الطلب
            </button>
          )}
          <button className="inv-btn inv-btn--delete" onClick={() => onDelete(order._id)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
            حذف الطلب
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmOrderModal({ order, onClose, onSubmit, submitting }) {
  const [mode, setMode] = useState('catalog');
  const [customSalePrices, setCustomSalePrices] = useState([]);
  const orderId = order?._id;

  useEffect(() => {
    if (!order) return;
    setMode('catalog');
    setCustomSalePrices(Array.from({ length: order.items?.length || 0 }, () => ''));
  }, [orderId]);

  if (!order) return null;

  const items = order.items || [];
  const customValid = customSalePrices.length === items.length
    && customSalePrices.every((price) => price !== '' && Number(price) >= 0);
  const disabled = submitting || (mode === 'custom' && !customValid);

  function updateCustomPrice(index, value) {
    setCustomSalePrices(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  return (
    <div className="inv-overlay" onClick={() => !submitting && onClose()}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>تأكيد الطلب</h3>
        <p>اختاري طريقة البيع عند تأكيد الطلب:</p>

        <label className="confirm-option">
          <input
            type="radio"
            name="confirm-price-mode"
            checked={mode === 'catalog'}
            onChange={() => setMode('catalog')}
          />
          <span>بيع بالسعر المحدد في الطلب</span>
        </label>

        <label className="confirm-option">
          <input
            type="radio"
            name="confirm-price-mode"
            checked={mode === 'custom'}
            onChange={() => setMode('custom')}
          />
          <span>سعر آخر (لكل قطعة)</span>
        </label>

        {mode === 'custom' && (
          <div className="confirm-items-list">
            {items.map((item, index) => (
              <div key={`${item.productId || index}-${index}`} className="confirm-item-row">
                <div className="confirm-item-row__head">
                  <strong className="confirm-item-row__name">{item.name}</strong>
                  <span className="confirm-item-row__meta">
                    الكمية: {item.quantity || 1}
                    {item.selectedSize ? ` • المقاس: ${item.selectedSize}` : ''}
                  </span>
                </div>
                <div className="confirm-item-row__price">
                  <span>سعر البيع لهذا القطعة</span>
                  <input
                    type="number"
                    min="0"
                    value={customSalePrices[index] ?? ''}
                    onChange={(e) => updateCustomPrice(index, e.target.value)}
                    placeholder="مثال: 120"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="confirm-modal-actions">
          <button className="inv-btn inv-btn--delete" onClick={onClose} disabled={submitting}>إلغاء</button>
          <button
            className="inv-btn inv-btn--confirm"
            disabled={disabled}
            onClick={() => onSubmit({
              priceMode: mode,
              ...(mode === 'custom' ? { customSalePrices: customSalePrices.map(Number) } : {}),
            })}
          >
            {submitting ? 'جاري التأكيد...' : 'تأكيد'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Orders Page ── */
export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOrders(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await adminGetOrders();
      setOrders(res.data || []);
    } catch {
      if (!silent) showToast('❌ فشل تحميل الطلبات', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function handleConfirm(id, payload = {}) {
    if (confirming) return;
    setConfirming(true);
    try {
      const res = await adminConfirmOrder(id, payload);
      setOrders(o => o.map(x => x._id === id ? res.data : x));
      setSelected(res.data);
      setConfirmTarget(null);
      showToast('✅ تم تأكيد الطلب');
    } catch (err) {
      const msg = err?.response?.data?.message || '❌ فشل التأكيد';
      showToast(msg, 'error');
    } finally {
      setConfirming(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    try {
      await adminDeleteOrder(id);
      setOrders(o => o.filter(x => x._id !== id));
      setSelected(null);
      showToast('✅ تم حذف الطلب');
    } catch {
      showToast('❌ فشل الحذف', 'error');
    }
  }

  return (
    <div className="orders-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <InvoiceModal
        order={selected}
        onClose={() => setSelected(null)}
        onConfirm={(id) => setConfirmTarget(id)}
        onDelete={handleDelete}
      />

      <ConfirmOrderModal
        order={confirmTarget ? orders.find(o => o._id === confirmTarget) : null}
        onClose={() => setConfirmTarget(null)}
        onSubmit={(payload) => handleConfirm(confirmTarget, payload)}
        submitting={confirming}
      />

      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">الطلبات</h2>
          <p className="admin-page-sub">{orders.length} طلب مسجل</p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={fetchOrders}>تحديث</button>
      </div>

      {loading ? (
        <div className="admin-loading">جاري التحميل...</div>
      ) : orders.length === 0 ? (
        <div className="orders-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <p>لا توجد طلبات بعد</p>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap orders-table-desktop">
            <table className="admin-table orders-table">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>المنتجات</th>
                  <th>الزبون</th>
                  <th>الموقع</th>
                  <th>السعر الكلي</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const st = STATUS[order.status] || STATUS.pending;
                  return (
                    <tr key={order._id}>
                      <td>
                        <span className="order-num">{order.orderNumber}</span>
                        <span className="order-date">{new Date(order.createdAt).toLocaleDateString('ar-PS')}</span>
                      </td>

                      <td>
                        <div className="order-items-preview">
                          <div className="order-imgs">
                            {order.items?.slice(0, 3).map((item, i) => (
                              item.images?.[0]
                                ? <img key={i} src={imgUrl(item.images[0])} alt={item.name} className="order-thumb" />
                                : <div key={i} className="order-thumb order-thumb--empty" />
                            ))}
                            {(order.items?.length || 0) > 3 && (
                              <span className="order-more">+{order.items.length - 3}</span>
                            )}
                          </div>
                          <div className="order-names">
                            {order.items?.slice(0, 2).map((item, i) => (
                              <span key={i} className="order-item-name">{item.name}</span>
                            ))}
                            {(order.items?.length || 0) > 2 && (
                              <span className="order-item-name order-item-name--more">
                                و{order.items.length - 2} منتج آخر
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="order-customer-name">{order.customer?.name}</span>
                        <span className="order-customer-phone" dir="ltr">{order.customer?.phone}</span>
                      </td>

                      <td className="order-address">{order.customer?.address || '—'}</td>

                      <td><span className="order-price">₪{order.totalPrice}</span></td>

                      <td><span className={`order-status-badge ${st.cls}`}>{st.label}</span></td>

                      <td>
                        <div className="actions-cell">
                          <button
                            className="admin-btn admin-btn--edit admin-btn--sm"
                            onClick={() => setSelected(order)}
                          >
                            عرض الفاتورة
                          </button>
                          <button
                            className="admin-btn admin-btn--delete admin-btn--sm"
                            onClick={() => handleDelete(order._id)}
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="orders-cards-mobile">
            {orders.map(order => {
              const st = STATUS[order.status] || STATUS.pending;

              return (
                <article key={order._id} className="order-mobile-card">
                  <div className="order-mobile-card__header">
                    <div className="order-mobile-card__headings">
                      <span className="order-mobile-card__num">{order.orderNumber}</span>
                      <span className="order-mobile-card__customer">{order.customer?.name || '—'}</span>
                    </div>
                    <span className={`order-status-badge ${st.cls}`}>{st.label}</span>
                  </div>

                  <div className="order-mobile-card__summary">
                    <div className="order-mobile-card__thumb-wrap">
                      {order.items?.[0]?.images?.[0]
                        ? <img src={imgUrl(order.items[0].images[0])} alt={order.items[0].name} className="order-mobile-card__thumb" />
                        : <div className="order-mobile-card__thumb order-mobile-card__thumb--empty" />
                      }
                    </div>

                    <div className="order-mobile-card__summary-body">
                      <div className="order-mobile-card__mini-line">
                        <span>الهاتف</span>
                        <strong dir="ltr">{order.customer?.phone || '—'}</strong>
                      </div>
                      <div className="order-mobile-card__mini-line">
                        <span>المنتجات</span>
                        <strong>{order.items?.length || 0} قطعة</strong>
                      </div>
                    </div>
                  </div>

                  <div className="order-mobile-card__actions">
                    <button
                      className="admin-btn admin-btn--edit admin-btn--sm"
                      onClick={() => setSelected(order)}
                    >
                      عرض الفاتورة
                    </button>
                    {order.status !== 'confirmed' ? (
                      <button
                        className="admin-btn admin-btn--primary admin-btn--sm"
                        onClick={() => setConfirmTarget(order._id)}
                      >
                        تأكيد الطلب
                      </button>
                    ) : (
                      <button className="admin-btn admin-btn--sm order-mobile-card__done" disabled>
                        مؤكد
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
