import React, { useEffect, useContext, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import api, { endpoints } from '../../configs/Api';
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
   

    api.get(endpoints.categories)
      .then(res => setCategories(Array.isArray(res.data) ? res.data : (res.data?.results ?? [])))
      .catch(() => setCategories([]));


    api.get(endpoints.tags)
      .then(res => setTags(Array.isArray(res.data) ? res.data : (res.data?.results ?? [])))
      .catch(() => setTags([]));
  }, []);

  const logout = () => {
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
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <NavLink to="/" className="navbar-brand text-info fw-bold text-decoration-none">
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
                  className={({ isActive }) => `nav-link text-light ${isActive ? 'active' : ''}`}
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
                  className={({ isActive }) => `nav-link dropdown-toggle text-light ${isActive ? 'active' : ''}`} 
                  role="button"
                >
                  Danh mục
                </NavLink>
                <ul className={`dropdown-menu dropdown-menu-dark ${showCat ? 'show' : ''}`}>
                  {categories.length === 0 ? (
                    <li><span className="dropdown-item text-muted">Chưa có danh mục</span></li>
                  ) : (
                    categories.map(c => (
                      <li key={c.id}>
                        <button
                          className="dropdown-item text-light"
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
                  className={({ isActive }) => `nav-link dropdown-toggle text-light ${isActive ? 'active' : ''}`} 
                  role="button"
                >
                  Tag
                </NavLink>
                <ul className={`dropdown-menu dropdown-menu-dark ${showTags ? 'show' : ''}`}>
                  {tags.length === 0 ? (
                    <li><span className="dropdown-item text-muted">Chưa có tag</span></li>
                  ) : (
                    tags.map(t => (
                      <li key={t.id}>
                        <button
                          className="dropdown-item text-light"
                          onClick={() => navigate(`/tags?tag_id=${t.id}`)}
                        >
                          {t.name}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </li>
              {user && (
                <li className="nav-item">
                  <NavLink 
                    to="/stats" 
                    end 
                    className={({ isActive }) => `nav-link text-light ${isActive ? 'active' : ''}`}
                  >
                    Thống kê
                  </NavLink>
                </li>
              )}
            </ul>

            {/* Search Form */}
            <form className="d-flex ms-auto my-2 my-lg-0" role="search" onSubmit={handleSearch}>
              <input 
                className="form-control me-2 bg-dark text-light border border-info" 
                type="search" 
                placeholder="Tìm kiếm game..." 
                aria-label="Search" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-outline-info" type="submit">
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
                  >
                    Giỏ hàng ({cartCount})
                  </button>
                  <span className="me-2 text-light">
                    Xin chào, <strong>{user?.username || 'User'}</strong>
                  </span>
                  <button 
                    onClick={logout} 
                    className="btn btn-outline-light btn-sm" 
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => navigate('/login')} 
                    className="btn btn-primary btn-sm me-2" 
                  >
                    Đăng nhập
                  </button>
                  <button 
                    onClick={() => navigate('/register')} 
                    className="btn btn-outline-light btn-sm"
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