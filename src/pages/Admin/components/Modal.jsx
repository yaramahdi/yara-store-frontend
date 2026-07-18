import './Modal.css';

export default function Modal({
  title, children, onClose, onConfirm,
  confirmLabel = 'تأكيد', danger = false,
  wide = false, confirmDisabled = false
}) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal${wide ? ' modal--wide' : ''}`}>

        <div className="modal__header">
          <h3 className="modal__title">{title}</h3>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>

        <div className="modal__body">{children}</div>

        {onConfirm && (
          <div className="modal__footer">
            <button className="modal__btn modal__btn--cancel" onClick={onClose}>إلغاء</button>
            <button
              className={`modal__btn ${danger ? 'modal__btn--danger' : 'modal__btn--confirm'}`}
              onClick={onConfirm}
              disabled={confirmDisabled}
            >
              {confirmLabel}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
