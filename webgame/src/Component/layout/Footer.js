import React from 'react';

function Footer() {
  return (
    <footer className="text-center py-4" style={{ background: '#171a21', color: '#c7d5e0', marginTop: 'auto' }}>
      <div className="container">
        <div className="row">
          <div className="col-md-4 mb-3">
            <h5 style={{ color: '#66c0f4' }}>Về Steam</h5>
            <p className="small">
              Nền tảng game hàng đầu với hàng nghìn tựa game chất lượng cao. 
              Khám phá, mua sắm và tận hưởng những trải nghiệm gaming tuyệt vời.
            </p>
          </div>
          
          <div className="col-md-4 mb-3">
            <h5 style={{ color: '#66c0f4' }}>Liên kết nhanh</h5>
            <ul className="list-unstyled">
              <li><a href="/" style={{ color: '#c7d5e0', textDecoration: 'none' }}>Trang chủ</a></li>
              <li><a href="/categories" style={{ color: '#c7d5e0', textDecoration: 'none' }}>Danh mục</a></li>
              <li><a href="/tags" style={{ color: '#c7d5e0', textDecoration: 'none' }}>Tags</a></li>
              <li><a href="/cart" style={{ color: '#c7d5e0', textDecoration: 'none' }}>Giỏ hàng</a></li>
            </ul>
          </div>
          
          <div className="col-md-4 mb-3">
            <h5 style={{ color: '#66c0f4' }}>Hỗ trợ</h5>
            <ul className="list-unstyled">
              <li><a href="/login" style={{ color: '#c7d5e0', textDecoration: 'none' }}>Đăng nhập</a></li>
              <li><a href="/register" style={{ color: '#c7d5e0', textDecoration: 'none' }}>Đăng ký</a></li>
              <li><span style={{ color: '#c7d5e0' }}>Email: support@steam.com</span></li>
              <li><span style={{ color: '#c7d5e0' }}>Hotline: 1900-xxxx</span></li>
            </ul>
          </div>
        </div>
        
        <hr style={{ borderColor: '#66c0f4', margin: '2rem 0 1rem 0' }} />
        
        <div className="row align-items-center">
          <div className="col-md-6 text-md-start">
            <p className="mb-0">
              © {new Date().getFullYear()} Steam Clone. 
            </p>
          </div>
          
          
        </div>
      </div>
    </footer>
  );
}

export default Footer;
