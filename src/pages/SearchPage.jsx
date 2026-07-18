import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Header      from '../components/Header/Header';
import ProductGrid from '../components/ProductGrid/ProductGrid';
import CartDrawer  from '../components/CartDrawer/CartDrawer';
import './SearchPage.css';

export default function SearchPage() {
  const [searchParams]  = useSearchParams();
  const query           = searchParams.get('q') || '';
  const [activeType, setActiveType] = useState('');

  return (
    <div>
      <Header activeType={activeType} onTypeChange={setActiveType} />

      <div className="search-page-header">
        <Link to="/" className="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5m7-7 7 7-7 7"/>
          </svg>
          الرئيسية
        </Link>
        <h1>
          نتائج: <span>"{query}"</span>
        </h1>
      </div>

      <ProductGrid searchQuery={query} type={activeType || undefined} />
      <CartDrawer />
    </div>
  );
}
