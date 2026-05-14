import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../services/axiosInstance';
import { toast } from 'react-toastify';
import './MyBookingsPage.css';

const STATUS_CONFIG = {
  pending: {
    label: 'Chờ xác nhận',
    color: 'status-pending',
    icon: '🕐',
  },
  confirmed: {
    label: 'Đã xác nhận',
    color: 'status-confirmed',
    icon: '✅',
  },
  checked_in: {
    label: 'Đã check-in',
    color: 'status-checked-in',
    icon: '🏨',
  },
  checked_out: {
    label: 'Đã check-out',
    color: 'status-checked-out',
    icon: '🚪',
  },
  completed: {
    label: 'Hoàn thành',
    color: 'status-completed',
    icon: '🎉',
  },
  canceled: {
    label: 'Đã hủy',
    color: 'status-canceled',
    icon: '❌',
  },
};

const FILTER_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'checked_in', label: 'Đã check-in' },
  { value: 'checked_out', label: 'Đã check-out' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'canceled', label: 'Đã hủy' },
];

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const formatPrice = (n) =>
  n?.toLocaleString('vi-VN') + '₫';

const nightCount = (checkIn, checkOut) => {
  const diff =
    new Date(checkOut) - new Date(checkIn);
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

function BookingCard({ booking }) {
  const hotel = booking.hotel;
  const mainImage = hotel.image?.[0]?.url;
  const status = STATUS_CONFIG[booking.status] || {};
  const nights = nightCount(
    booking.checkInDate,
    booking.checkOutDate
  );

  return (
    <div className={`booking-card ${booking.status === 'canceled' ? 'canceled' : ''}`}>
      {/* Hotel image */}
      <div className="booking-image">
        {mainImage ? (
          <img src={mainImage} alt={hotel.name} />
        ) : (
          <div className="no-image">🏨</div>
        )}
        <span className={`status-badge ${status.color}`}>
          {status.icon} {status.label}
        </span>
      </div>

      {/* Content */}
      <div className="booking-content">
        <div className="booking-header">
          <div>
            <h3 className="hotel-name">{hotel.name}</h3>
            <p className="hotel-address">
              📍 {hotel.address.street}, {hotel.address.ward}, {hotel.address.city}
            </p>
          </div>
          <div className="booking-id">
            #{booking._id.slice(-6).toUpperCase()}
          </div>
        </div>

        {/* Dates */}
        <div className="booking-dates">
          <div className="date-block">
            <span className="date-label">Check-in</span>
            <span className="date-value">
              {formatDate(booking.checkInDate)}
            </span>
          </div>
          <div className="nights-divider">
            <span>{nights}</span>
            <small>đêm</small>
          </div>
          <div className="date-block">
            <span className="date-label">Check-out</span>
            <span className="date-value">
              {formatDate(booking.checkOutDate)}
            </span>
          </div>
        </div>

        {/* Rooms */}
        <div className="booking-rooms">
          {booking.rooms.map((r) => (
            <div key={r._id} className="room-item">
              <span>🛏 {r.room.name}</span>
              <span>x{r.quantity}</span>
              <span className="room-price">
                {formatPrice(r.pricePerNight)}/đêm
              </span>
            </div>
          ))}
        </div>

        {/* Services */}
        {booking.services.length > 0 && (
          <div className="booking-services">
            {booking.services.map((s) => (
              <span key={s._id} className="service-tag">
                ✨ {s.name}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="booking-footer">
          <div className="booking-meta">
            <span>👥 {booking.guests} khách</span>
            <span
              className={`payment-status ${booking.paymentStatus === 'paid' ? 'paid' : 'unpaid'}`}
            >
              {booking.paymentStatus === 'paid'
                ? '💳 Đã thanh toán'
                : '⏳ Chưa thanh toán'}
            </span>
          </div>
          <div className="total-price">
            {formatPrice(booking.totalPrice)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyBookingsPage() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('');
  const [pagination, setPagination] = useState(null);

  const fetchBookings = async (status = '') => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;

      const res = await axiosInstance.get(
        '/bookings/my-bookings',
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );

      setBookings(res.data.data.bookings);
      setPagination(res.data.data.pagination);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Không thể tải danh sách booking!'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(activeStatus);
  }, [activeStatus]);

  return (
    <div className="my-bookings-page">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <h1>Booking của tôi</h1>
          <p>Quản lý tất cả các đặt phòng của bạn</p>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              className={`filter-tab ${activeStatus === tab.value ? 'active' : ''}`}
              onClick={() => setActiveStatus(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Đang tải danh sách booking...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🏨</span>
            <h3>Chưa có booking nào</h3>
            <p>Hãy đặt phòng để bắt đầu hành trình của bạn!</p>
          </div>
        ) : (
          <>
            <div className="bookings-count">
              Tìm thấy{' '}
              <strong>{pagination?.total || bookings.length}</strong>{' '}
              booking
            </div>
            <div className="bookings-list">
              {bookings.map((b) => (
                <BookingCard key={b._id} booking={b} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
