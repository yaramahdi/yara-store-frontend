import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const IMG_BASE = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

// Render's free instances may need tens of seconds to wake after inactivity.
// Keep the request alive while the UI shows its loading skeleton instead of
// turning a normal cold start into a misleading network error.
const api = axios.create({ baseURL: API_BASE, timeout: 60000 });

// تحويل مسار الصورة إلى URL كامل
export const imgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${IMG_BASE}${path}`;
};

// تنظيف رقم الواتساب (إزالة كل ما عدا الأرقام) قبل استخدامه برابط wa
export const formatWhatsappPhone = (raw) => (raw || '').replace(/\D/g, '');

export const getProducts      = (params, signal) => api.get('/products', { params, signal });
export const getSimilarProducts = (categoryId, excludeId, limit = 8, signal) =>
  api.get('/products', { params: { category: categoryId, excludeId, limit }, signal });
export const getProductsStockStatus = (ids) => api.post('/products/stock-status', { ids });
export const getProduct       = (id, signal) => api.get(`/products/${id}`, { signal });
export const getCategories    = ()       => api.get('/categories');
export const getAnnouncements = ()       => api.get('/announcements');
export const getSettings      = ()       => api.get('/settings');
export const createOrder      = (data)   => api.post('/orders', data);
export const validateDiscountCode = (code, orderTotal) =>
  api.post('/settings/validate-discount', { code, orderTotal });

export default api;
