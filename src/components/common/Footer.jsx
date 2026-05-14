import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#1e293b', color: 'white', padding: '40px 0', marginTop: '50px' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        
        {/* Cột 1: Thông tin chung */}
        <div>
          <h3 style={{ color: 'var(--primary-light)' }}>LUXURYSTAY</h3>
          <p style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
            Hệ thống đặt phòng khách sạn trực tuyến hàng đầu, mang lại trải nghiệm tuyệt vời cho kỳ nghỉ của bạn.
          </p>
        </div>

        {/* Cột 2: Điều hướng nhanh */}
        <div>
          <h4>Khám phá</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li><Link to="/hotels" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Danh sách khách sạn</Link></li>
            <li><Link to="/promotions" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Ưu đãi đặc biệt</Link></li>
            <li><Link to="/blogs" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Cẩm nang du lịch</Link></li>
          </ul>
        </div>

        {/* Cột 3: Hỗ trợ */}
        <div>
          <h4>Hỗ trợ</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li><Link to="/faq" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Câu hỏi thường gặp</Link></li>
            <li><Link to="/policy" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Chính sách bảo mật</Link></li>
            <li><Link to="/terms" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Điều khoản sử dụng</Link></li>
          </ul>
        </div>

        {/* Cột 4: Liên hệ */}
        <div>
          <h4>Liên hệ</h4>
          <p style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
            Email: support@luxurystay.com<br/>
            Hotline: 1900 1234<br/>
            Địa chỉ: Quận 1, TP. Hồ Chí Minh
          </p>
        </div>
      </div>
      
      <hr style={{ border: '0.1px solid #475569', margin: '30px 0' }} />
      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
        © 2026 LuxuryStay Project. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;