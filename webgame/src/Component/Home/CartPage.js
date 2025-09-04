import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCartItems, removeFromCart } from "../../configs/Api";

function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load giỏ hàng khi vào trang
  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      try {
        const res = await getCartItems();
        setCartItems(res.data.items || []);
      } catch (e) {
        console.error("Lỗi khi load giỏ hàng:", e);
        setCartItems([]);
      }
      setLoading(false);
    };
    fetchCart();
  }, []);

  // Xóa item khỏi giỏ
  const handleRemove = async (gameId) => {
    try {
      await removeFromCart(gameId);
      setCartItems((prev) => prev.filter((item) => item.game !== gameId));
    } catch (e) {
      console.error("Lỗi khi xóa game:", e);
    }
  };

  // Thanh toán: chuyển sang trang checkout
  const checkout = () => {
    if (cartItems.length === 0) return;
    const ids = cartItems.map((item) => item.game);
    navigate("/checkout?ids=" + encodeURIComponent(JSON.stringify(ids)));
  };

  // Tổng tiền
  const total = cartItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);

  return (
    <div className="container py-4">
      <h2>Giỏ hàng</h2>
      {loading ? (
        <div>Đang tải...</div>
      ) : cartItems.length === 0 ? (
        <div>Giỏ hàng trống</div>
      ) : (
        <>
          <ul className="list-group mb-3">
            {cartItems.map((item) => (
              <li
                key={item.id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <div>
                  <strong>{item.game_title}</strong>
                </div>
                <div>
                  <span className="me-3">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(Number(item.price) || 0)}
                  </span>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleRemove(item.game)}
                  >
                    Xóa
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              Tổng:{" "}
              <strong>
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(total)}
              </strong>
            </div>
            <button className="btn btn-primary" onClick={checkout}>
              Thanh toán
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CartPage;
