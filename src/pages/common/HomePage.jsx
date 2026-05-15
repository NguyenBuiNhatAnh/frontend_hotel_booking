// HomePage.jsx
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  const handleExplore = () => {
    navigate('/hotels?page=1&limit=10&guests=1');
  };

  return (
    <div className="home-page">
      {/* HERO MỚI - chỉ có nút khám phá lớn */}
      <section className="hero-simple">
        <div className="container hero-simple-content">
          <h1>Khám phá những khách sạn tốt nhất</h1>
          <p>Đặt phòng dễ dàng, giá ưu đãi, trải nghiệm tuyệt vời</p>
          <button className="btn btn-explore" onClick={handleExplore}>
            ✨ Khám phá ngay ✨
          </button>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <div className="container">
          <div className="section-title">
            <h2>Tại sao chọn chúng tôi?</h2>
            <p>Trải nghiệm đặt phòng nhanh chóng và tiện lợi.</p>
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🏨</div>
              <h3>10.000+ khách sạn</h3>
              <p>Đa dạng lựa chọn từ bình dân đến cao cấp.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Giá tốt nhất</h3>
              <p>Luôn có ưu đãi hấp dẫn cho mọi chuyến đi.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Đặt phòng siêu nhanh</h3>
              <p>Hoàn tất booking chỉ với vài thao tác.</p>
            </div>
          </div>
        </div>
      </section>

      {/* THÔNG TIN GIẢ (stats) */}
      <section className="stats-showcase">
        <div className="container">
          <div className="section-title">
            <h2>Con số ấn tượng</h2>
            <p>Chúng tôi tự hào mang đến những giá trị tốt nhất</p>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-number">1.200+</div>
              <div className="stat-label">Đối tác khách sạn</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">😊</div>
              <div className="stat-number">98%</div>
              <div className="stat-label">Khách hàng hài lòng</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🌏</div>
              <div className="stat-number">35+</div>
              <div className="stat-label">Tỉnh thành phủ sóng</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-number">15 phút</div>
              <div className="stat-label">Xác nhận nhanh chóng</div>
            </div>
          </div>
          <div className="stats-note">* Thống kê cập nhật tháng 05/2026</div>
        </div>
      </section>

      {/* CTA (tùy chọn, nhưng có thể giữ để tăng tỉ lệ chuyển đổi) */}
      <section className="cta">
        <div className="container cta-content">
          <h2>Sẵn sàng cho chuyến đi tiếp theo?</h2>
          <p>Đặt khách sạn ngay hôm nay để nhận ưu đãi hấp dẫn nhất.</p>
          <button className="btn cta-btn" onClick={handleExplore}>
            Khám phá ngay
          </button>
        </div>
      </section>
    </div>
  );
}

export default HomePage;