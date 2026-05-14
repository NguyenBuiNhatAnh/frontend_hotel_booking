// pages/customer/HotelSearchPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchHotels } from '../../services/hotelService';
import { useHotel } from '../../contexts/HotelContext';
import './HotelSearchPage.css';

const AMENITIES_LIST = ['WiFi', 'Pool', 'Parking', 'Gym', 'Breakfast', 'Spa', 'Restaurant'];

export default function HotelSearchPage() {

  const navigate = useNavigate();
  const location = useLocation();

  const { updateHotelBooking } = useHotel();

  const queryParams = new URLSearchParams(location.search);

  // Filter state
  const [city, setCity] = useState(queryParams.get('city') || '');
  const [checkInDate, setCheckInDate] = useState(queryParams.get('checkInDate') || '');
  const [checkOutDate, setCheckOutDate] = useState(queryParams.get('checkOutDate') || '');
  const [guests, setGuests] = useState(queryParams.get('guests') || 1);
  const [minPrice, setMinPrice] = useState(queryParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(queryParams.get('maxPrice') || '');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [pagination, setPagination] = useState(null);

  const limit = 10;

  // Load amenities from URL
  useEffect(() => {
    const amenitiesParam = queryParams.get('amenities');

    if (amenitiesParam) {
      setSelectedAmenities(amenitiesParam.split(','));
    }
  }, []);

  const handleSearch = async (newPage = 1) => {

    setLoading(true);

    const params = {
      page: newPage,
      limit,
      ...(city && { city }),
      ...(checkInDate && { checkInDate }),
      ...(checkOutDate && { checkOutDate }),
      ...(guests && { guests }),
      ...(minPrice && { minPrice }),
      ...(maxPrice && { maxPrice }),
      ...(selectedAmenities.length && {
        amenities: selectedAmenities.join(',')
      })
    };

    try {

      const data = await searchHotels(params);

      setHotels(data.hotels);
      setPagination(data.pagination);
      setPage(newPage);

      // update url
      const urlParams = new URLSearchParams();

      Object.entries(params).forEach(([k, v]) => {
        urlParams.set(k, v);
      });

      navigate(`?${urlParams.toString()}`, { replace: true });

    } catch (err) {

      console.error(err);
      setHotels([]);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch(1);
  }, [
    city,
    checkInDate,
    checkOutDate,
    guests,
    minPrice,
    maxPrice,
    selectedAmenities
  ]);

  const toggleAmenity = (amenity) => {

    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  // ✅ SAVE TO CONTEXT HERE
  const goToHotelDetail = (hotelId) => {

    updateHotelBooking({
      hotelId,
      checkInDate,
      checkOutDate,
      guests,
    });

    navigate(`/hotels/${hotelId}`);
  };

  return (
    <div className="hotel-search-page">

      <div className="filters-sidebar">

        <h3>Bộ lọc</h3>

        <div className="filter-group">
          <label>Thành phố</label>

          <input
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="VD: Ho Chi Minh"
          />
        </div>

        <div className="filter-group">
          <label>Ngày nhận phòng</label>

          <input
            type="date"
            value={checkInDate}
            onChange={e => setCheckInDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Ngày trả phòng</label>

          <input
            type="date"
            value={checkOutDate}
            onChange={e => setCheckOutDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Số khách</label>

          <input
            type="number"
            min="1"
            value={guests}
            onChange={e => setGuests(e.target.value)}
          />
        </div>

        <div className="filter-group">

          <label>Khoảng giá (VND)</label>

          <div className="price-range">

            <input
              type="number"
              placeholder="Tối thiểu"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
            />

            <span>-</span>

            <input
              type="number"
              placeholder="Tối đa"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
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
                  checked={selectedAmenities.includes(am)}
                  onChange={() => toggleAmenity(am)}
                />

                {am}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="results-area">

        {loading && (
          <div className="loading">
            Đang tìm kiếm...
          </div>
        )}

        {!loading && hotels.length === 0 && (
          <div className="no-results">
            Không tìm thấy khách sạn nào.
          </div>
        )}

        <div className="hotels-grid">

          {hotels.map(hotel => (

            <div
              key={hotel._id}
              className="hotel-card"
              onClick={() => goToHotelDetail(hotel._id)}
            >

              <img
                src={hotel.image?.[0]?.url || '/placeholder.jpg'}
                alt={hotel.name}
              />

              <div className="hotel-info">

                <h3>{hotel.name}</h3>

                <p className="address">
                  {hotel.address?.street}, {hotel.address?.city}
                </p>

                <div className="amenities">

                  {hotel.amenities?.slice(0, 3).map((a, i) => (
                    <span key={i}>{a}</span>
                  ))}
                </div>

                <p className="price">
                  Giá từ {hotel.minPrice?.toLocaleString()}đ
                  {' - '}
                  {hotel.maxPrice?.toLocaleString()}đ
                </p>
              </div>
            </div>
          ))}
        </div>

        {pagination && pagination.totalPages > 1 && (

          <div className="pagination">

            <button
              disabled={page === 1}
              onClick={() => handleSearch(page - 1)}
            >
              Trước
            </button>

            <span>
              Trang {page} / {pagination.totalPages}
            </span>

            <button
              disabled={page === pagination.totalPages}
              onClick={() => handleSearch(page + 1)}
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}