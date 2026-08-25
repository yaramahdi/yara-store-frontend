import './FeaturesBar.css';

export default function FeaturesBar() {
  return (
    <div className="features-bar">

      <div className="feature-item">
        <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="1"/>
          <path d="M16 8h4l3 5v4h-7V8z"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
        <div className="feature-text">
          <strong>توصيل سريع</strong>
          <span>جميع المحافظات</span>
        </div>
      </div>

      <div className="feature-item">
        <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
        <div className="feature-text">
          <strong>دفع آمن</strong>
          <span>بنك إسلامي &amp; محفظة</span>
        </div>
      </div>

      <div className="feature-item return-policy-item">
        <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 0 1 15.3-6.3L21 7.5V3h-4.5l1.8 1.8A11 11 0 1 0 23 12"/>
          <path d="M12 7v5l3 2"/>
        </svg>
        <div className="feature-text">
          <strong>سياسة الإرجاع</strong>
          <span>يمكن قياس القطعة قبل الدفع</span>
        </div>
      </div>


    </div>
  );
}
