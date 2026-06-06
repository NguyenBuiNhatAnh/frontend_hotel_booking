// pages/customer/HotelSearchPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchHotels } from '../../services/hotelService';
import axiosInstance from '../../services/axiosInstance';
import { useHotel } from '../../contexts/HotelContext';
import './HotelSearchPage.css';

const AMENITIES_LIST = ['WiFi', 'Pool', 'Parking', 'Gym', 'Breakfast', 'Spa', 'Restaurant'];

// Tạo ảnh thumbnail từ URL gốc (hỗ trợ Cloudinary, Unsplash, Pexels)
const getThumbnailUrl = (url) => {
  if (!url) return '/placeholder.jpg';
  
  // Cloudinary: thêm w_400,h_250,c_fill
  if (url.includes('res.cloudinary.com')) {
    return url.replace('/upload/', '/upload/w_400,h_250,c_fill/');
  }
  
  // Unsplash: thêm query ?w=400&h=250&fit=crop
  if (url.includes('unsplash.com')) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('w', '400');
      urlObj.searchParams.set('h', '250');
      urlObj.searchParams.set('fit', 'crop');
      return urlObj.toString();
    } catch {
      return url;
    }
  }
  
  // Pexels: tương tự Unsplash
  if (url.includes('pexels.com')) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('w', '400');
      urlObj.searchParams.set('h', '250');
      urlObj.searchParams.set('fit', 'crop');
      return urlObj.toString();
    } catch {
      return url;
    }
  }
  
  return url;
};

// Component hiển thị sao
const RatingStars = ({ rating }) => {
  const fullStars = Math.round(rating || 0);
  if (!rating || rating === 0) return null;
  return (
    <div className="rating-stars">
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} className={star <= fullStars ? 'star filled' : 'star'}>★</span>
      ))}
      <span className="rating-value">{rating.toFixed(1)}</span>
    </div>
  );
};

