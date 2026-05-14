// pages/manager/components/BookingsManager.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../services/axiosInstance';
import { toast } from 'react-toastify';
import './BookingsManager.css';

const STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  checked_in: 'Đã nhận phòng',
  checked_out: 'Đã trả phòng',
  completed: 'Hoàn thành',
  canceled: 'Đã hủy'
};

const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  checked_in: '#10b981',
  checked_out: '#6366f1',
  completed: '#22c55e',
  canceled: '#ef4444'
};

const ALLOWED_TRANSITIONS = {
  pending: ['confirmed', 'canceled'],
  confirmed: ['checked_in', 'canceled'],
  checked_in: ['checked_out'],
  checked_out: ['completed'],
  completed: [],
  canceled: []
};

export default function BookingsManager() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('today'); // 'today' or 'search'
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Luồng 1 (today)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [todayStatus, setTodayStatus] = useState('');

  // Luồng 2 (search)
  const [keyword, setKeyword] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchTrigger, setSearchTrigger] = useState('');

  // Pagination cho từng tab
  const [pageToday, setPageToday] = useState(1);
  const [pageSearch, setPageSearch] = useState(1);
  const limit = 10;

  const fetchTodayBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pageToday, limit };
      if (date) params.date = date;
      if (todayStatus) params.status = todayStatus;

      const res = await axiosInstance.get('/bookings/manage', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setBookings(res.data.data.bookings);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải danh sách booking');
    } finally {
      setLoading(false);
    }
  }, [token, pageToday, date, todayStatus]);

  const fetchSearchBookings = useCallback(async () => {
    if (!searchTrigger.trim()) return;
    setLoading(true);
    try {
      const params = { keyword: searchTrigger, page: pageSearch, limit };
      if (searchStatus) params.status = searchStatus;

      const res = await axiosInstance.get('/bookings/manage/search', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setBookings(res.data.data.bookings);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tìm kiếm thất bại');
    } finally {
      setLoading(false);
    }
  }, [token, searchTrigger, pageSearch, searchStatus]);

  useEffect(() => {
    if (activeTab === 'today') {
      fetchTodayBookings();
    }
  }, [activeTab, fetchTodayBookings]);

  useEffect(() => {
    if (activeTab === 'search' && searchTrigger) {
      fetchSearchBookings();
    }
  }, [activeTab, searchTrigger, fetchSearchBookings]);

  const handleDateChange = (e) => {
    setDate(e.target.value);
    setPageToday(1);
  };

  const handleTodayStatusChange = (e) => {
    setTodayStatus(e.target.value);
    setPageToday(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!keyword.trim()) {
      toast.warning('Vui lòng nhập từ khóa');
      return;
    }
    setSearchTrigger(keyword);
    setPageSearch(1);
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    if (!window.confirm(`Xác nhận chuyển trạng thái thành "${STATUS_LABELS[newStatus]}"?`)) return;
    setUpdatingStatus(true);
    try {
      await axiosInstance.patch(
        `/bookings/manager/${bookingId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Cập nhật trạng thái thành công');
      if (activeTab === 'today') fetchTodayBookings();
      else fetchSearchBookings();
      if (selectedBooking?._id === bookingId) setSelectedBooking(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const viewBookingDetail = async (bookingId) => {
    // Giả định có endpoint lấy chi tiết: GET /bookings/manager/:id
    // Nếu chưa có, dùng dữ liệu đã có trong bookings array
    try {
      const res = await axiosInstance.get(`/bookings/manager/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedBooking(res.data.data);
    } catch (err) {
      // Fallback: tìm trong danh sách hiện tại
      const found = bookings.find(b => b._id === bookingId);
      if (found) setSelectedBooking(found);
      else toast.error('Không thể tải chi tiết booking');
    }
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('vi-VN');
  const formatPrice = (price) => price?.toLocaleString() + ' VND';

  const renderBookingRow = (booking) => (
    <tr key={booking._id}>
      <td>{booking._id.slice(-8)}</td>
      <td>
        {booking.guestInfo?.firstName} {booking.guestInfo?.lastName}
        <div className="small-text">{booking.guestInfo?.phone}</div>
      </td>
      <td>{formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}</td>
      <td>{booking.rooms?.map(r => r.roomTypeName).join(', ')}</td>
      <td>{booking.totalPrice?.toLocaleString()}đ</td>
      <td>
        <span className="status-badge" style={{ background: STATUS_COLORS[booking.status] + '20', color: STATUS_COLORS[booking.status] }}>
          {STATUS_LABELS[booking.status]}
        </span>
      </td>
      <td>
        <button className="btn-view" onClick={() => viewBookingDetail(booking._id)}>Chi tiết</button>
      </td>
    </tr>
  );

  return (
    <div className="bookings-manager">
      <div className="bookings-header">
        <h2>Quản lý đặt phòng</h2>
        <div className="tabs">
          <button className={`tab ${activeTab === 'today' ? 'active' : ''}`} onClick={() => setActiveTab('today')}>📅 Hôm nay / theo ngày</button>
          <button className={`tab ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>🔍 Tìm kiếm</button>
        </div>
      </div>

      {activeTab === 'today' && (
        <div className="filters today-filters">
          <div className="filter-group">
            <label>Ngày nhận phòng:</label>
            <input type="date" value={date} onChange={handleDateChange} />
          </div>
          <div className="filter-group">
            <label>Trạng thái:</label>
            <select value={todayStatus} onChange={handleTodayStatusChange}>
              <option value="">Tất cả</option>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {activeTab === 'search' && (
        <div className="filters search-filters">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <input
              type="text"
              placeholder="Mã booking, tên khách, SĐT, email..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button type="submit">Tìm kiếm</button>
          </form>
          <div className="filter-group">
            <label>Lọc theo trạng thái:</label>
            <select value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)}>
              <option value="">Tất cả</option>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Mã booking</th>
              <th>Khách hàng</th>
              <th>Ngày nhận - trả</th>
              <th>Phòng</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="loading-cell">Đang tải...</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan="7" className="empty-cell">Không có booking nào</td></tr>
            ) : (
              bookings.map(renderBookingRow)
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => activeTab === 'today' ? setPageToday(p => p-1) : setPageSearch(p => p-1)}
          >← Trước</button>
          <span>Trang {pagination.page} / {pagination.totalPages}</span>
          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() => activeTab === 'today' ? setPageToday(p => p+1) : setPageSearch(p => p+1)}
          >Tiếp →</button>
        </div>
      )}

      {/* Modal chi tiết booking */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal-content booking-detail" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết booking</h3>
              <button className="close-btn" onClick={() => setSelectedBooking(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Mã booking:</strong> {selectedBooking._id}
              </div>
              <div className="detail-row">
                <strong>Khách hàng:</strong> {selectedBooking.guestInfo?.firstName} {selectedBooking.guestInfo?.lastName}<br />
                <span className="small">{selectedBooking.guestInfo?.email} - {selectedBooking.guestInfo?.phone}</span>
              </div>
              <div className="detail-row">
                <strong>Ngày nhận:</strong> {formatDate(selectedBooking.checkInDate)}<br />
                <strong>Ngày trả:</strong> {formatDate(selectedBooking.checkOutDate)}
              </div>
              <div className="detail-row">
                <strong>Phòng đặt:</strong>
                <ul>
                  {selectedBooking.rooms?.map((r, idx) => (
                    <li key={idx}>{r.roomTypeName} x {r.quantity} đêm: {formatPrice(r.totalPrice)}</li>
                  ))}
                </ul>
              </div>
              {selectedBooking.services?.length > 0 && (
                <div className="detail-row">
                  <strong>Dịch vụ thêm:</strong>
                  <ul>
                    {selectedBooking.services.map((sv, idx) => (
                      <li key={idx}>{sv.name} x {sv.quantity} : {formatPrice(sv.totalPrice)}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="detail-row total">
                <strong>Tổng thanh toán:</strong> {formatPrice(selectedBooking.totalPrice)}
              </div>
              <div className="detail-row">
                <strong>Trạng thái hiện tại:</strong>
                <span className="status-badge" style={{ background: STATUS_COLORS[selectedBooking.status] + '20', color: STATUS_COLORS[selectedBooking.status] }}>
                  {STATUS_LABELS[selectedBooking.status]}
                </span>
              </div>
              <div className="detail-row">
                <strong>Cập nhật trạng thái:</strong>
                <div className="status-actions">
                  {ALLOWED_TRANSITIONS[selectedBooking.status]?.map(nextStatus => (
                    <button
                      key={nextStatus}
                      className="status-btn"
                      style={{ background: STATUS_COLORS[nextStatus] }}
                      onClick={() => handleStatusUpdate(selectedBooking._id, nextStatus)}
                      disabled={updatingStatus}
                    >
                      Chuyển sang {STATUS_LABELS[nextStatus]}
                    </button>
                  ))}
                  {ALLOWED_TRANSITIONS[selectedBooking.status]?.length === 0 && (
                    <span className="no-action">Không thể thay đổi trạng thái</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}