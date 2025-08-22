import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTags, getGames } from '../../configs/Api';

function TagsPage() {
  const navigate = useNavigate();
  const [tags, setTags] = useState([]);
  const [selected, setSelected] = useState('');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    getTags().then(res => setTags(Array.isArray(res.data) ? res.data : (res.data?.results ?? []))).catch(() => setTags([]));
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

  useEffect(() => {
    if (!selected) { setGames([]); return; }
    setLoading(true);
    getGames({ tag_id: selected }).then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
      setGames(data);
    }).finally(() => setLoading(false));
  }, [selected]);

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

  const formatVND = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#171a21', color: '#c7d5e0' }}>
      <div className="container py-5">
        <div className="d-flex align-items-center justify-content-between">
          <h2 style={{ color: '#66c0f4' }}>Tag</h2>
          <button onClick={() => navigate('/cart')} className="btn btn-outline-info btn-sm">Giỏ hàng ({cartCount})</button>
        </div>
        <div className="mb-3 d-flex gap-2">
          <select className="form-select" value={selected} onChange={e => setSelected(e.target.value)} style={{ maxWidth: 300 }}>
            <option value="">Chọn tag</option>
            {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        {loading ? (
          <div>Đang tải...</div>
        ) : (
          <div className="row g-4">
            {games.map(game => (
              <div key={game.id} className="col-12 col-sm-6 col-lg-4">
                <div className="card h-100" style={{ background: '#1b2838', border: 'none', color: '#c7d5e0' }}>
                  <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
                    <img src={game.image} alt={game.title} loading="lazy" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="card-body">
                    <h5 className="card-title" style={{ color: '#66c0f4' }}>{game.title}</h5>
                    <p className="card-text fw-bold mb-3">{formatVND(game.price)}</p>
                    <div className="d-flex gap-2">
                      <button className="btn btn-primary" onClick={() => navigate(`/games/${game.id}`)} style={{ background: '#66c0f4', borderColor: '#66c0f4', color: '#171a21' }}>Xem</button>
                      <button className="btn btn-outline-light" onClick={() => addToCart(game.id)}>Thêm vào giỏ</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TagsPage;


