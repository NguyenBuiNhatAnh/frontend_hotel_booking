// MyBookingsPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../services/axiosInstance';
import { toast } from 'react-toastify';
import './MyBookingsPage.css';

const STATUS_CONFIG = {
  pending: { label: 'Chờ xác nhận', color: 'status-pending', icon: '🕐' },
  confirmed: { label: 'Đã xác nhận', color: 'status-confirmed', icon: '✅' },
  checked_in: { label: 'Đã check-in', color: 'status-checked-in', icon: '🏨' },
  checked_out: { label: 'Đã check-out', color: 'status-checked-out', icon: '🚪' },
  completed: { label: 'Hoàn thành', color: 'status-completed', icon: '🎉' },
  canceled: { label: 'Đã hủy', color: 'status-canceled', icon: '❌' },
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
  iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '--/--/----';

const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('vi-VN') : '--/--/---- --:--';

const formatPrice = (n) => (n != null ? n.toLocaleString('vi-VN') + '₫' : '0₫');

const nightCount = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  return Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
};

const getThumbnailUrl = (url) => {
  if (!url) return '/placeholder.jpg';
  if (url.includes('res.cloudinary.com')) {
    return url.replace('/upload/', '/upload/w_300,h_200,c_fill/');
  }
  if (url.includes('unsplash.com') || url.includes('pexels.com')) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('w', '300');
      urlObj.searchParams.set('h', '200');
      urlObj.searchParams.set('fit', 'crop');
      return urlObj.toString();
    } catch {
      return url;
    }
  }
  return url;
};

