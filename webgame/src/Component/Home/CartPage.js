import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGames } from '../../configs/Api';
import { removeFromCart } from '../../utils/cartUtils';

function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]); // array of game ids
  const [games, setGames] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart');
      const ids = raw ? JSON.parse(raw) : [];
      setCart(Array.isArray(ids) ? ids : []);
    } catch { setCart([]); }
  }, []);

  useEffect(() => {
    if (cart.length === 0) { setGames([]); return; }
    // fetch all games then filter client (simple); or you can fetch by ids with backend support
    getGames().then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
      setGames(data.filter(g => cart.includes(g.id)));
    }).catch(() => setGames([]));
  }, [cart]);

  const removeItem = (id) => {
    if (removeFromCart(id)) {
      const next = cart.filter(x => String(x) !== String(id));
      setCart(next);
    }
  };

  const checkout = () => {
    if (cart.length === 0) return;
    navigate('/checkout?ids=' + encodeURIComponent(JSON.stringify(cart)));
  };

  const total = games.reduce((acc, g) => acc + (Number(g.price) || 0), 0);

  return (
    <div className="container py-4">
      <h2>Giỏ hàng</h2>
      {games.length === 0 ? (
        <div>Giỏ hàng trống</div>
      ) : (
        <>
          <ul className="list-group mb-3">
            {games.map(g => (
              <li key={g.id} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <strong>{g.title}</strong>
                </div>
                <div>
                  <span className="me-3">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(g.price) || 0)}</span>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => removeItem(g.id)}>Xóa</button>
                </div>
              </li>
            ))}
          </ul>
          <div className="d-flex justify-content-between align-items-center">
            <div>Tổng: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}</strong></div>
            <button className="btn btn-primary" onClick={checkout}>Thanh toán</button>
          </div>
        </>
      )}
    </div>
  );
}

export default CartPage;


