import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerAccount } from '../../configs/Api';

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '', phone_number: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
  };

  const validate = () => {
    if (!form.email || !form.username || !form.password || !form.confirm) {
      return 'Vui lòng điền đầy đủ Email, Tên đăng nhập và Mật khẩu';
    }
    if (form.password.length < 6) {
      return 'Mật khẩu phải từ 6 ký tự trở lên';
    }
    if (form.password !== form.confirm) {
      return 'Mật khẩu nhập lại không khớp';
    }
    if (form.phone_number) {
      const phoneRegex = /^\+?1?\d{9,15}$/;
      if (!phoneRegex.test(form.phone_number)) {
        return 'Số điện thoại không đúng định dạng (+84..., 9-15 chữ số)';
      }
    }
    return '';
  };

  const onSubmit = async () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await registerAccount({
        email: form.email,
        username: form.username,
        password: form.password,
        phone_number: form.phone_number,
      });
      navigate('/login');
    } catch (e) {
      const apiMsg = e?.response?.data?.error || 'Đăng ký thất bại';
      setError(typeof apiMsg === 'string' ? apiMsg : JSON.stringify(apiMsg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(1000px 600px at 50% -20%, #2a475e 0%, #1b2838 60%, #171a21 100%)', color: '#c7d5e0' }}>
  

      <div className="container mt-5" >
        <div className="card" >
          <div className="card-body">
            <h1 className="h4 text-center mb-3" >Đăng ký</h1>
            {error && (
              <div className="alert alert-danger py-2" role="alert">
                {error}
              </div>
            )}
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input type="email" className="form-control" id="email" placeholder="name@example.com" value={form.email} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label htmlFor="username" className="form-label">Tên đăng nhập</label>
              <input type="text" className="form-control" id="username" placeholder="Nhập tên đăng nhập" value={form.username} onChange={handleChange} />
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="password" className="form-label">Mật khẩu</label>
                <input type="password" className="form-control" id="password" placeholder="Tối thiểu 6 ký tự" value={form.password} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label htmlFor="confirm" className="form-label">Nhập lại mật khẩu</label>
                <input type="password" className="form-control" id="confirm" placeholder="Nhập lại mật khẩu" value={form.confirm} onChange={handleChange} />
              </div>
            </div>
            <div className="mb-3 mt-3">
              <label htmlFor="phone_number" className="form-label">Số điện thoại</label>
              <input type="tel" className="form-control" id="phone_number" placeholder="Ví dụ: +84901234567" value={form.phone_number} onChange={handleChange} />
              <div className="form-text" >Định dạng: +84901234567 hoặc 0901234567 (9-15 chữ số).</div>
            </div>
            <div className="d-grid">
              <button type="button" className="btn" disabled={submitting} onClick={onSubmit} style={{ background: '#66c0f4', color: '#171a21' }}>
                {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
              </button>
            </div>
            <div className="text-center mt-3" >
              Đã có tài khoản? <button className="btn btn-link p-0" onClick={() => navigate('/login')}>Đăng nhập</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
