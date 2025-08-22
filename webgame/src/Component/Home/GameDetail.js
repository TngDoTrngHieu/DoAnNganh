import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import api, { endpoints, getCurrentUser, getDownloadLink, getReviews, createReviewApi } from '../../configs/Api';

function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showCat, setShowCat] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [checking, setChecking] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  useEffect(() => { // auto-check on mount if logged in
    const token = localStorage.getItem('access_token');
    if (token) {
      checkDownload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const loadCart = () => {
      try {
        const raw = localStorage.getItem('cart');
        const ids = raw ? JSON.parse(raw) : [];
        setCartCount(Array.isArray(ids) ? ids.length : 0);
      } catch { setCartCount(0); }
    };
    loadCart();
    const onStorage = (e) => { if (e.key === 'cart') loadCart(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!id) return;
    api.get(endpoints.gameDetail(id))
      .then(res => setGame(res.data))
      .catch(() => setError('Không thể tải thông tin game.'))
      .finally(() => setLoading(false));
    // load reviews
    getReviews(id).then(res => setReviews(Array.isArray(res.data) ? res.data : (res.data?.results ?? []))).catch(() => setReviews([]));
  }, [id]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      getCurrentUser()
        .then(res => setUser(res.data))
        .catch(() => setUser(null));
    }

    api.get(endpoints.categories)
      .then(res => setCategories(Array.isArray(res.data) ? res.data : (res.data?.results ?? [])))
      .catch(() => setCategories([]));
  }, []);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const submitReview = async () => {
    if (!id) return;
    if (!reviewForm.rating) return;
    setSubmittingReview(true);
    try {
      await createReviewApi({ game: Number(id), rating: Number(reviewForm.rating), comment: reviewForm.comment });
      const res = await getReviews(id);
      setReviews(Array.isArray(res.data) ? res.data : (res.data?.results ?? []));
      setReviewForm({ rating: 5, comment: '' });
      alert('Đã gửi đánh giá');
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Không thể gửi đánh giá (cần mua game trước)';
      alert(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  const checkDownload = async () => {
    if (!id) return;
    setChecking(true);
    try {
      const res = await getDownloadLink(id);
      const url = res?.data?.file;
      if (url) setDownloadUrl(url);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) {
        alert('Vui lòng đăng nhập để tải xuống');
        navigate('/login');
      }
    }
    setChecking(false);
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const win = window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      window.location.href = downloadUrl;
    }
  };

  const addToCart = (gid) => {
    try {
      const raw = localStorage.getItem('cart');
      const ids = raw ? JSON.parse(raw) : [];
      const set = new Set(Array.isArray(ids) ? ids : []);
      set.add(Number(gid));
      const next = Array.from(set);
      localStorage.setItem('cart', JSON.stringify(next));
      setCartCount(next.length);
      alert('Đã thêm vào giỏ');
    } catch (e) {
      localStorage.setItem('cart', JSON.stringify([Number(gid)]));
      setCartCount(1);
      alert('Đã thêm vào giỏ');
    }
  };

  // download handled via anchor with `download` attribute once `downloadUrl` is available

  const formatVND = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  if (loading) return <div className="text-center py-5 text-light">Đang tải...</div>;
  if (error) return <div className="text-center py-5 text-danger">{error}</div>;
  if (!game) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#171a21', color: '#c7d5e0' }}>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark" style={{ background: '#171a21' }}>
        <div className="container">
          <span className="navbar-brand" style={{ color: '#66c0f4', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => navigate('/')}>Steam</span>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain" aria-controls="navbarMain" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarMain">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Trang chủ</NavLink>
              </li>
              <li
                className="nav-item dropdown"
                onMouseEnter={() => setShowCat(true)}
                onMouseLeave={() => setShowCat(false)}
              >
                <NavLink to="/categories" className={({ isActive }) => `nav-link dropdown-toggle ${isActive ? 'active' : ''}`} role="button">
                  Danh mục
                </NavLink>
                <ul className={`dropdown-menu ${showCat ? 'show' : ''}`} style={{ background: '#1b2838' }}>
                  {categories.length === 0 ? (
                    <li><span className="dropdown-item text-muted">Chưa có danh mục</span></li>
                  ) : (
                    categories.map(c => (
                      <li key={c.id}>
                        <button
                          className="dropdown-item"
                          style={{ color: '#c7d5e0' }}
                          onClick={() => navigate(`/categories/${c.id}`)}
                        >
                          {c.name}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </li>
              <li className="nav-item">
                <NavLink to="/tags" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Tag</NavLink>
              </li>
            </ul>
            <form className="d-flex ms-auto my-2 my-lg-0" role="search">
              <input className="form-control me-2" type="search" placeholder="Tìm kiếm game..." aria-label="Search" />
            </form>
            <div className="ms-3 d-flex align-items-center">
              <button onClick={() => navigate('/cart')} className="btn btn-outline-info btn-sm me-2">Giỏ hàng ({cartCount})</button>
              {user ? (
                <>
                  <span className="me-2">Xin chào, <strong>{user?.username || 'User'}</strong></span>
                  <button onClick={logout} className="btn btn-outline-light btn-sm">Đăng xuất</button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate('/login')} className="btn btn-primary btn-sm me-2" style={{ background: '#66c0f4', borderColor: '#66c0f4', color: '#171a21' }}>Đăng nhập</button>
                  <button onClick={() => navigate('/register')} className="btn btn-outline-light btn-sm">Đăng ký</button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container py-4">
        <button className="btn btn-outline-light btn-sm mb-3" onClick={() => navigate(-1)}>Quay lại</button>

        <div className="row g-4">
          <div className="col-12 col-lg-5">
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
              <img src={game.image} alt={game.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
          <div className="col-12 col-lg-7">
            <h2 style={{ color: '#66c0f4' }}>{game.title}</h2>
            <div className="mb-2 small text-muted">
              {Array.isArray(game.categories) && game.categories.map(c => c.name).join(', ')}
            </div>
            <p className="mt-3">{game.description}</p>

            <div className="d-flex align-items-center gap-3 mt-4">
              <span className="fs-4 fw-bold">{formatVND(game.price)}</span>
              {downloadUrl ? (
                <button className="btn btn-outline-light" onClick={handleDownload}>Tải xuống</button>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={() => navigate('/checkout?ids=' + encodeURIComponent(JSON.stringify([id])))} style={{ background: '#66c0f4', borderColor: '#66c0f4', color: '#171a21' }}>Mua ngay</button>
                  <button className="btn btn-outline-light" onClick={() => addToCart(id)}>Thêm vào giỏ</button>
                </>
              )}
              <button className="btn btn-secondary" disabled={checking} onClick={checkDownload}>Kiểm tra mua</button>
            </div>

            <div className="mt-4">
              <div><strong>Nhà phát triển:</strong> {game.developer || 'N/A'}</div>
              <div className="mt-2"><strong>Tag:</strong> {Array.isArray(game.tags) ? game.tags.map(t => t.name).join(', ') : 'N/A'}</div>
              <div className="mt-2"><strong>Lượt xem:</strong> {game.view_count}</div>
              <div className="mt-2"><strong>Đã mua:</strong> {game.purchase_count}</div>
              <div className="mt-2 text-muted"><small>Ngày tạo: {game.created_at ? new Date(game.created_at).toLocaleString() : '—'}</small></div>
              <div className="mt-1 text-muted"><small>Cập nhật: {game.update_at ? new Date(game.update_at).toLocaleString() : '—'}</small></div>
              {/* Hidden direct file link removed to avoid bypassing purchase & CORS issues */}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        <h4 style={{ color: '#66c0f4' }}>Đánh giá</h4>
        {reviews.length === 0 ? (
          <div className="text-muted">Chưa có đánh giá.</div>
        ) : (
          <ul className="list-group mb-3">
            {reviews.map(r => (
              <li key={r.id} className="list-group-item" style={{ background: '#1b2838', color: '#c7d5e0' }}>
                <div className="d-flex justify-content-between">
                  <div><strong>{r.customer}</strong> – {r.rating} sao</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</div>
                </div>
                <div>{r.comment}</div>
              </li>
            ))}
          </ul>
        )}

        <div className="card" style={{ background: '#1b2838', border: 'none' }}>
          <div className="card-body">
            <div className="row g-2 align-items-center">
              <div className="col-auto">Đánh giá của bạn:</div>
              <div className="col-auto">
                <select className="form-select" value={reviewForm.rating} onChange={e => setReviewForm({ ...reviewForm, rating: e.target.value })}>
                  {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} sao</option>)}
                </select>
              </div>
              <div className="col">
                <input className="form-control" placeholder="Nhận xét..." value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} />
              </div>
              <div className="col-auto">
                <button className="btn btn-primary" disabled={submittingReview} onClick={submitReview}>Gửi</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameDetail;
