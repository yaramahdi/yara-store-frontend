import axios from 'axios';
import { compressBeforeUpload } from '../utils/compressBeforeUpload';
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const REQUEST_TIMEOUT = 15000;

// عند انتهاء صلاحية التوكن أو عدم صلاحيته: امسحيه وأعيدي التوجيه لتسجيل الدخول
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('yara-token');
      localStorage.removeItem('yara-admin');
      if (!window.location.pathname.startsWith('/admin/login')) {
        window.location.href = '/admin/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('yara-token')}` },
  timeout: REQUEST_TIMEOUT,
});

// Auth
export const adminLogin = (data) =>
  axios.post(`${BASE}/auth/login`, data, { timeout: REQUEST_TIMEOUT });

// Products
export const adminGetProducts = (filters) =>
  axios.get(`${BASE}/products/admin/list`, { params: filters, ...authHeaders() });
export const adminCreateProduct = (data) =>
  axios.post(`${BASE}/products`, data, authHeaders());
export const adminUpdateProduct = (id, data) =>
  axios.put(`${BASE}/products/${id}`, data, authHeaders());
export const adminDeleteProduct = (id) =>
  axios.delete(`${BASE}/products/${id}`, authHeaders());
export const adminToggleProduct = (id) =>
  axios.patch(`${BASE}/products/${id}/toggle-visibility`, {}, authHeaders());
// Categories
export const adminGetCategories = () =>
  axios.get(`${BASE}/categories`, authHeaders());
export const adminCreateCategory = (data) =>
  axios.post(`${BASE}/categories`, data, authHeaders());
export const adminUpdateCategory = (id, data) =>
  axios.put(`${BASE}/categories/${id}`, data, authHeaders());
export const adminDeleteCategory = (id) =>
  axios.delete(`${BASE}/categories/${id}`, authHeaders());

// Announcements
export const adminGetAnnouncements = () =>
  axios.get(`${BASE}/announcements/all`, authHeaders());
export const adminCreateAnnouncement = (data) =>
  axios.post(`${BASE}/announcements`, data, authHeaders());
export const adminToggleAnnouncement = (id) =>
  axios.patch(`${BASE}/announcements/${id}/toggle`, {}, authHeaders());
export const adminDeleteAnnouncement = (id) =>
  axios.delete(`${BASE}/announcements/${id}`, authHeaders());

// Settings
export const adminGetSettings = () =>
  axios.get(`${BASE}/settings`, authHeaders());
export const adminUpdateSettings = (data) =>
  axios.put(`${BASE}/settings`, data, authHeaders());

// Orders
export const adminGetOrders     = ()    => axios.get(`${BASE}/orders`, authHeaders());
export const adminConfirmOrder  = (id, data = {})  => axios.patch(`${BASE}/orders/${id}/confirm`, data, authHeaders());
export const adminDeleteOrder   = (id)  => axios.delete(`${BASE}/orders/${id}`, authHeaders());
export const adminGetDashboardStats = () => axios.get(`${BASE}/orders/stats/dashboard`, authHeaders());

const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const res = await axios.post(`${BASE}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${localStorage.getItem('yara-token')}`
    },
    timeout: 30000,
  });
  return res.data.url;
};

export const uploadImage = async (file) => uploadFile(file);

export const uploadProductImage = async (file) => {
  const fileToUpload = await compressBeforeUpload(file);
  return uploadFile(fileToUpload);
};
