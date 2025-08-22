import React from 'react';
import { Link } from 'react-router-dom';

function ThankYouPage() {
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


