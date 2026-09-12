import { useState, useEffect } from 'react';
import { getSimilarProducts } from '../../services/api';
import ProductCard from '../ProductCard/ProductCard';
import './SimilarProducts.css';

const DISPLAY_COUNT = 8;

export default function SimilarProducts({ categoryId, excludeId, excludeIds = [], sectionRef }) {
  const [products, setProducts] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!categoryId) {
      setProducts([]);
      setHasFetched(true);
      return;
    }

    const controller = new AbortController();

    // نجيب واحد زيادة عن الحد المعروض حتى لو انفلترت ألوان مرتبطة يضل عنا 8
    getSimilarProducts(categoryId, excludeId, DISPLAY_COUNT + 1, controller.signal)
      .then((res) => {
        const list = res.data?.products || [];
        // استثناء المنتج الحالي هون كمان (بالإضافة لـ excludeId بالباك اند) كحماية
        // إضافية — مثلاً لو الباك اند المنشور تأخر عن آخر تحديث محلي
        const filtered = list.filter((p) => p._id !== excludeId && !excludeIds.includes(p._id));
        setProducts(filtered.slice(0, DISPLAY_COUNT));
      })
      .catch((err) => {
        if (err.code === 'ERR_CANCELED') return; // تغيّر المنتج أو مغادرة الصفحة
        setProducts([]);
      })
      .finally(() => {
        setHasFetched(true);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, excludeId]);

  if (!categoryId) return null;
  if (hasFetched && products.length === 0) return null;

  return (
    <section className="similar-products-section" ref={sectionRef}>
      <h2 className="similar-products-heading">قد يعجبكِ أيضاً</h2>

      {!hasFetched ? (
        <div className="similar-products-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="sp-sk-card">
              <div className="sp-sk-img" />
              <div className="sp-sk-line w-70" />
              <div className="sp-sk-line w-40" />
            </div>
          ))}
        </div>
      ) : (
        <div className="similar-products-grid">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
