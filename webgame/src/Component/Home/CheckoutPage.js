import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createOrder, createMomoPayment } from '../../configs/Api';
import { clearCartItems } from '../../utils/cartUtils';

function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get('ids');
    let ids = [];
    try { ids = raw ? JSON.parse(raw) : []; } catch { ids = []; }

    const run = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }
      if (!Array.isArray(ids) || ids.length === 0) {
        setError('Không có sản phẩm để thanh toán');
        setLoading(false);
        return;
      }
      try {
        const orderRes = await createOrder(ids);
        const orderId = orderRes?.data?.id;
        if (!orderId) throw new Error('Tạo đơn thất bại');
        const payRes = await createMomoPayment(orderId);
        const payUrl = payRes?.data?.payUrl;
        if (!payUrl) throw new Error('Không nhận được payUrl');
        // làm sạch giỏ hàng với các id này
        clearCartItems(ids);
        window.location.href = payUrl;
      } catch (e) {
        const status = e?.response?.status;
        if (status === 401) {
          navigate('/login');
          return;
        }
        setError(e?.response?.data?.error || e?.message || 'Lỗi thanh toán');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [location.search]);

  if (loading) return <div className="container py-5">Đang xử lý thanh toán...</div>;
  if (error) return <div className="container py-5 text-danger">{error}</div>;
  return null;
}

export default CheckoutPage;


