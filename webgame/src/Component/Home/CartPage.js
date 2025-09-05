import React, { useEffect, useState } from "react";
import { getCartItems, removeFromCart, createOrder, createMomoPayment, createVnpayPayment } from "../../configs/Api";

function CartPage() {

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
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } catch (e) {
      console.error("Lỗi khi xóa game:", e);
    }
  };

  // Mua toàn bộ bằng MoMo
  const buyAllWithMomo = async () => {
    if (cartItems.length === 0) return;
    try {
      const ids = cartItems.map((item) => item.game);
      const orderRes = await createOrder(ids);
      const orderId = orderRes.data.id;
      const payRes = await createMomoPayment(orderId);
      window.location.href = payRes.data.payUrl;
    } catch (e) {
      console.error('MoMo payment error:', e);
      alert('Không thể thanh toán MoMo');
    }
  };

  // Mua toàn bộ bằng VNPAY
  const buyAllWithVnpay = async () => {
    if (cartItems.length === 0) return;
    try {
      const ids = cartItems.map((item) => item.game);
      const orderRes = await createOrder(ids);
      const orderId = orderRes.data.id;
      const payRes = await createVnpayPayment(orderId);
      window.location.href = payRes.data.payment_url;
    } catch (e) {
      console.error('VNPAY payment error:', e);
      alert('Không thể thanh toán VNPAY');
    }
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
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
            <div>
              Tổng:{" "}
              <strong>
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(total)}
              </strong>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-warning" onClick={buyAllWithVnpay}>Mua bằng VNPAY</button>
              <button className="btn btn-primary" onClick={buyAllWithMomo}>Mua bằng MoMo</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CartPage;
