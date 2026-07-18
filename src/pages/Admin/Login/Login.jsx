import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../../../services/adminApi';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm]         = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState(
    new URLSearchParams(window.location.search).get('expired')
      ? 'انتهت صلاحية الجلسة، الرجاء تسجيل الدخول مرة أخرى'
      : ''
  );
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminLogin(form);
      // الـ API يرجع { _id, username, role, token }
      const { token, ...adminData } = res.data;
      try {
        localStorage.setItem('yara-token', token);
        localStorage.setItem('yara-admin', JSON.stringify(adminData));
      } catch {
        // فشل التخزين لا يجب أن يمنع تسجيل الدخول من إتمام التوجيه
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'اسم المستخدم أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-brand">يارا ستور</div>
        <p className="login-subtitle">لوحة التحكم</p>

        <hr className="login-divider" />

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <div className="login-field">
            <label className="login-label">اسم المستخدم</label>
            <input
              type="text"
              className="admin-input"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="admin"
              required
              dir="ltr"
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label className="login-label">كلمة المرور</label>
            <div className="login-pass-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                className="admin-input"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                required
                dir="ltr"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShowPass(s => !s)}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>

      </div>
    </div>
  );
}
