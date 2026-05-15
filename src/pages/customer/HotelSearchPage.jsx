// pages/customer/HotelSearchPage.jsx

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchHotels } from '../../services/hotelService';
import { useHotel } from '../../contexts/HotelContext';
import './HotelSearchPage.css';

const AMENITIES_LIST = ['WiFi', 'Pool', 'Parking', 'Gym', 'Breakfast', 'Spa', 'Restaurant'];

export default function HotelSearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateHotelBooking } = useHotel();

  // === State cho các giá trị hiển thị trên form (local, chưa apply) ===
  const [localCity, setLocalCity] = useState('');
  const [localCheckInDate, setLocalCheckInDate] = useState('');
  const [localCheckOutDate, setLocalCheckOutDate] = useState('');
  const [localGuests, setLocalGuests] = useState(1);
  const [localMinPrice, setLocalMinPrice] = useState('');
  const [localMaxPrice, setLocalMaxPrice] = useState('');
  const [localAmenities, setLocalAmenities] = useState([]);

  // === State cho các bộ lọc đã được áp dụng (dùng để gọi API) ===
  const [appliedFilters, setAppliedFilters] = useState({
    city: '',
    checkInDate: '',
    checkOutDate: '',
    guests: 1,
    minPrice: '',
    maxPrice: '',
    amenities: [],
  });

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [pagination, setPagination] = useState(null);
  const limit = 10;

  // === Khởi tạo từ URL (chạy 1 lần khi mount) ===
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const cityParam = queryParams.get('city') || '';
    const checkInParam = queryParams.get('checkInDate') || '';
    const checkOutParam = queryParams.get('checkOutDate') || '';
    const guestsParam = queryParams.get('guests') ? Number(queryParams.get('guests')) : 1;
    const minPriceParam = queryParams.get('minPrice') || '';
    const maxPriceParam = queryParams.get('maxPrice') || '';
    const amenitiesParam = queryParams.get('amenities') ? queryParams.get('amenities').split(',') : [];

    // Cập nhật local form
    setLocalCity(cityParam);
    setLocalCheckInDate(checkInParam);
    setLocalCheckOutDate(checkOutParam);
    setLocalGuests(guestsParam);
    setLocalMinPrice(minPriceParam);
    setLocalMaxPrice(maxPriceParam);
    setLocalAmenities(amenitiesParam);

    // Cập nhật appliedFilters để trigger search ngay khi mount
    setAppliedFilters({
      city: cityParam,
      checkInDate: checkInParam,
      checkOutDate: checkOutParam,
      guests: guestsParam,
      minPrice: minPriceParam,
      maxPrice: maxPriceParam,
      amenities: amenitiesParam,
    });
  }, []);

  // === Hàm gọi API dựa trên appliedFilters và page ===
  const performSearch = useCallback(async () => {
    setLoading(true);
    const params = {
      page,
      limit,
      ...(appliedFilters.city && { city: appliedFilters.city }),
      ...(appliedFilters.checkInDate && { checkInDate: appliedFilters.checkInDate }),
      ...(appliedFilters.checkOutDate && { checkOutDate: appliedFilters.checkOutDate }),
      ...(appliedFilters.guests && { guests: appliedFilters.guests }),
      ...(appliedFilters.minPrice && { minPrice: appliedFilters.minPrice }),
      ...(appliedFilters.maxPrice && { maxPrice: appliedFilters.maxPrice }),
      ...(appliedFilters.amenities.length && { amenities: appliedFilters.amenities.join(',') }),
    };

    try {
      const data = await searchHotels(params);
      setHotels(data.hotels);
      setPagination(data.pagination);

      // Cập nhật URL
      const urlParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          urlParams.set(key, value);
        }
      });
      navigate(`?${urlParams.toString()}`, { replace: true });
    } catch (err) {
      console.error(err);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, limit, navigate]);

  // Gọi API mỗi khi appliedFilters hoặc page thay đổi
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // === Xử lý khi nhấn nút Tìm kiếm ===
  const handleSearchClick = () => {
    setPage(1); // reset về trang 1 khi áp dụng bộ lọc mới
    setAppliedFilters({
      city: localCity,
      checkInDate: localCheckInDate,
      checkOutDate: localCheckOutDate,
      guests: localGuests,
      minPrice: localMinPrice,
      maxPrice: localMaxPrice,
      amenities: localAmenities,
    });
  };

  // === Xử lý checkbox tiện ích (local) ===
  const toggleAmenity = (amenity) => {
    setLocalAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  // === Điều hướng sang trang chi tiết ===
  const goToHotelDetail = (hotelId) => {
    updateHotelBooking({
      hotelId,
      checkInDate: appliedFilters.checkInDate,
      checkOutDate: appliedFilters.checkOutDate,
      guests: appliedFilters.guests,
    });
    navigate(`/hotels/${hotelId}`);
  };

  // === Phân trang ===
  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
      setPage(newPage);
    }
  };

  return (
    <div className="hotel-search-page">
      <div className="filters-sidebar">
        <h3>Bộ lọc</h3>
        {/* Nút Tìm kiếm */}
        
        <button className="search-button" onClick={handleSearchClick}>
          Tìm kiếm
        </button>

        <div className="filter-group">
          <label>Thành phố</label>
          <input
            value={localCity}
            onChange={e => setLocalCity(e.target.value)}
            placeholder="VD: Ho Chi Minh"
          />
        </div>

        <div className="filter-group">
          <label>Ngày nhận phòng</label>
          <input
            type="date"
            value={localCheckInDate}
            onChange={e => setLocalCheckInDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Ngày trả phòng</label>
          <input
            type="date"
            value={localCheckOutDate}
            onChange={e => setLocalCheckOutDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Số khách</label>
          <input
            type="number"
            min="1"
            value={localGuests}
            onChange={e => setLocalGuests(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Khoảng giá (VND)</label>
          <div className="price-range">
            <input
              type="number"
              placeholder="Tối thiểu"
              value={localMinPrice}
              onChange={e => setLocalMinPrice(e.target.value)}
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Tối đa"
              value={localMaxPrice}
              onChange={e => setLocalMaxPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Tiện ích</label>
          <div className="amenities-checkbox">
            {AMENITIES_LIST.map(am => (
              <label key={am}>
                <input
                  type="checkbox"
                  checked={localAmenities.includes(am)}
                  onChange={() => toggleAmenity(am)}
                />
                {am}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="results-area">
        {loading && <div className="loading">Đang tìm kiếm...</div>}
        {!loading && hotels.length === 0 && <div className="no-results">Không tìm thấy khách sạn nào.</div>}

        <div className="hotels-grid">
          {hotels.map(hotel => (
            <div key={hotel._id} className="hotel-card" onClick={() => goToHotelDetail(hotel._id)}>
              <img src={hotel.image?.[0]?.url || '/placeholder.jpg'} alt={hotel.name} />
              <div className="hotel-info">
                <h3>{hotel.name}</h3>
                <p className="address">{hotel.address?.street}, {hotel.address?.city}</p>
                <div className="amenities">
                  {hotel.amenities?.slice(0, 3).map((a, i) => (
                    <span key={i}>{a}</span>
                  ))}
                </div>
                <p className="price">
                  Giá từ {hotel.minPrice?.toLocaleString()}đ - {hotel.maxPrice?.toLocaleString()}đ
                </p>
              </div>
            </div>
          ))}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => goToPage(page - 1)}>Trước</button>
            <span>Trang {page} / {pagination.totalPages}</span>
            <button disabled={page === pagination.totalPages} onClick={() => goToPage(page + 1)}>Sau</button>
          </div>
        )}
      </div>
    </div>
  );
}