import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { endpoints } from '../../configs/Api';
import { addToCart } from '../../utils/cartUtils';

function CategoriesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('Danh mục');

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

  return (
    <div style={{ background: '#171a21', color: '#c7d5e0', minHeight: '100%' }}>
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
                        <button className="btn btn-outline-light" onClick={() => handleAddToCart(game.id)}>Thêm vào giỏ</button>
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


