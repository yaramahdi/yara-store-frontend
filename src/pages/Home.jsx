import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AnnouncementBar    from '../components/AnnouncementBar/AnnouncementBar';
import Header             from '../components/Header/Header';
import HeroSection        from '../components/HeroSection/HeroSection';
import CategorySection    from '../components/CategorySection/CategorySection';
import ProductGrid        from '../components/ProductGrid/ProductGrid';
import CollectionBanner   from '../components/CollectionBanner/CollectionBanner';
import FeaturesBar        from '../components/FeaturesBar/FeaturesBar';
import CartDrawer         from '../components/CartDrawer/CartDrawer';
import WhatsAppBubble     from '../components/WhatsAppBubble/WhatsAppBubble';
import Footer             from '../components/Footer/Footer';
import { getSettings }    from '../services/api';

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeCategoryId,  setActiveCategoryId]  = useState(null);
  const [activeCollection,  setActiveCollection]   = useState(null);
  const [collections,       setCollections]        = useState([]);
  const productsRef = useRef(null);
  const favoritesOnly = new URLSearchParams(location.search).get('favorites') === '1';

  useEffect(() => {
    getSettings()
      .then(res => setCollections(res.data?.collections || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!favoritesOnly) return;
    const id = setTimeout(() => {
      productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => clearTimeout(id);
  }, [favoritesOnly]);

  const scrollToProducts = () =>
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  function handleExitFavorites() {
    const params = new URLSearchParams(location.search);
    params.delete('favorites');
    const search = params.toString();
    navigate({ pathname: '/', search: search ? `?${search}` : '' });
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 80);
  }

  function handleViewCollection(name) {
    setActiveCollection(name);
    setActiveCategoryId(null);
    scrollToProducts();
  }

  return (
    <div>
      <AnnouncementBar />
      <Header />
      <HeroSection onShopNow={scrollToProducts} />
      <FeaturesBar />

      <div id="collection-banner">
        <CollectionBanner
          collections={collections}
          onViewCollection={handleViewCollection}
        />
      </div>

      <CategorySection
        activeCategoryId={activeCategoryId}
        onCategoryChange={id => { setActiveCategoryId(id); setActiveCollection(null); }}
      />

      <div ref={productsRef} id="products-section">
        <ProductGrid
          categoryId={activeCategoryId}
          activeCollection={activeCollection}
          collections={collections}
          onClearCollection={() => setActiveCollection(null)}
          favoritesOnly={favoritesOnly}
          onExitFavorites={handleExitFavorites}
        />
      </div>

      <CartDrawer />
      <WhatsAppBubble />
      <Footer />
    </div>
  );
}
