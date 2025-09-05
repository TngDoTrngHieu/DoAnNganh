import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getGames, addToCart, getTags, getCategories } from '../../configs/Api';
import { AuthContext } from "../User/AuthContext";

function HomePage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag_id') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category_id') || '');
  const [priceMin, setPriceMin] = useState(searchParams.get('price_min') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('price_max') || '');
  const navigate = useNavigate();
  const { setCartCount } = useContext(AuthContext);
  const [page, setPage] = useState(1);

  // Load tags và categories
  useEffect(() => {
    getTags().then(res => setTags(res.data)).catch(() => setTags([]));
    getCategories().then(res => setCategories(res.data)).catch(() => setCategories([]));
  }, []);

  // Load games khi searchParams thay đổi
  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    const tagParam = searchParams.get('tag_id') || '';
    const categoryParam = searchParams.get('category_id') || '';
    const pMin = searchParams.get('price_min') || '';
    const pMax = searchParams.get('price_max') || '';

    setQ(qParam);
    setSelectedTag(tagParam);
    setSelectedCategory(categoryParam);
    setPriceMin(pMin);
    setPriceMax(pMax);

    const params = {};
    if (qParam) params.q = qParam;
    if (tagParam) params.tag_id = tagParam;
    if (categoryParam) params.category_id = categoryParam;
    if (pMin) params.price_min = pMin;
    if (pMax) params.price_max = pMax;

    setLoading(true);
    getGames(params)
      .then(response => {
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.results || [];
        setGames(data);
      })
      .catch(error => {
        console.error('Lỗi khi lấy danh sách game:', error);
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const formatVND = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const handleAddToCart = async (id) => {
    try {
      await addToCart(id);
      alert('Đã thêm vào giỏ');
      setCartCount(prev => prev + 1);
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Lỗi khi thêm vào giỏ';
      alert(msg);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    const params = {};
    if (q) params.q = q;  // Tên game vẫn được filter từ Header.js
    if (selectedTag) params.tag_id = selectedTag;
    if (selectedCategory) params.category_id = selectedCategory;
    if (priceMin) params.price_min = priceMin;
    if (priceMax) params.price_max = priceMax;
    setSearchParams(params);
  };

  if (loading) return <div className="text-center py-5 text-light">Đang tải game...</div>;

  return (
    <div>
      <div className="container my-4">

        {/* FILTER BAR */}
        <form onSubmit={handleFilter} className="mb-4 p-3 rounded" style={{ background: '#1b2838' }}>
          <div className="row g-2">
            <div className="col-md-3">
              <select
                className="form-select"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
              >
                <option value="">-- Chọn Category --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={selectedTag}
                onChange={e => setSelectedTag(e.target.value)}
              >
                <option value="">-- Chọn Tag --</option>
                {tags.map(tag => (
                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <input
                type="number"
                value={priceMin}
                onChange={e => setPriceMin(e.target.value)}
                className="form-control"
                placeholder="Giá từ"
              />
            </div>
            <div className="col-md-2">
              <input
                type="number"
                value={priceMax}
                onChange={e => setPriceMax(e.target.value)}
                className="form-control"
                placeholder="Đến"
              />
            </div>
            <div className="col-md-2">
              <button className="btn btn-primary w-100" style={{ background: '#66c0f4', border: 'none', color: '#171a21' }}>
                Lọc
              </button>
            </div>
          </div>
        </form>

        {/* GAME LIST */}
        {games.length === 0 ? (
          <div className="text-center">Không có game để hiển thị.</div>
        ) : (
          <div className="row g-4">
            {games.map(game => (
              <div key={game.id} className="col-12 col-sm-6 col-lg-4">
                <div className="card h-100" style={{ background: '#1b2838', border: 'none', color: '#c7d5e0' }}>
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
                      <button
                        onClick={() => navigate(`/games/${game.id}`)}
                        className="btn btn-primary"
                        style={{ background: '#66c0f4', borderColor: '#66c0f4', color: '#171a21' }}
                      >
                        Xem
                      </button>
                      <button
                        onClick={() => handleAddToCart(game.id)}
                        className="btn btn-outline-light"
                      >
                        Thêm vào giỏ
                      </button>
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
