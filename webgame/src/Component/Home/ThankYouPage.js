
import React, { useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../User/AuthContext';

function ThankYouPage() {
  const { refreshCart } = useContext(AuthContext);

  useEffect(() => {
    // Refresh giỏ hàng khi quay lại từ thanh toán
    refreshCart();
  }, [refreshCart]);

  return (
    <div className="container py-5 text-center">
      <h2>Cảm ơn bạn đã thanh toán!</h2>
      <p>Nếu đơn đã được xác nhận, bạn có thể quay lại trang chi tiết game để tải file.</p>
      <div className="mt-4">
        <Link to="/" className="btn btn-primary">
          Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
}

export default ThankYouPage;


