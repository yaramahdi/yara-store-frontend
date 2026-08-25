import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import logoImg from '../../assets/images/yaraStoreLogo.webp';
import './Header.css';

export default function Header({ mobileBottomContent } = {}) {
  const { totalItems, setIsOpen } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState('home');
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const goTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
    setMobileTab('home');
  };

  const goSection = (id, tabName) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 160);
    }
    setMobileMenuOpen(false);
    if (tabName) setMobileTab(tabName);
  };

  const openCart = () => {
    setIsOpen(true);
    setMobileTab('cart');
  };

  const openFavorites = () => {
    setMobileTab('shop');
    if (location.pathname !== '/') {
      navigate('/?favorites=1');
      return;
    }
    const params = new URLSearchParams(location.search);
    params.set('favorites', '1');
    navigate({ pathname: '/', search: `?${params.toString()}` });
    setTimeout(() => {
      document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery('');
    }
  };

  const handleSearchKey = (e) => {
    if (e.key === 'Enter') handleSearch(e);
    if (e.key === 'Escape') setSearchOpen(false);
  };

  return (
    <>
      <header className="header">
        <div className="header-inner">
        {/* يسار: لوجو + اسم المتجر */}
        <div className="header-brand">
          <Link to="/" className="logo" onClick={goTop}>
            <img src={logoImg} alt="يارا ستور" className="logo-img" />
            <span className="logo-text">يارا ستور</span>
          </Link>

          <button
            className={`mobile-menu-btn ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="القائمة"
            aria-expanded={mobileMenuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {/* وسط: روابط التنقل (desktop) */}
        <nav className="header-nav-desktop">
          <button className="nav-link" onClick={goTop}>الرئيسية</button>
          <button className="nav-link" onClick={() => goSection('products-section', 'shop')}>التسوق</button>
          <button className="nav-link" onClick={() => goSection('categories-section', 'shop')}>التشكيلات</button>
          <button className="nav-link" onClick={() => goSection('footer', 'home')}>عنّا</button>
        </nav>

        {/* يمين: أيقونات */}
        <div className="header-actions">
          {/* رابط لوحة التحكم — خفي */}
          <Link to="/admin/login" className="icon-btn admin-link" aria-label="لوحة التحكم" title="لوحة التحكم">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
            </svg>
          </Link>

          {/* زر السلة - ظاهر على الديسكتوب والإيباد */}
          <button className="icon-btn cart-btn" aria-label="السلة" title="السلة" onClick={openCart}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>

          {/* أيقونة البحث — mobile فقط */}
          <button
            className="icon-btn search-toggle"
            onClick={() => setSearchOpen(o => !o)}
            aria-label="بحث"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>

          {/* أيقونة المفضلة */}
          <button className="icon-btn fav-btn" aria-label="المفضلة" title="المفضلة" onClick={openFavorites}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
        </div>

      {/* شريط البحث المنسدل (mobile) */}
      <div className={`search-bar ${searchOpen ? 'open' : ''}`}>
        <form onSubmit={handleSearch} className="search-form">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="search-icon">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="ابحثي عن منتج..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleSearchKey}
            autoFocus={searchOpen}
          />
          {query && (
            <button type="button" className="clear-btn" onClick={() => setQuery('')}>✕</button>
          )}
          <button type="submit" className="search-submit-btn">بحث</button>
        </form>
      </div>

      {/* قائمة الموبايل */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <button className="mobile-menu-link" onClick={goTop}>الرئيسية</button>
        <button className="mobile-menu-link" onClick={() => goSection('products-section', 'shop')}>التسوق</button>
        <button className="mobile-menu-link" onClick={() => goSection('categories-section', 'shop')}>التشكيلات</button>
        <button className="mobile-menu-link" onClick={() => goSection('footer', 'home')}>عنّا</button>
      </div>
      </header>

      {/* تنقل سفلي للموبايل — أو محتوى مخصص (مثل زر أضيفي للسلة بصفحة المنتج) */}
      <nav className="mobile-bottom-nav" aria-label="تنقل الموبايل">
        {mobileBottomContent ? (
          <div className="mobile-bottom-custom">{mobileBottomContent}</div>
        ) : (
          <>
            <button className={`mobile-bottom-item ${mobileTab === 'home' ? 'active' : ''}`} onClick={goTop}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 10.5L12 3l9 7.5" />
                <path d="M5 9.5V20h14V9.5" />
              </svg>
              <span>الرئيسية</span>
            </button>

            <button className={`mobile-bottom-item ${mobileTab === 'shop' ? 'active' : ''}`} onClick={() => goSection('products-section', 'shop')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2l-3 4v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>التسوق</span>
            </button>

            <button className={`mobile-bottom-item ${mobileTab === 'cart' ? 'active' : ''}`} onClick={openCart}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span>السلة</span>
              {totalItems > 0 && <i className="mobile-bottom-badge">{totalItems}</i>}
            </button>
          </>
        )}
      </nav>
    </>
  );
}
