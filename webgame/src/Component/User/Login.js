import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, getCurrentUser } from '../../configs/Api';

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
  };

  const onSubmit = async () => {
    if (!form.username || !form.password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await loginUser({ username: form.username, password: form.password });
      const { access, refresh } = res.data || {};
      if (access) localStorage.setItem('access_token', access);
      if (refresh) localStorage.setItem('refresh_token', refresh);
      try { await getCurrentUser(); } catch {}
      navigate('/');
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Đăng nhập thất bại';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(1000px 600px at 50% -20%, #2a475e 0%, #1b2838 60%, #171a21 100%)', color: '#c7d5e0' }}>
      <nav className="navbar navbar-expand-lg" style={{ background: '#171a21' }}>
        <div className="container">
          <span className="navbar-brand" style={{ color: '#66c0f4', fontWeight: 'bold' }}>Steam</span>
          <div className="ms-auto">
            <button className="btn btn-outline-light btn-sm" onClick={() => navigate('/')}>Trang chủ</button>
          </div>
        </div>
      </nav>

      <div className="container" style={{ maxWidth: 420, margin: '0 auto', paddingTop: 80 }}>
        <div className="card" style={{ background: '#1b2838', border: 'none', boxShadow: '0 6px 24px rgba(0,0,0,0.4)' }}>
          <div className="card-body">
            <h1 className="h4 text-center mb-3" style={{ color: '#c7d5e0' }}>Đăng nhập</h1>
            {error && (
              <div className="alert alert-danger py-2" role="alert">{error}</div>
            )}
            <div className="mb-3">
              <label htmlFor="username" className="form-label">Tên đăng nhập</label>
              <input type="text" className="form-control" id="username" placeholder="Nhập tên đăng nhập" value={form.username} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Mật khẩu</label>
              <input type="password" className="form-control" id="password" placeholder="Nhập mật khẩu" value={form.password} onChange={handleChange} />
            </div>
            <div className="d-grid">
              <button type="button" className="btn" disabled={submitting} style={{ background: '#66c0f4', color: '#171a21' }} onClick={onSubmit}>
                {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </div>
            <div className="text-center mt-3" style={{ opacity: 0.85 }}>
              Chưa có tài khoản? <button className="btn btn-link p-0" style={{ color: '#66c0f4', textDecoration: 'none' }} onClick={() => navigate('/register')}>Đăng ký</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
