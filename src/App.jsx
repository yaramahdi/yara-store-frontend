import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { CartProvider } from './context/CartContext';

import Home from './pages/Home';
import ProductPage from './pages/ProductPage/ProductPage';

import './App.css';

function NotFound() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16, minHeight: '60vh', textAlign: 'center', padding: 24,
    }}>
      <h1 style={{ fontSize: '2rem', margin: 0 }}>404</h1>
      <p style={{ margin: 0 }}>الصفحة غير موجودة</p>
      <Link to="/" style={{
        padding: '10px 24px', borderRadius: 12, background: 'var(--gold, #c49b4c)',
        color: '#fff', textDecoration: 'none', fontWeight: 700,
      }}>
        ← العودة للرئيسية
      </Link>
    </div>
  );
}

// صفحة البحث تُحمّل عند الدخول إليها
const SearchPage = lazy(() => import('./pages/SearchPage'));

// صفحات الأدمن تُحمّل عند الحاجة فقط
const AdminApp = lazy(() => import('./pages/Admin/AdminApp'));
const Login = lazy(() => import('./pages/Admin/Login/Login'));

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Suspense fallback={<div>جاري التحميل...</div>}>
          <Routes>
            <Route
              path="/"
              element={<Home />}
            />

            <Route
              path="/search"
              element={<SearchPage />}
            />

            <Route
              path="/product/:id"
              element={<ProductPage />}
            />

            <Route
              path="/admin"
              element={<Navigate to="/admin/login" replace />}
            />

            <Route
              path="/admin/login"
              element={<Login />}
            />

            <Route
              path="/admin/*"
              element={<AdminApp />}
            />

            <Route
              path="*"
              element={<NotFound />}
            />
          </Routes>
        </Suspense>
      </CartProvider>
    </BrowserRouter>
  );
}