// ========== MODAL ĐÁNH GIÁ ==========
function ReviewModal({ booking, existingReview, onClose, onSubmit }) {
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) return toast.error('Vui lòng nhập nhận xét');
    setSubmitting(true);
    await onSubmit({ rating, comment, reviewId: existingReview?._id });
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="booking-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>{existingReview ? 'Cập nhật đánh giá' : 'Đánh giá khách sạn'}</h2>
        <p style={{ color: '#888', marginBottom: 16 }}>
          {booking?.hotel?.name || 'Khách sạn không xác định'}
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => setRating(star)}
              style={{ fontSize: 32, cursor: 'pointer', color: star <= rating ? '#f5a623' : '#ddd' }}
            >
              ★
            </span>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn..."
          rows={4}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 8,
            border: '1px solid #e0e0dc', fontSize: 14, resize: 'vertical',
            fontFamily: 'inherit', boxSizing: 'border-box'
          }}
        />

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn-detail" onClick={onClose} style={{ flex: 1 }}>Hủy</button>
          <button
            className="btn-payment"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ flex: 1 }}
          >
            {submitting ? 'Đang gửi...' : existingReview ? 'Cập nhật' : 'Gửi đánh giá'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== MODAL CHI TIẾT BOOKING ==========
function BookingDetailModal({ booking, onClose }) {
  if (!booking) return null;
  const hotel = booking.hotel;
  const nights = nightCount(booking.checkInDate, booking.checkOutDate);

  // Trường hợp khách sạn bị xóa
  if (!hotel) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="booking-detail-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>✕</button>
          <h2>Chi tiết đặt phòng</h2>
          <div className="detail-section">
            <div className="detail-row"><strong>Mã booking:</strong> {booking._id}</div>
            <div className="detail-row"><strong>Khách sạn:</strong> <span style={{ color: 'red' }}>(Đã bị xóa)</span></div>
            <div className="detail-row"><strong>Check-in:</strong> {formatDate(booking.checkInDate)}</div>
            <div className="detail-row"><strong>Check-out:</strong> {formatDate(booking.checkOutDate)}</div>
            <div className="detail-row"><strong>Số đêm:</strong> {nights}</div>
            <div className="detail-row"><strong>Số khách:</strong> {booking.guests}</div>
            <div className="detail-row">
              <strong>Trạng thái:</strong>{' '}
              <span className={`status-badge ${STATUS_CONFIG[booking.status]?.color}`}>
                {STATUS_CONFIG[booking.status]?.icon} {STATUS_CONFIG[booking.status]?.label}
              </span>
            </div>
            <div className="detail-row">
              <strong>Thanh toán:</strong>{' '}
              <span className={`payment-status ${booking.paymentStatus === 'paid' ? 'paid' : 'unpaid'}`}>
                {booking.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </span>
            </div>
          </div>
          <h3>Danh sách phòng</h3>
          <table className="detail-table">
            <thead>
              <tr><th>Tên phòng</th><th>Số lượng</th><th>Đơn giá/đêm</th><th>Thành tiền</th></tr>
            </thead>
            <tbody>
              {booking.rooms?.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.room?.name || 'Phòng không xác định'}</td>
                  <td>x{r.quantity}</td>
                  <td>{formatPrice(r.pricePerNight)}</td>
                  <td>{formatPrice(r.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="detail-total">
            <div>Tiền phòng: {formatPrice(booking.roomPrice)}</div>
            <div>Tiền dịch vụ: {formatPrice(booking.servicePrice)}</div>
            <div><strong>Tổng cộng: {formatPrice(booking.totalPrice)}</strong></div>
          </div>
          <button onClick={onClose} style={{ marginTop: 20 }}>Đóng</button>
        </div>
      </div>
    );
  }

  // Trường hợp có khách sạn đầy đủ
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="booking-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>Chi tiết đặt phòng</h2>
        <div className="detail-section">
          <div className="detail-row"><strong>Mã booking:</strong> {booking._id}</div>
          <div className="detail-row"><strong>Khách sạn:</strong> {hotel.name}</div>
          <div className="detail-row"><strong>Địa chỉ:</strong> {hotel.address?.street}, {hotel.address?.ward}, {hotel.address?.city}</div>
          <div className="detail-row"><strong>Check-in:</strong> {formatDate(booking.checkInDate)} ({hotel.checkInTime})</div>
          <div className="detail-row"><strong>Check-out:</strong> {formatDate(booking.checkOutDate)} ({hotel.checkOutTime})</div>
          <div className="detail-row"><strong>Số đêm:</strong> {nights}</div>
          <div className="detail-row"><strong>Số khách:</strong> {booking.guests}</div>
          <div className="detail-row">
            <strong>Trạng thái:</strong>{' '}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 500,
              backgroundColor:
                booking.status === 'pending' ? '#fef3c7' :
                  booking.status === 'confirmed' ? '#dbeafe' :
                    booking.status === 'checked_in' ? '#d1fae5' :
                      booking.status === 'checked_out' ? '#ede9fe' :
                        booking.status === 'completed' ? '#d1fae5' :
                          booking.status === 'canceled' ? '#fee2e2' : '#f3f4f6',
              color:
                booking.status === 'pending' ? '#92400e' :
                  booking.status === 'confirmed' ? '#1e40af' :
                    booking.status === 'checked_in' ? '#065f46' :
                      booking.status === 'checked_out' ? '#4c1d95' :
                        booking.status === 'completed' ? '#065f46' :
                          booking.status === 'canceled' ? '#991b1b' : '#1f2937',
            }}>
              {STATUS_CONFIG[booking.status]?.icon} {STATUS_CONFIG[booking.status]?.label}
            </span>
          </div>
          <div className="detail-row">
            <strong>Thanh toán:</strong>{' '}
            <span className={`payment-status ${booking.paymentStatus === 'paid' ? 'paid' : 'unpaid'}`}>
              {booking.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </span>
            {booking.paidAt && <> vào lúc {formatDateTime(booking.paidAt)}</>}
          </div>
        </div>

        <h3>Danh sách phòng</h3>
        <table className="detail-table">
          <thead><tr><th>Tên phòng</th><th>Số lượng</th><th>Đơn giá/đêm</th><th>Thành tiền</th></tr></thead>
          <tbody>
            {booking.rooms?.map((r) => (
              <tr key={r._id}>
                <td>{r.room?.name}</td>
                <td>x{r.quantity}</td>
                <td>{formatPrice(r.pricePerNight)}</td>
                <td>{formatPrice(r.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {booking.services?.length > 0 && (
          <>
            <h3>Dịch vụ thêm</h3>
            <table className="detail-table">
              <thead><tr><th>Tên dịch vụ</th><th>Số lượng</th><th>Đơn giá</th><th>Số ngày</th><th>Thành tiền</th></tr></thead>
              <tbody>
                {booking.services.map((s) => (
                  <tr key={s._id}>
                    <td>{s.name}</td>
                    <td>x{s.quantity}</td>
                    <td>{formatPrice(s.unitPrice)}</td>
                    <td>{s.numberOfDays || (s.chargeType === 'one_time' ? '—' : '1')}</td>
                    <td>{formatPrice(s.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div className="detail-total">
          <div>Tiền phòng: {formatPrice(booking.roomPrice)}</div>
          <div>Tiền dịch vụ: {formatPrice(booking.servicePrice)}</div>
          <div><strong>Tổng cộng: {formatPrice(booking.totalPrice)}</strong></div>
        </div>

        {booking.status === 'canceled' && booking.cancelReason && (
          <div className="detail-note"><strong>Lý do hủy:</strong> {booking.cancelReason}</div>
        )}
        {booking.expiredAt && new Date(booking.expiredAt) > new Date() && booking.paymentStatus !== 'paid' && (
          <div className="warning">⏰ Hạn thanh toán: {formatDateTime(booking.expiredAt)}</div>
        )}
      </div>
    </div>
  );
}

// ========== BOOKING CARD ==========
function BookingCard({ booking, onViewDetail, onCancel, onPayment, onReview, isCancelling, isPaying }) {
  const hotel = booking.hotel;

  // Nếu khách sạn bị xóa (null) => hiển thị card lỗi nhẹ
  if (!hotel) {
    return (
      <div className="booking-card canceled">
        <div className="booking-image">
          <div className="no-image">🏨</div>
          <span className="status-badge status-canceled">❌ Đã hủy (KS không còn)</span>
        </div>
        <div className="booking-content">
          <h3 className="hotel-name">(Khách sạn đã bị xóa)</h3>
          <p className="hotel-address">📍 Thông tin không còn tồn tại</p>
          <div className="booking-dates">
            <div className="date-block"><span className="date-label">Check-in</span><span className="date-value">{formatDate(booking.checkInDate)}</span></div>
            <div className="nights-divider"><span>{nightCount(booking.checkInDate, booking.checkOutDate)}</span><small>đêm</small></div>
            <div className="date-block"><span className="date-label">Check-out</span><span className="date-value">{formatDate(booking.checkOutDate)}</span></div>
          </div>
          <div className="booking-footer">
            <div className="booking-actions">
              <button className="btn-detail" onClick={() => onViewDetail(booking._id)}>Xem chi tiết</button>
            </div>
            <div className="total-price">{formatPrice(booking.totalPrice)}</div>
          </div>
        </div>
      </div>
    );
  }

  const mainImage = getThumbnailUrl(hotel.image?.[0]?.url);
  const status = STATUS_CONFIG[booking.status] || {};
  const nights = nightCount(booking.checkInDate, booking.checkOutDate);
  const canCancel = !['canceled', 'checked_in', 'checked_out', 'completed'].includes(booking.status);
  const canPay = booking.status === 'pending' && booking.paymentStatus !== 'paid' &&
    booking.expiredAt && new Date(booking.expiredAt) > new Date();
  const canReview = booking.status === 'completed';

  return (
    <div className={`booking-card ${booking.status === 'canceled' ? 'canceled' : ''}`}>
      <div className="booking-image">
        {mainImage ? (
          <img loading="lazy" src={mainImage} alt={hotel.name} />
        ) : (
          <div className="no-image">🏨</div>
        )}
        <span className={`status-badge ${status.color}`}>{status.icon} {status.label}</span>
      </div>
      <div className="booking-content">
        <div className="booking-header">
          <div>
            <h3 className="hotel-name">{hotel.name}</h3>
            <p className="hotel-address">📍 {hotel.address?.street}, {hotel.address?.ward}, {hotel.address?.city}</p>
          </div>
          <div className="booking-id">#{booking._id.slice(-6).toUpperCase()}</div>
        </div>
        <div className="booking-dates">
          <div className="date-block"><span className="date-label">Check-in</span><span className="date-value">{formatDate(booking.checkInDate)}</span></div>
          <div className="nights-divider"><span>{nights}</span><small>đêm</small></div>
          <div className="date-block"><span className="date-label">Check-out</span><span className="date-value">{formatDate(booking.checkOutDate)}</span></div>
        </div>
        <div className="booking-rooms">
          {booking.rooms?.map((r) => (
            <div key={r._id} className="room-item">
              <span>🛏 {r.room?.name || 'Phòng không xác định'}</span>
              <span>x{r.quantity}</span>
              <span className="room-price">{formatPrice(r.pricePerNight)}/đêm</span>
            </div>
          ))}
        </div>
        {booking.services?.length > 0 && (
          <div className="booking-services">
            {booking.services.map((s) => <span key={s._id} className="service-tag">✨ {s.name}</span>)}
          </div>
        )}
        <div className="booking-footer">
          <div className="booking-meta">
            <span>👥 {booking.guests} khách</span>
            <span className={`payment-status ${booking.paymentStatus === 'paid' ? 'paid' : 'unpaid'}`}>
              {booking.paymentStatus === 'paid' ? '💳 Đã thanh toán' : '⏳ Chưa thanh toán'}
            </span>
          </div>
          <div className="booking-actions">
            <button className="btn-detail" onClick={() => onViewDetail(booking._id)}>Xem chi tiết</button>
            {canCancel && <button className="btn-cancel" onClick={() => onCancel(booking._id)} disabled={isCancelling}>Hủy booking</button>}
            {canPay && <button className="btn-payment" onClick={() => onPayment(booking)} disabled={isPaying}>Thanh toán</button>}
            {canReview && (
              <button className="btn-review" onClick={() => onReview(booking)}>
                {booking.reviewStatus ? '⭐ Xem đánh giá' : '✍️ Đánh giá'}
              </button>
            )}
          </div>
          <div className="total-price">{formatPrice(booking.totalPrice)}</div>
        </div>
      </div>
    </div>
  );
}

// ========== TRANG CHÍNH ==========
export default function MyBookingsPage() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('');
  const [pagination, setPagination] = useState(null);
  const [selectedBookingDetail, setSelectedBookingDetail] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);

  const handleOpenReview = async (booking) => {
    if (!token) return;
    if (booking.reviewStatus) {
      try {
        const res = await axiosInstance.get(`/reviews/booking/${booking._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReviewModal({ booking, existingReview: res.data.review });
      } catch {
        toast.error('Không thể tải đánh giá');
      }
    } else {
      setReviewModal({ booking, existingReview: null });
    }
  };

  const handleSubmitReview = async ({ rating, comment, reviewId }) => {
    try {
      if (reviewId) {
        await axiosInstance.patch(`/reviews/${reviewId}`, { rating, comment }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Cập nhật đánh giá thành công');
      } else {
        await axiosInstance.post('/reviews', {
          bookingId: reviewModal.booking._id,
          rating,
          comment,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Đánh giá thành công');
        setBookings(prev => prev.map(b =>
          b._id === reviewModal.booking._id ? { ...b, reviewStatus: true } : b
        ));
      }
      setReviewModal(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi gửi đánh giá');
    }
  };

  const fetchBookings = async (status = '') => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = status ? { status } : {};
      const res = await axiosInstance.get('/bookings/my-bookings', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setBookings(res.data.data.bookings || []);
      setPagination(res.data.data.pagination);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tải danh sách booking!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBookings(activeStatus);
    } else {
      setLoading(false);
    }
  }, [activeStatus, token]);

  const handleViewDetail = async (bookingId) => {
    if (!token) return;
    try {
      const res = await axiosInstance.get(`/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedBookingDetail(res.data.data);
    } catch (error) {
      toast.error('Không thể tải chi tiết booking');
    }
  };

  const handleCancel = async (bookingId) => {
    if (!token) return;
    if (!window.confirm('Bạn có chắc muốn hủy booking này?')) return;
    setCancellingId(bookingId);
    try {
      await axiosInstance.patch(`/bookings/${bookingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Hủy booking thành công');
      fetchBookings(activeStatus);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Hủy thất bại');
    } finally {
      setCancellingId(null);
    }
  };

  const handlePayment = async (booking) => {
    if (!token || !booking._id) return;
    setPayingId(booking._id);
    try {
      const response = await axiosInstance.post('/payments/create', { bookingId: booking._id }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { paymentUrl } = response.data;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error('Không nhận được đường dẫn thanh toán');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi tạo thanh toán, vui lòng thử lại');
      setPayingId(null);
    }
  };

  return (
    <div className="my-bookings-page">
      <div className="container">
        <div className="page-header">
          <h1>Booking của tôi</h1>
          <p>Quản lý tất cả các đặt phòng của bạn</p>
        </div>
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
        {loading ? (
          <div className="loading-state"><div className="spinner" /><p>Đang tải danh sách booking...</p></div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🏨</span>
            <h3>Chưa có booking nào</h3>
            <p>Hãy đặt phòng để bắt đầu hành trình của bạn!</p>
          </div>
        ) : (
          <>
            <div className="bookings-count">Tìm thấy <strong>{pagination?.total || bookings.length}</strong> booking</div>
            <div className="bookings-list">
              {bookings.map((b) => (
                <BookingCard
                  key={b._id}
                  booking={b}
                  onViewDetail={handleViewDetail}
                  onCancel={handleCancel}
                  onPayment={handlePayment}
                  onReview={handleOpenReview}
                  isCancelling={cancellingId === b._id}
                  isPaying={payingId === b._id}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {selectedBookingDetail && (
        <BookingDetailModal booking={selectedBookingDetail} onClose={() => setSelectedBookingDetail(null)} />
      )}
      {reviewModal && (
        <ReviewModal
          booking={reviewModal.booking}
          existingReview={reviewModal.existingReview}
          onClose={() => setReviewModal(null)}
          onSubmit={handleSubmitReview}
        />
      )}
    </div>
  );
}