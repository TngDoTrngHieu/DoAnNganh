import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import api, { endpoints, getCurrentUser } from '../../configs/Api';

function CategoriesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('Danh mục');
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showCat, setShowCat] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    let url = endpoints.games;
    const params = id ? { params: { category_id: id } } : undefined;
    // fetch games filtered by category if id exists
    api.get(url, params)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
        setGames(data);
      })
      .finally(() => setLoading(false));

    // fetch category name if id
    if (id) {
      api.get(endpoints.categories)
        .then(res => {
          const cats = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
          const found = cats.find(c => String(c.id) === String(id));
          if (found) setCategoryName(found.name);
        })
        .catch(() => {});
    }
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

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const formatVND = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const addToCart = (id) => {
    try {
      const raw = localStorage.getItem('cart');
      const ids = raw ? JSON.parse(raw) : [];
      const set = new Set(Array.isArray(ids) ? ids : []);
      set.add(Number(id));
      localStorage.setItem('cart', JSON.stringify(Array.from(set)));
      alert('Đã thêm vào giỏ');
    } catch (e) {
      localStorage.setItem('cart', JSON.stringify([Number(id)]));
      alert('Đã thêm vào giỏ');
    }
  };

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

      <div className="container py-5">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 style={{ color: '#66c0f4' }}>{id ? `Danh mục: ${categoryName}` : 'Tất cả danh mục'}</h2>
          <button className="btn btn-outline-light btn-sm" onClick={() => navigate(-1)}>Quay lại</button>
        </div>

        {loading ? (
          <div>Đang tải...</div>
        ) : (
          <div className="row g-4">
            {games.length === 0 ? (
              <div className="text-center">Không có game.</div>
            ) : (
              games.map(game => (
                <div key={game.id} className="col-12 col-sm-6 col-lg-4">
                  <div className="card h-100" style={{ background: '#1b2838', border: 'none', color: '#c7d5e0' }}>
                    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
                      <img src={game.image} alt={game.title} loading="lazy" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div className="card-body">
                      <h5 className="card-title" style={{ color: '#66c0f4' }}>{game.title}</h5>
                      <div className="mb-2 small text-muted" style={{ minHeight: 22 }}>
                        {Array.isArray(game.categories) && game.categories.map(c => c.name).join(', ')}
                      </div>
                      <p className="card-text fw-bold mb-3">{formatVND(game.price)}</p>
                      <div className="d-flex gap-2">
                        <button className="btn btn-primary" onClick={() => navigate(`/games/${game.id}`)} style={{ background: '#66c0f4', borderColor: '#66c0f4', color: '#171a21' }}>Xem</button>
                        <button className="btn btn-outline-light" onClick={() => addToCart(game.id)}>Thêm vào giỏ</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoriesPage;


