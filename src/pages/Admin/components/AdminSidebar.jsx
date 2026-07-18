import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { adminGetOrders } from '../../../services/adminApi';
import './AdminSidebar.css';

/* ── SVG Icon components ── */
const IcProducts = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const IcCategories = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/>
    <rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/>
  </svg>
);

const IcAnnouncements = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const IcSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const IcCollections = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="5" rx="1.5"/>
    <rect x="3" y="11" width="18" height="5" rx="1.5"/>
    <rect x="3" y="19" width="11" height="2" rx="1"/>
  </svg>
);

const IcOrders = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const IcLogout = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const navItems = [
  { icon: <IcOrders />,        label: 'الطلبات',      path: '/admin/orders'        },
  { icon: <IcProducts />,      label: 'المنتجات',     path: '/admin/products'      },
  { icon: <IcCollections />,   label: 'الكولكشنات',   path: '/admin/collections'   },
  { icon: <IcCategories />,    label: 'الفئات',       path: '/admin/categories'    },
  { icon: <IcAnnouncements />, label: 'الإعلانات',    path: '/admin/announcements' },
  { icon: <IcSettings />,      label: 'الإعدادات',    path: '/admin/settings'      },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const [ordersCount, setOrdersCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadOrdersCount = async () => {
      try {
        const res = await adminGetOrders();
        if (mounted) setOrdersCount(Array.isArray(res.data) ? res.data.length : 0);
      } catch {
        if (mounted) setOrdersCount(0);
      }
    };

    loadOrdersCount();
    const interval = setInterval(loadOrdersCount, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem('yara-token');
    localStorage.removeItem('yara-admin');
    navigate('/admin/login');
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="admin-sidebar">
        <NavLink to="/admin/dashboard" className="sidebar-logo">
          <span className="sidebar-logo__text">يارا ستور</span>
          <span className="sidebar-logo__badge">إدارة</span>
        </NavLink>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-item__icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.path === '/admin/orders' && (
                <span className="nav-item__count" aria-label={`عدد الطلبات ${ordersCount}`}>
                  {ordersCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          <IcLogout />
          <span>تسجيل الخروج</span>
        </button>
      </aside>

      {/* ── Mobile bottom navigation ── */}
      <nav className="admin-bottom-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="bottom-nav-item__icon">{item.icon}</span>
            <span className="bottom-nav-item__label-wrap">
              <span className="bottom-nav-item__label">{item.label}</span>
              {item.path === '/admin/orders' && (
                <span className="bottom-nav-item__count" aria-hidden="true">{ordersCount}</span>
              )}
            </span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
