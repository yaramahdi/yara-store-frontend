import allGirlImg from '../../assets/images/allGirl.webp';
import allGirlMobileImg from '../../assets/images/allGirl-mobile.webp';
import './HeroSection.css';

export default function HeroSection({ onShopNow }) {
  return (
    <section className="hero">
      <picture>
        <source
          media="(max-width: 768px)"
          srcSet={allGirlMobileImg}
        />

        <img
          className="hero-bg"
          src={allGirlImg}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
        />
      </picture>

      <div className="hero-overlay" />

      <div className="hero-content">
        <p className="hero-welcome">WELCOME TO</p>

        <h1 className="hero-title">
          Yara Store
        </h1>

        <p className="hero-desc">
          اكتشفي أجمل موديلاتنا المميزة بألوان مريحة وتصميم أنيق
        </p>

        <button
          className="hero-btn"
          onClick={onShopNow}
        >
          تصفحي المنتجات
        </button>
      </div>
    </section>
  );
}
