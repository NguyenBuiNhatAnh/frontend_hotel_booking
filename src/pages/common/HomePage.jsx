import './HomePage.css';

function HomePage() {
  const hotels = [
    {
      id: 1,
      name: 'Sunset Resort',
      location: 'Đà Nẵng',
      price: '1.200.000đ / đêm',
      image:
        'https://images.unsplash.com/photo-1566073771259-6a8506099945',
    },
    {
      id: 2,
      name: 'Ocean View Hotel',
      location: 'Nha Trang',
      price: '950.000đ / đêm',
      image:
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
    },
    {
      id: 3,
      name: 'Luxury Palace',
      location: 'Phú Quốc',
      price: '2.500.000đ / đêm',
      image:
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
    },
  ];

  return (
    <div className="home-page">
      {/* HERO */}
      <section className="hero">
        <div className="hero-overlay"></div>

        <div className="container hero-content">
          <div className="hero-text">
            <span className="hero-badge">
              ✈️ Hệ thống đặt khách sạn số 1
            </span>

            <h1>
              Tìm khách sạn lý tưởng cho chuyến đi của bạn
            </h1>

            <p>
              Khám phá hàng nghìn khách sạn, resort và
              homestay với mức giá tốt nhất.
            </p>

            {/* SEARCH */}
            <div className="hero-search">
              <div className="search-group">
                <label>Địa điểm</label>

                <input
                  type="text"
                  placeholder="Bạn muốn đi đâu?"
                />
              </div>

              <div className="search-group">
                <label>Check in</label>

                <input type="date" />
              </div>

              <div className="search-group">
                <label>Check out</label>

                <input type="date" />
              </div>

              <div className="search-group">
                <label>Số khách</label>

                <select>
                  <option>1 khách</option>
                  <option>2 khách</option>
                  <option>3 khách</option>
                  <option>4+ khách</option>
                </select>
              </div>

              <button className="btn btn-primary search-btn">
                Tìm kiếm
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <div className="container">
          <div className="section-title">
            <h2>Tại sao chọn chúng tôi?</h2>

            <p>
              Trải nghiệm đặt phòng nhanh chóng và tiện lợi.
            </p>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🏨</div>

              <h3>10.000+ khách sạn</h3>

              <p>
                Đa dạng lựa chọn từ bình dân đến cao cấp.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💰</div>

              <h3>Giá tốt nhất</h3>

              <p>
                Luôn có ưu đãi hấp dẫn cho mọi chuyến đi.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>

              <h3>Đặt phòng siêu nhanh</h3>

              <p>
                Hoàn tất booking chỉ với vài thao tác.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOTELS */}
      <section className="popular-hotels">
        <div className="container">
          <div className="section-title">
            <h2>Khách sạn nổi bật</h2>

            <p>
              Những khách sạn được khách hàng yêu thích.
            </p>
          </div>

          <div className="hotel-grid">
            {hotels.map((hotel) => (
              <div className="hotel-card" key={hotel.id}>
                <div className="hotel-image">
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                  />

                  <span className="hotel-tag">
                    Nổi bật
                  </span>
                </div>

                <div className="hotel-info">
                  <h3>{hotel.name}</h3>

                  <p className="hotel-location">
                    📍 {hotel.location}
                  </p>

                  <div className="hotel-bottom">
                    <div>
                      <small>Chỉ từ</small>

                      <h4>{hotel.price}</h4>
                    </div>

                    <button className="btn btn-primary">
                      Đặt ngay
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container cta-content">
          <h2>Sẵn sàng cho chuyến đi tiếp theo?</h2>

          <p>
            Đặt khách sạn ngay hôm nay để nhận ưu đãi
            hấp dẫn nhất.
          </p>

          <button className="btn cta-btn">
            Khám phá ngay
          </button>
        </div>
      </section>
    </div>
  );
}

export default HomePage;