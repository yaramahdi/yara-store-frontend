import { useEffect, useState } from 'react';
import {
  adminGetProducts,
  adminGetCategories,
  adminGetAnnouncements,
  adminGetDashboardStats,
} from '../../../services/adminApi';
import './Dashboard.css';

const StatIcon = ({ name }) => {
  const p = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'products') return (
    <svg {...p}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
  if (name === 'categories') return (
    <svg {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  );
  if (name === 'announcements') return (
    <svg {...p}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [soldProducts, setSoldProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = () => {
    setLoading(true);
    setLoadError('');
    Promise.all([
      adminGetProducts({}),
      adminGetCategories(),
      adminGetAnnouncements(),
      adminGetDashboardStats(),
    ]).then(([products, categories, announcements, orderStats]) => {
      const productData = products.data?.products || products.data || [];
      const orderData = orderStats.data || {};

      setStats({
        products:      Array.isArray(productData) ? productData.length : 0,
        categories:    (categories.data || []).length,
        announcements: (announcements.data || []).length,
        totalOrders: Number(orderData.totalOrders || 0),
        confirmedOrders: Number(orderData.confirmedOrders || 0),
        soldItems: Number(orderData.soldItems || 0),
        confirmedRevenue: Number(orderData.confirmedRevenue || 0),
        confirmedProfit: Number(orderData.confirmedProfit || 0),
      });

      setSoldProducts(Array.isArray(orderData.soldProducts) ? orderData.soldProducts : []);
    }).catch(() => {
      setStats(null);
      setSoldProducts([]);
      setLoadError('تعذر تحميل بيانات لوحة التحكم بسبب ضعف الشبكة.');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const cards = [
    { label: 'المنتجات',  value: stats?.products,      icon: 'products',      color: '#3b82f6' },
    { label: 'الفئات',    value: stats?.categories,    icon: 'categories',    color: '#8b5cf6' },
    { label: 'الإعلانات', value: stats?.announcements, icon: 'announcements', color: '#f59e0b' },
  ];

  return (
    <div className="dashboard">
      <div className="admin-page-header">
        <h2 className="admin-page-title">لوحة التحكم</h2>
        <p className="admin-page-sub">مرحباً بك في إدارة يارا ستور</p>
      </div>

      {loading ? (
        <div className="dashboard-loading">جاري التحميل...</div>
      ) : loadError ? (
        <div className="pg-load-error">
          <p>{loadError}</p>
          <button className="pg-retry-btn" onClick={load}>
            إعادة التحميل
          </button>
        </div>
      ) : (
        <>
          <div className="dashboard-circles">
            {cards.map(card => (
              <div key={card.label} className="stat-circle" style={{ '--stat-color': card.color }}>
                <div className="stat-circle__ring">
                  <span className="stat-circle__icon"><StatIcon name={card.icon} /></span>
                  <span className="stat-circle__value">{card.value}</span>
                </div>
                <span className="stat-circle__label">{card.label}</span>
              </div>
            ))}
          </div>

          <div className="dashboard-kpi-grid">
            <div className="dashboard-kpi-card">
              <span className="kpi-label">إجمالي الطلبات</span>
              <strong className="kpi-value">{stats?.totalOrders || 0}</strong>
            </div>
            <div className="dashboard-kpi-card">
              <span className="kpi-label">طلبات مؤكدة</span>
              <strong className="kpi-value">{stats?.confirmedOrders || 0}</strong>
            </div>
            <div className="dashboard-kpi-card">
              <span className="kpi-label">القطع المباعة</span>
              <strong className="kpi-value">{stats?.soldItems || 0}</strong>
            </div>
            <div className="dashboard-kpi-card dashboard-kpi-card--revenue">
              <span className="kpi-label">إجمالي المبيعات</span>
              <strong className="kpi-value">₪{Number(stats?.confirmedRevenue || 0).toFixed(2)}</strong>
            </div>
            <div className="dashboard-kpi-card dashboard-kpi-card--profit">
              <span className="kpi-label">إجمالي الربح</span>
              <strong className="kpi-value">₪{Number(stats?.confirmedProfit || 0).toFixed(2)}</strong>
            </div>
          </div>

          <div className="dashboard-sales-section">
            <div className="dashboard-sales-head">
              <h3>المنتجات المباعة</h3>
              <p>حسب الطلبات المؤكدة</p>
            </div>

            {soldProducts.length === 0 ? (
              <div className="dashboard-sales-empty">لا توجد بيانات مبيعات مؤكدة بعد.</div>
            ) : (
              <div className="dashboard-sales-table-wrap">
                <table className="dashboard-sales-table">
                  <thead>
                    <tr>
                      <th>المنتج</th>
                      <th>الكمية المباعة</th>
                      <th>إجمالي البيع</th>
                      <th>إجمالي الربح</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soldProducts.map((p, idx) => (
                      <tr key={`${p.productId || p.name}-${idx}`}>
                        <td>{p.name}</td>
                        <td>{p.quantity}</td>
                        <td>₪{Number(p.revenue || 0).toFixed(2)}</td>
                        <td className="profit-cell">₪{Number(p.profit || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
