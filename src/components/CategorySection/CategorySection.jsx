import { useState, useEffect } from 'react';
import { getCategories, imgUrl } from '../../services/api';
import './CategorySection.css';

export default function CategorySection({ activeCategoryId, onCategoryChange }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories()
      .then(res => setCategories((res.data || []).filter(c => c.isVisible)))
      .catch(() => {});
  }, []);

  const handleCat = (catId) => {
    onCategoryChange(catId === activeCategoryId ? null : catId);
  };

  if (categories.length === 0) return null;

  return (
    <section className="category-section">
      <p className="category-label">COLLECTIONS</p>
      <h2 className="category-title">تسوقي حسب الفئة</h2>
      <p className="category-sub">اختاري فئتك واكتشفي أحدث الأزياء</p>

      <div className="cats-grid">
        <button
          className={`sub-category ${!activeCategoryId ? 'active' : ''}`}
          onClick={() => onCategoryChange(null)}
        >
          <div className="sub-category-img all-circle">الكل</div>
          <span className="sub-category-name">الكل</span>
        </button>

        {categories.map(cat => (
          <button
            key={cat._id}
            className={`sub-category ${activeCategoryId === cat._id ? 'active' : ''}`}
            onClick={() => handleCat(cat._id)}
          >
            {cat.image
              ? <img className="sub-category-img" src={imgUrl(cat.image)} alt={cat.name} />
              : <div className="sub-category-img placeholder-circle" />
            }
            <span className="sub-category-name">{cat.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
