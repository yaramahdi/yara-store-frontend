import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import AdminSidebar  from './components/AdminSidebar';
import Dashboard     from './Dashboard/Dashboard';
import Orders        from './Orders/Orders';
import Products      from './Products/Products';
import Categories    from './Categories/Categories';
import Announcements from './Announcements/Announcements';
import Settings      from './Settings/Settings';
import Collections   from './Collections/Collections';
import './AdminApp.css';

export default function AdminApp() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!localStorage.getItem('yara-token')) {
      navigate('/admin/login', { replace: true });
    }
  }, [navigate, location.pathname]);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-content">
          <Routes>
            <Route path="dashboard"     element={<Dashboard />}     />
            <Route path="orders"        element={<Orders />}        />
            <Route path="products"      element={<Products />}      />
            <Route path="categories"    element={<Categories />}    />
            <Route path="announcements" element={<Announcements />} />
            <Route path="collections"   element={<Collections />}   />
            <Route path="settings"      element={<Settings />}      />
            <Route path="*"             element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