export default function HotelSearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateHotelBooking } = useHotel();

  // Local form state
  const [localCity, setLocalCity] = useState('');
  const [localCheckInDate, setLocalCheckInDate] = useState('');
  const [localCheckOutDate, setLocalCheckOutDate] = useState('');
  const [localGuests, setLocalGuests] = useState(1);
  const [localMinPrice, setLocalMinPrice] = useState('');
  const [localMaxPrice, setLocalMaxPrice] = useState('');
  const [localAmenities, setLocalAmenities] = useState([]);
  const [localRating, setLocalRating] = useState('');

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    city: '',
    checkInDate: '',
    checkOutDate: '',
    guests: 1,
    minPrice: '',
    maxPrice: '',
    amenities: [],
    rating: '',
  });

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [pagination, setPagination] = useState(null);
  const limit = 12;

  useEffect(() => {
    let mounted = true;

    const fetchCities = async () => {
      setCitiesLoading(true);
      try {
        const res = await axiosInstance.get('/locations/cities');
        if (mounted) setCities(res.data.data || []);
      } catch (err) {
        console.error('Failed to load cities', err);
        if (mounted) setCities([]);
      } finally {
        if (mounted) setCitiesLoading(false);
      }
    };

    fetchCities();

    return () => {
      mounted = false;
    };
  }, []);

  // Đọc URL params khi mount
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const cityParam = queryParams.get('city') || '';
    const checkInParam = queryParams.get('checkInDate') || '';
    const checkOutParam = queryParams.get('checkOutDate') || '';
    const guestsParam = queryParams.get('guests') ? Number(queryParams.get('guests')) : 1;
    const minPriceParam = queryParams.get('minPrice') || '';
    const maxPriceParam = queryParams.get('maxPrice') || '';
    const amenitiesParam = queryParams.get('amenities') ? queryParams.get('amenities').split(',') : [];
    const ratingParam = queryParams.get('rating') || '';

    setLocalCity(cityParam);
    setLocalCheckInDate(checkInParam);
    setLocalCheckOutDate(checkOutParam);
    setLocalGuests(guestsParam);
    setLocalMinPrice(minPriceParam);
    setLocalMaxPrice(maxPriceParam);
    setLocalAmenities(amenitiesParam);
    setLocalRating(ratingParam);

    setAppliedFilters({
      city: cityParam,
      checkInDate: checkInParam,
      checkOutDate: checkOutParam,
      guests: guestsParam,
      minPrice: minPriceParam,
      maxPrice: maxPriceParam,
      amenities: amenitiesParam,
      rating: ratingParam,
    });
  }, []);

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
      ...(appliedFilters.rating && { rating: appliedFilters.rating }),
    };

    try {
      const data = await searchHotels(params);
      setHotels(data.hotels);
      setPagination(data.pagination);
      // Update URL
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

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleSearchClick = () => {
    setPage(1);
    setAppliedFilters({
      city: localCity,
      checkInDate: localCheckInDate,
      checkOutDate: localCheckOutDate,
      guests: localGuests,
      minPrice: localMinPrice,
      maxPrice: localMaxPrice,
      amenities: localAmenities,
      rating: localRating,
    });
  };

  const toggleAmenity = (amenity) => {
    setLocalAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const goToHotelDetail = (hotelId) => {
    updateHotelBooking({
      hotelId,
      checkInDate: appliedFilters.checkInDate,
      checkOutDate: appliedFilters.checkOutDate,
      guests: appliedFilters.guests,
    });
    navigate(`/hotels/${hotelId}`);
  };

  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
      setPage(newPage);
    }
  };

  return (
    <div className="hotel-search-page">
      <div className="filters-sidebar">
        <h3>Bộ lọc</h3>
        <button className="search-button" onClick={handleSearchClick}>
          Tìm kiếm
        </button>

        <div className="filter-group">
          <label>Thành phố</label>
          <select value={localCity} onChange={e => setLocalCity(e.target.value)} disabled={citiesLoading}>
            <option value="">{citiesLoading ? 'Đang tải tỉnh/thành...' : 'Tất cả tỉnh/thành'}</option>
            {cities.map(city => (
              <option key={city.codeName} value={city.name}>
                {city.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Ngày nhận phòng</label>
          <input type="date" value={localCheckInDate} onChange={e => setLocalCheckInDate(e.target.value)} />
        </div>

        <div className="filter-group">
          <label>Ngày trả phòng</label>
          <input type="date" value={localCheckOutDate} onChange={e => setLocalCheckOutDate(e.target.value)} />
        </div>

        <div className="filter-group">
          <label>Số khách</label>
          <input type="number" min="1" value={localGuests} onChange={e => setLocalGuests(Number(e.target.value))} />
        </div>

        <div className="filter-group">
          <label>Khoảng giá (VND)</label>
          <div className="price-range">
            <input type="number" placeholder="Tối thiểu" value={localMinPrice} onChange={e => setLocalMinPrice(e.target.value)} />
            <span>-</span>
            <input type="number" placeholder="Tối đa" value={localMaxPrice} onChange={e => setLocalMaxPrice(e.target.value)} />
          </div>
        </div>

        <div className="filter-group">
          <label>Tiện ích</label>
          <div className="amenities-checkbox">
            {AMENITIES_LIST.map(am => (
              <label key={am}>
                <input type="checkbox" checked={localAmenities.includes(am)} onChange={() => toggleAmenity(am)} />
                {am}
              </label>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Đánh giá sao</label>
          <select value={localRating} onChange={e => setLocalRating(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao trở lên</option>
            <option value="3">3 sao trở lên</option>
            <option value="2">2 sao trở lên</option>
            <option value="1">1 sao trở lên</option>
          </select>
        </div>
      </div>

      <div className="results-area">
        {loading && <div className="loading">Đang tìm kiếm...</div>}
        {!loading && hotels.length === 0 && <div className="no-results">Không tìm thấy khách sạn nào.</div>}

        <div className="hotels-grid">
          {hotels.map(hotel => (
            <div key={hotel._id} className="hotel-card" onClick={() => goToHotelDetail(hotel._id)}>
              <img loading="lazy" src={getThumbnailUrl(hotel.image?.[0]?.url)} alt={hotel.name} />
              <div className="hotel-info">
                <h3>{hotel.name}</h3>
                <p className="address">{hotel.address?.street}, {hotel.address?.ward}, {hotel.address?.city}</p>
                <div className="amenities">
                  {hotel.amenities?.slice(0, 3).map((a, i) => <span key={i}>{a}</span>)}
                </div>
                <RatingStars rating={hotel.avgRating} />
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
