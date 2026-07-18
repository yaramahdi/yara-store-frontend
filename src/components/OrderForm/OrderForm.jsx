import { useState, useEffect } from 'react';
import { getSettings, createOrder, formatWhatsappPhone } from '../../services/api';
import { resolveLogoSrc, resolveCardTheme } from '../../utils/paymentPresets';
import './OrderForm.css';

export default function OrderForm({
  isOpen,
  onClose,
  cartItems,
  totalPrice,
  whatsappNumber,
  onOrderComplete,
  onStockConflict,
}) {
  const [step, setStep] = useState(1);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentLoadError, setPaymentLoadError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [copied, setCopied] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  const loadPaymentMethods = async () => {
    setPaymentLoading(true);
    setPaymentLoadError('');

    try {
      const res = await getSettings();
      const methods = (res.data.paymentMethods || []).filter(m => m.isVisible !== false);
      setPaymentMethods(methods);
    } catch {
      setPaymentMethods([]);
      setPaymentLoadError('تعذر تحميل طرق الدفع بسبب ضعف الشبكة.');
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setSubmitting(false);
    setSubmitError('');
    setRedirecting(false);
    setSelectedPayment(null);
    setForm({ name: '', phone: '', address: '' });
    loadPaymentMethods();
  }, [isOpen]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    }).catch(() => {});
  };

  const phoneValid = /^\d{10}$/.test(form.phone);

  const handleConfirm = async () => {
    if (submitting) return;

    setSubmitError('');
    setSubmitting(true);

    const ic = String.fromCodePoint;

    const lines = cartItems.map(item => {
      const parts = [`- ${item.name}`];
      if (item.selectedColor?.name) parts.push(`اللون: ${item.selectedColor.name}`);
      if (item.selectedSize) parts.push(`المقاس: ${item.selectedSize}`);
      parts.push(`الكمية: ${item.quantity}`);
      parts.push(`${item.price * item.quantity} شيكل`);
      return parts.join(' | ');
    });

    let msg = `مرحبا، اريد تاكيد الطلب التالي:\n\n`;
    msg += `${ic(0x1F464)} الاسم: ${form.name}\n`;
    msg += `${ic(0x1F4DE)} الهاتف: ${form.phone}\n`;
    msg += `${ic(0x1F4CD)} العنوان: ${form.address}\n\n`;
    msg += `المنتجات:\n${lines.join('\n')}\n\n`;
    msg += `المجموع الكلي: ${totalPrice} شيكل`;

    if (selectedPayment) {
      msg += `\n\n${ic(0x1F4B3)} طريقة الدفع: ${selectedPayment.name}`;
    }

    try {
      await createOrder({
        customer: form,
        items: cartItems.map(item => ({
          productId:     item._id || '',
          name:          item.name,
          price:         item.price,
          quantity:      item.quantity,
          selectedColor: item.selectedColor || {},
          selectedSize:  item.selectedSize  || '',
          images:        item.images        || [],
        })),
        totalPrice,
        paymentMethod: selectedPayment
          ? {
              name: selectedPayment.name,
              accountNumber: selectedPayment.accountNumber,
              iban: selectedPayment.iban,
              accountHolderName: selectedPayment.accountHolderName || '',
            }
          : {},
      });
    } catch (error) {
      const apiMessage = error?.response?.data?.message;
      const apiCode = error?.response?.data?.code;
      if (apiCode === 'OUT_OF_STOCK') {
        await onStockConflict?.();
      }
      setSubmitError(apiMessage || 'تعذر إتمام الطلب حالياً. الرجاء المحاولة مرة أخرى.');
      setSubmitting(false);
      return;
    }

    const num = formatWhatsappPhone(whatsappNumber);
    const url = num
      ? `https://api.whatsapp.com/send/?phone=${num}&text=${encodeURIComponent(msg)}&type=phone_number&app_absent=0`
      : `https://api.whatsapp.com/send/?text=${encodeURIComponent(msg)}&app_absent=0`;

    // إعلام الزبونة أن الطلب تم واننا سنحوّلها لواتساب قبل التحويل الفعلي
    setSubmitting(false);
    setRedirecting(true);
    onOrderComplete?.();

    setTimeout(() => {
      window.location.href = url;
    }, 1500);
  };

  const step1Valid = form.name.trim() && phoneValid && form.address.trim();

  if (!isOpen) return null;

  return (
    <div className="of-overlay" onClick={onClose}>
      <div className="of-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="of-header">
          <h2 className="of-title">
            {step === 1 ? 'بيانات الطلب' : 'طريقة الدفع'}
          </h2>
          <button className="of-close" onClick={onClose}>✕</button>
        </div>

        {/* Step indicator */}
        <div className="of-steps">
          <div className={`of-step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className="of-step-line" />
          <div className={`of-step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className="of-step-line" />
          <div className={`of-step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        {/* ── Step 1: Customer Info ── */}
        {step === 1 && (
          <div className="of-body">
            <div className="of-field">
              <label className="of-label">الاسم الكامل *</label>
              <input
                className="of-input"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="أدخلي اسمك الكامل"
              />
            </div>
            <div className="of-field">
              <label className="of-label">رقم الهاتف *</label>
              <input
                className="of-input"
                dir="ltr"
                value={form.phone}
                onChange={e => {
                  const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setForm(f => ({ ...f, phone: digitsOnly }));
                }}
                placeholder="05xxxxxxxx"
                type="tel"
                inputMode="numeric"
                maxLength={10}
              />
              {form.phone.length > 0 && !phoneValid && (
                <p className="of-field-error">رقم الهاتف يجب أن يكون 10 أرقام</p>
              )}
            </div>
            <div className="of-field">
              <label className="of-label">العنوان *</label>
              <input
                className="of-input"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="المدينة، الحي، الشارع"
              />
            </div>
            <button
              className="of-next-btn"
              disabled={!step1Valid}
              onClick={() => setStep(2)}
            >
              التالي
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Step 2: Invoice ── */}
        {step === 2 && (
          <div className="of-body">
            <p className="of-title-sm">الفاتورة</p>

            {/* Header */}
            <div className="of-invoice-header">
              <div className="of-invoice-brand">يارا <span>ستور</span></div>
              <div className="of-invoice-meta">
                <div>التاريخ: {new Date().toLocaleDateString('ar-PS')}</div>
              </div>
            </div>

            {/* Customer info */}
            <div className="of-invoice-customer">
              <p>{form.name} • {form.phone} • {form.address}</p>
            </div>

            {/* Products table */}
            <table className="of-invoice-table">
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>الكمية</th>
                  <th>السعر</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map(item => (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td style={{textAlign:'center'}}>{item.quantity}</td>
                    <td style={{textAlign:'left'}}>{item.price * item.quantity} ₪</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total */}
            <div className="of-invoice-total">
              <strong>الإجمالي: {totalPrice} ₪</strong>
            </div>

            {/* Actions */}
            <div className="of-actions">
              <button className="of-back-btn" onClick={() => setStep(1)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                رجوع
              </button>
              <button className="of-next-btn" onClick={() => setStep(3)}>
                التالي
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Payment ── */}
        {step === 3 && redirecting && (
          <div className="of-body">
            <div className="of-redirect-notice">
              <div className="of-redirect-spinner" />
              <p className="of-redirect-title">تم استلام طلبك ✓</p>
              <p className="of-redirect-text">سيتم تحويلك الآن إلى واتساب لتأكيد الطلب...</p>
            </div>
          </div>
        )}

        {step === 3 && !redirecting && (
          <div className="of-body">
            <p className="of-title-sm">بيانات الدفع</p>
            <p className="of-subtitle-sm">اختاري طريقة الدفع المناسبة:</p>

            {paymentLoading ? (
              <p className="of-no-payment">جاري تحميل طرق الدفع...</p>
            ) : paymentLoadError ? (
              <div className="of-retry-wrap">
                <p className="of-no-payment of-no-payment--error">{paymentLoadError}</p>
                <button
                  type="button"
                  className="of-retry-btn"
                  onClick={loadPaymentMethods}
                  disabled={paymentLoading}
                >
                  إعادة التحميل
                </button>
              </div>
            ) : paymentMethods.length === 0 ? (
              <p className="of-no-payment">لا توجد طرق دفع متاحة حالياً</p>
            ) : (
              paymentMethods.map(method => {
                const theme = resolveCardTheme(method.logo);
                const accountLabel = method.iban ? 'رقم الحساب:' : 'الرقم:';
                const holderLabel = method.iban ? 'اسم الحساب:' : 'اسم المحفظة:';

                return (
                  <div
                    key={method._id}
                    className={`of-payment-card of-payment-card--${theme} ${selectedPayment?._id === method._id ? 'selected' : ''}`}
                    onClick={() => setSelectedPayment(method)}
                  >
                    <div className="of-payment-top">
                      {resolveLogoSrc(method.logo) && (
                        <img src={resolveLogoSrc(method.logo)} alt={method.name} className="of-payment-logo" />
                      )}
                      <span className="of-payment-name">{method.name}</span>
                      <div className={`of-radio ${selectedPayment?._id === method._id ? 'checked' : ''}`} />
                    </div>

                    {method.accountNumber && (
                      <div className="of-payment-row">
                        <span className="of-payment-row-label">{accountLabel}</span>
                        <div className="of-payment-row-val">
                          <span dir="ltr">{method.accountNumber}</span>
                          <button
                            className={`of-copy-btn ${copied === `acc-${method._id}` ? 'copied' : ''}`}
                            onClick={e => { e.stopPropagation(); handleCopy(method.accountNumber, `acc-${method._id}`); }}
                          >
                            {copied === `acc-${method._id}` ? '✓ تم' : 'نسخ'}
                          </button>
                        </div>
                      </div>
                    )}

                    {method.iban && (
                      <div className="of-payment-row">
                        <span className="of-payment-row-label">IBAN:</span>
                        <div className="of-payment-row-val">
                          <span dir="ltr" className="of-iban-text">{method.iban}</span>
                          <button
                            className={`of-copy-btn ${copied === `iban-${method._id}` ? 'copied' : ''}`}
                            onClick={e => { e.stopPropagation(); handleCopy(method.iban, `iban-${method._id}`); }}
                          >
                            {copied === `iban-${method._id}` ? '✓ تم' : 'نسخ'}
                          </button>
                        </div>
                      </div>
                    )}

                    {method.accountHolderName && (
                      <div className="of-payment-row">
                        <span className="of-payment-row-label">{holderLabel}</span>
                        <div className="of-payment-row-val">
                          <span>{method.accountHolderName}</span>
                          <button
                            className={`of-copy-btn ${copied === `holder-${method._id}` ? 'copied' : ''}`}
                            onClick={e => { e.stopPropagation(); handleCopy(method.accountHolderName, `holder-${method._id}`); }}
                          >
                            {copied === `holder-${method._id}` ? '✓ تم' : 'نسخ'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <div className="of-actions">
              {submitError && <p className="of-submit-error">{submitError}</p>}
              <button className="of-back-btn" onClick={() => setStep(2)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                رجوع
              </button>
              <button className="of-confirm-btn" onClick={handleConfirm} disabled={submitting}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
                {submitting ? 'جارٍ تأكيد الطلب...' : 'تأكيد الطلب'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
