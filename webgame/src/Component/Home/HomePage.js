import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../configs/Api';

function HomePage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:8000/games/')
      .then(response => {
        const data = Array.isArray(response.data) ? response.data : (response.data && response.data.results) ? response.data.results : [];
        setGames(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Lỗi khi lấy danh sách game:', error);
        setLoading(false);
      });

    const token = localStorage.getItem('access_token');
    if (token) {
      getCurrentUser()
        .then(res => setUser(res.data))
        .catch(() => setUser(null));
    }
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

  if (loading) return <div className="text-center py-5 text-light">Đang tải game...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#171a21', color: '#c7d5e0' }}>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark" style={{ background: '#171a21' }}>
        <div className="container">
          <span className="navbar-brand" style={{ color: '#66c0f4', fontWeight: 'bold' }}>Steam</span>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain" aria-controls="navbarMain" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarMain">
            <form className="d-flex ms-auto my-2 my-lg-0" role="search">
              <input className="form-control me-2" type="search" placeholder="Tìm kiếm game..." aria-label="Search" />
            </form>
            <div className="ms-3 d-flex align-items-center">
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

      {/* Banner */}
      <div className="py-5 text-center" style={{ background: 'linear-gradient(90deg, #1b2838 60%, #66c0f4 100%)' }}>
        <div className="container">
          <h1 className="display-5">Chào mừng đến với Steam!</h1>
          <p className="lead mb-0">Khám phá và mua các tựa game hot nhất hiện nay</p>
        </div>
      </div>

      {/* Game List */}
      <div className="container my-4">
        {games.length === 0 ? (
          <div className="text-center">Không có game để hiển thị.</div>
        ) : (
          <div className="row g-4">
            {games.map(game => (
              <div key={game.id} className="col-12 col-sm-6 col-lg-4">
                <div className="card h-100" style={{ background: '#1b2838', border: 'none', color: '#c7d5e0' }}>
                  {/* Responsive 16:9 image wrapper for clearer, consistent images */}
                  <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
                    <img
                      src={game.image}
                      alt={game.title}
                      loading="lazy"
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div className="card-body">
                    <h5 className="card-title" style={{ color: '#66c0f4' }}>{game.title}</h5>
                    <p className="card-text fw-bold mb-3">{formatVND(game.price)}</p>
                    <button className="btn btn-primary" style={{ background: '#66c0f4', borderColor: '#66c0f4', color: '#171a21' }}>Mua ngay</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-3" style={{ background: '#171a21' }}>
        © {new Date().getFullYear()} Steam Clone. Được tạo bởi AI.
      </footer>
    </div>
  );
}

export default HomePage;
