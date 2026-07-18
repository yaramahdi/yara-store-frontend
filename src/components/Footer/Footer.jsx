import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSettings, formatWhatsappPhone } from '../../services/api';
import './Footer.css';

export default function Footer() {
  const [whatsapp, setWhatsapp] = useState('');

  useEffect(() => {
    getSettings()
      .then(res => setWhatsapp(res.data?.whatsappNumber || ''))
      .catch(() => {});
  }, []);

  return (
    <footer className="footer" id="footer">
      <div className="footer-top">

        {/* ── العمود الأيمن: الهوية ── */}
        <div className="footer-brand-col">
          <div className="footer-brand">يارا <span>ستور</span></div>
          <p className="footer-desc">
            متجر أزياء نسائية متخصص يقدم قطعاً أنيقة بأسعار مناسبة. كل قطعة تُختار بعناية لتناسب ذوقك.
          </p>
          {whatsapp && (
            <div className="footer-contact">📱 واتساب: <span>{whatsapp}</span></div>
          )}
          <div className="footer-contact">📧 yaramahdi72@gmail.com</div>
        
        </div>

        {/* ── العمود الأوسط: الفئات ── */}
     

        {/* ── العمود الأيسر: تواصلي ── */}
        <div className="footer-col">
          <h4 className="footer-col-title">تواصلي معنا</h4>
          {whatsapp && (
            <a href={`https://api.whatsapp.com/send?phone=${formatWhatsappPhone(whatsapp)}`} className="footer-link" target="_blank" rel="noopener noreferrer">
              واتساب مباشر
            </a>
          )}
          <a href="https://www.instagram.com/she_in_by_yara22" className="footer-link" target="_blank" rel="noopener noreferrer">
            إنستغرام
          </a>
          <Link to="/admin/login" className="footer-link">لوحة الإدارة</Link>
        </div>

      </div>

      <div className="footer-bottom">
        <span>صُنع ♥ في غزة</span>
        <span>© ٢٠٢٦ متجر يارا – جميع الحقوق محفوظة</span>
      </div>
    </footer>
  );
}
