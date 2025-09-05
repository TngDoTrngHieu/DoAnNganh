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
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const navigate = useNavigate();
    const { setCartCount } = useContext(AuthContext);

    // Load tags và categories
    useEffect(() => {
        getTags().then(res => setTags(res.data)).catch(() => setTags([]));
        getCategories().then(res => setCategories(res.data)).catch(() => setCategories([]));
    }, []);

    // Hàm load game, reset = true khi filter/search thay đổi
    const loadGames = async (reset = false) => {
        setLoading(true);
        try {
            const params = {
                q,
                tag_id: selectedTag,
                category_id: selectedCategory,
                price_min: priceMin,
                price_max: priceMax,
                page
            };

            const response = await getGames(params);
            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.results || [];

            if (reset) setGames(data);
            else setGames(prev => [...prev, ...data]);

            if (data.length === 0) setHasMore(false);
            else setHasMore(true);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách game:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load game khi searchParams thay đổi (filter/search)
    useEffect(() => {
        setQ(searchParams.get('q') || '');
        setSelectedTag(searchParams.get('tag_id') || '');
        setSelectedCategory(searchParams.get('category_id') || '');
        setPriceMin(searchParams.get('price_min') || '');
        setPriceMax(searchParams.get('price_max') || '');
        setPage(1);
        loadGames(true);
    }, [searchParams]);

    // Load thêm page khi page thay đổi
    useEffect(() => {
        if (page > 1) loadGames();
    }, [page]);

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
        if (q) params.q = q;
        if (selectedTag) params.tag_id = selectedTag;
        if (selectedCategory) params.category_id = selectedCategory;
        if (priceMin) params.price_min = priceMin;
        if (priceMax) params.price_max = priceMax;
        setSearchParams(params);
    };

    const loadMore = () => {
        if (hasMore && !loading) setPage(prev => prev + 1);
    };

    if (loading && games.length === 0) return <div className="text-center py-5 text-light">Đang tải game...</div>;

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
                    <div className="text-center text-light">Không có game để hiển thị.</div>
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

                {hasMore >0 && (
                    <div className="text-center my-4">
                        <button className="btn btn-primary" onClick={loadMore}>
                            {loading ? 'Đang tải...' : 'Xem thêm'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default HomePage;
