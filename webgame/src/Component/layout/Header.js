import React, { useEffect, useContext, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import api, { endpoints, getCurrentUser, authApi } from '../../configs/Api';
import { AuthContext } from '../User/AuthContext';

function Header() {
  const navigate = useNavigate();
  const { user, setUser, cartCount, setCartCount } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [showCat, setShowCat] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (token) {
      getCurrentUser()
        .then(res => {
          setUser(res.data);
          return authApi().get('/carts/items/');
        })
        .then(cartRes => {
          setCartCount(Array.isArray(cartRes.data.items) ? cartRes.data.items.length : 0);
        })
        .catch(() => {
          setUser(null);
          setCartCount(0);
        });
    } else {
      setUser(null);
      setCartCount(0);
    }

    // Fetch categories
    api.get(endpoints.categories)
      .then(res => setCategories(Array.isArray(res.data) ? res.data : (res.data?.results ?? [])))
      .catch(() => setCategories([]));

    // Fetch tags
    api.get(endpoints.tags)
      .then(res => setTags(Array.isArray(res.data) ? res.data : (res.data?.results ?? [])))
      .catch(() => setTags([]));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setCartCount(0);
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header>
      <nav className="navbar navbar-expand-lg navbar-dark" style={{ background: '#171a21' }}>
        <div className="container">
          <NavLink to="/" className="navbar-brand" style={{ color: '#66c0f4', fontWeight: 'bold', textDecoration: 'none' }}>
            Steam
          </NavLink>

          <button 
            className="navbar-toggler" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarMain" 
            aria-controls="navbarMain" 
            aria-expanded="false" 
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarMain">
            {/* Navbar Links */}
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <NavLink 
                  to="/" 
                  end 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  style={{ color: '#c7d5e0' }}
                >
                  Trang chủ
                </NavLink>
              </li>

              {/* Categories Dropdown */}
              <li
                className="nav-item dropdown"
                onMouseEnter={() => setShowCat(true)}
                onMouseLeave={() => setShowCat(false)}
              >
                <NavLink 
                  to="/categories" 
                  className={({ isActive }) => `nav-link dropdown-toggle ${isActive ? 'active' : ''}`} 
                  role="button"
                  style={{ color: '#c7d5e0' }}
                >
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

              {/* Tags Dropdown */}
              <li
                className="nav-item dropdown"
                onMouseEnter={() => setShowTags(true)}
                onMouseLeave={() => setShowTags(false)}
              >
                <NavLink 
                  to="/tags" 
                  className={({ isActive }) => `nav-link dropdown-toggle ${isActive ? 'active' : ''}`} 
                  role="button"
                  style={{ color: '#c7d5e0' }}
                >
                  Tag
                </NavLink>
                <ul className={`dropdown-menu ${showTags ? 'show' : ''}`} style={{ background: '#1b2838' }}>
                  {tags.length === 0 ? (
                    <li><span className="dropdown-item text-muted">Chưa có tag</span></li>
                  ) : (
                    tags.map(t => (
                      <li key={t.id}>
                        <button
                          className="dropdown-item"
                          style={{ color: '#c7d5e0' }}
                          onClick={() => navigate(`/tags?tag_id=${t.id}`)}
                        >
                          {t.name}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </li>
              <li className="nav-item">
                <NavLink 
                  to="/stats" 
                  end 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  style={{ color: '#c7d5e0' }}
                >
                  Thống kê
                </NavLink>
              </li>
            </ul>

            {/* Search Form */}
            <form className="d-flex ms-auto my-2 my-lg-0" role="search" onSubmit={handleSearch}>
              <input 
                className="form-control me-2" 
                type="search" 
                placeholder="Tìm kiếm game..." 
                aria-label="Search" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: '#1b2838', border: '1px solid #66c0f4', color: '#c7d5e0' }}
              />
              <button className="btn btn-outline-info" type="submit" style={{ borderColor: '#66c0f4', color: '#66c0f4' }}>
                Tìm
              </button>
            </form>

            {/* User Actions */}
            <div className="ms-3 d-flex align-items-center">
              {user ? (
                <>
                  <button 
                    onClick={() => navigate('/cart')} 
                    className="btn btn-outline-info btn-sm me-2"
                    style={{ borderColor: '#66c0f4', color: '#66c0f4' }}
                  >
                    Giỏ hàng ({cartCount})
                  </button>
                  <span className="me-2" style={{ color: '#c7d5e0' }}>
                    Xin chào, <strong>{user?.username || 'User'}</strong>
                  </span>
                  <button 
                    onClick={logout} 
                    className="btn btn-outline-light btn-sm" 
                    style={{ borderColor: '#c7d5e0', color: '#c7d5e0' }}
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => navigate('/login')} 
                    className="btn btn-primary btn-sm me-2" 
                    style={{ background: '#66c0f4', borderColor: '#66c0f4', color: '#171a21' }}
                  >
                    Đăng nhập
                  </button>
                  <button 
                    onClick={() => navigate('/register')} 
                    className="btn btn-outline-light btn-sm"
                    style={{ borderColor: '#c7d5e0', color: '#c7d5e0' }}
                  >
                    Đăng ký
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
