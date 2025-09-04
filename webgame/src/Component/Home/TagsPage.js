import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTags, getGames } from '../../configs/Api';
import { addToCart } from '../../utils/cartUtils';

function TagsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tags, setTags] = useState([]);
  const [selected, setSelected] = useState('');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getTags().then(res => setTags(Array.isArray(res.data) ? res.data : (res.data?.results ?? []))).catch(() => setTags([]));
  }, []);

  // Read tag_id from URL query parameter
  useEffect(() => {
    const tagId = searchParams.get('tag_id');
    if (tagId) {
      setSelected(tagId);
    }
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);

    const params = selected ? { tag_id: selected } : {};
    
    getGames(params).then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
      setGames(data);
    }).finally(() => setLoading(false));
  }, [selected]);

  const handleAddToCart = (id) => {
    if (addToCart(id)) {
      alert('Đã thêm vào giỏ');
    } else {
      alert('Lỗi khi thêm vào giỏ');
    }
  };

  const formatVND = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const getSelectedTagName = () => {
    if (!selected) return '';
    const tag = tags.find(t => t.id === parseInt(selected));
    return tag ? tag.name : '';
  };

  return (
    <div style={{ background: '#171a21', color: '#c7d5e0', minHeight: '100%' }}>
      <div className="container py-5">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 style={{ color: '#66c0f4' }}>
            {selected ? `Tag: ${getSelectedTagName()}` : 'Tất cả Tags'}
          </h2>
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
                      <img 
                        src={game.image} 
                        alt={game.title} 
                        loading="lazy" 
                        style={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover' 
                        }} 
                      />
                    </div>
                    <div className="card-body">
                      <h5 className="card-title" style={{ color: '#66c0f4' }}>{game.title}</h5>
                      <div className="mb-2 small text-muted" style={{ minHeight: 22 }}>
                        {Array.isArray(game.categories) && game.categories.map(c => c.name).join(', ')}
                      </div>
                      <p className="card-text fw-bold mb-3">{formatVND(game.price)}</p>
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-primary" 
                          onClick={() => navigate(`/games/${game.id}`)} 
                          style={{ background: '#66c0f4', borderColor: '#66c0f4', color: '#171a21' }}
                        >
                          Xem
                        </button>
                                                  <button 
                            className="btn btn-outline-light" 
                            onClick={() => handleAddToCart(game.id)}
                          >
                            Thêm vào giỏ
                          </button>
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

export default TagsPage;


