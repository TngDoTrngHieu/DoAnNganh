import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { endpoints, getGames } from '../../configs/Api';
import { addToCart } from '../../utils/cartUtils';

function HomePage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag_id') || '');
  const [priceMin, setPriceMin] = useState(searchParams.get('price_min') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('price_max') || '');
  const navigate = useNavigate();

  useEffect(() => {
    // read from URL
    const qParam = searchParams.get('q') || '';
    const tagParam = searchParams.get('tag_id') || '';
    const pMin = searchParams.get('price_min') || '';
    const pMax = searchParams.get('price_max') || '';

    // sync inputs
    setQ(qParam);
    setSelectedTag(tagParam);
    setPriceMin(pMin);
    setPriceMax(pMax);

    const params = {};
    if (qParam) params.q = qParam;
    if (tagParam) params.tag_id = tagParam;
    if (pMin) params.price_min = pMin;
    if (pMax) params.price_max = pMax;
    getGames(params)
      .then(response => {
        const data = Array.isArray(response.data) ? response.data : (response.data && response.data.results) ? response.data.results : [];
        setGames(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Lỗi khi lấy danh sách game:', error);
        setLoading(false);
      });
  }, [searchParams]);

  const formatVND = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const handleAddToCart = (id) => {
    if (addToCart(id)) {
      alert('Đã thêm vào giỏ');
    } else {
      alert('Lỗi khi thêm vào giỏ');
    }
  };

  if (loading) return <div className="text-center py-5 text-light">Đang tải game...</div>;

  return (
    <div style={{ background: '#171a21', color: '#c7d5e0', minHeight: '100%' }}>
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
                    <div className="d-flex gap-2">
                      <button onClick={() => navigate(`/games/${game.id}`)} className="btn btn-primary" style={{ background: '#66c0f4', borderColor: '#66c0f4', color: '#171a21' }}>Xem</button>
                      <button onClick={() => handleAddToCart(game.id)} className="btn btn-outline-light">Thêm vào giỏ</button>
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

export default HomePage;
