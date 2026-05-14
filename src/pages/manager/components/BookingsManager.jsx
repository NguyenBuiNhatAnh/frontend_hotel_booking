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
    const [activeTab, setActiveTab] = useState('all');
    const [bookings, setBookings] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Filter states
    const [allStatus, setAllStatus] = useState('');
    const [pageAll, setPageAll] = useState(1);
    const limit = 10;

    // Today states
    const [todayDate, setTodayDate] = useState(new Date().toISOString().slice(0, 10));
    const [todayStatus, setTodayStatus] = useState('');
    const [todaySearch, setTodaySearch] = useState('');
    const [filteredToday, setFilteredToday] = useState([]);
    const [pageToday, setPageToday] = useState(1);
    const [todayPagination, setTodayPagination] = useState(null);

    const fetchAllBookings = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: pageAll, limit };
            if (allStatus) params.status = allStatus;
            const res = await axiosInstance.get('/bookings/manage', {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            console.log('All bookings response:', res.data);
            setBookings(res.data.data.bookings || []);
            setPagination(res.data.data.pagination);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi tải booking');
        } finally {
            setLoading(false);
        }
    }, [token, pageAll, allStatus]);

    const fetchTodayBookings = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: pageToday, limit };
            if (todayDate) params.date = todayDate;
            if (todayStatus) params.status = todayStatus;
            const res = await axiosInstance.get('/bookings/manager/today', {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            console.log('Today bookings response:', res.data);
            const data = res.data.data.bookings || [];
            setBookings(data);
            setTodayPagination(res.data.data.pagination);
            setFilteredToday(data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi tải booking hôm nay');
        } finally {
            setLoading(false);
        }
    }, [token, pageToday, todayDate, todayStatus]);

    useEffect(() => {
        if (activeTab === 'all') fetchAllBookings();
        else fetchTodayBookings();
    }, [activeTab, fetchAllBookings, fetchTodayBookings]);

    useEffect(() => {
        if (activeTab === 'today' && bookings.length) {
            const kw = todaySearch.trim().toLowerCase();
            if (!kw) setFilteredToday(bookings);
            else {
                const filtered = bookings.filter(b =>
                    b.guestInfo?.email?.toLowerCase().includes(kw) ||
                    b.guestInfo?.phone?.includes(kw) ||
                    `${b.guestInfo?.firstName} ${b.guestInfo?.lastName}`.toLowerCase().includes(kw)
                );
                setFilteredToday(filtered);
            }
        }
    }, [todaySearch, bookings, activeTab]);

    const handleStatusUpdate = async (bookingId, newStatus) => {
        if (!window.confirm(`Xác nhận chuyển sang "${STATUS_LABELS[newStatus]}"?`)) return;
        setUpdatingStatus(true);
        try {
            await axiosInstance.patch(
                `/bookings/manager/${bookingId}/status?status=${newStatus}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Cập nhật thành công');
            if (activeTab === 'all') fetchAllBookings();
            else fetchTodayBookings();
            if (selectedBooking?._id === bookingId) setSelectedBooking(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Cập nhật thất bại');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const viewBookingDetail = (booking) => {
        setSelectedBooking(booking);
    };

    const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('vi-VN') : '—';
    const formatPrice = (price) => {
        if (price === undefined || price === null) return '0 VND';
        return price.toLocaleString() + ' VND';
    };

    const renderRow = (booking) => {
        const statusLabel = STATUS_LABELS[booking.status] || booking.status;
        const statusColor = STATUS_COLORS[booking.status] || '#6b7280';
        return (
            <tr key={booking._id}>
                <td>{booking._id.slice(-8)}</td>
                <td>{booking.guestInfo?.firstName} {booking.guestInfo?.lastName}<br /><small>{booking.guestInfo?.phone}</small></td>
                <td>{formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}</td>
                <td>{booking.rooms?.map(r => r.roomTypeName).join(', ')}</td>
                <td>{booking.totalPrice?.toLocaleString()}đ</td>
                <td><span style={{ background: statusColor + '20', color: statusColor, padding: '2px 8px', borderRadius: '20px' }}>{statusLabel}</span></td>
                <td><button className="btn-view" onClick={() => viewBookingDetail(booking)}>Chi tiết</button></td>
            </tr>
        );
    };

    const displayBookings = activeTab === 'today' ? filteredToday : bookings;
    const currentPagination = activeTab === 'today' ? todayPagination : pagination;

    return (
        <div className="bookings-manager">
            <div className="bookings-header">
                <h2>Quản lý đặt phòng</h2>
                <div className="tabs">
                    <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>📋 Tất cả</button>
                    <button className={`tab ${activeTab === 'today' ? 'active' : ''}`} onClick={() => setActiveTab('today')}>📅 Hôm nay</button>
                </div>
            </div>

            {activeTab === 'all' && (
                <div className="filters"><select value={allStatus} onChange={e => { setAllStatus(e.target.value); setPageAll(1); }}>
                    <option value="">Tất cả trạng thái</option>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select></div>
            )}

            {activeTab === 'today' && (
                <div className="filters today-filters" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input type="date" value={todayDate} onChange={e => { setTodayDate(e.target.value); setPageToday(1); }} />
                    <select value={todayStatus} onChange={e => { setTodayStatus(e.target.value); setPageToday(1); }}>
                        <option value="">Tất cả</option>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <input type="text" placeholder="Tìm theo tên/email/SĐT" value={todaySearch} onChange={e => setTodaySearch(e.target.value)} style={{ flex: 1 }} />
                </div>
            )}

            <div className="table-wrapper">
                <table className="bookings-table">
                    <thead><tr><th>Mã</th><th>Khách hàng</th><th>Ngày</th><th>Phòng</th><th>Tổng</th><th>Trạng thái</th><th></th></tr></thead>
                    <tbody>
                        {loading && <tr><td colSpan="7">Đang tải...</td></tr>}
                        {!loading && displayBookings.length === 0 && <tr><td colSpan="7">Không có booking</td></tr>}
                        {!loading && displayBookings.map(renderRow)}
                    </tbody>
                </table>
            </div>

            {currentPagination && currentPagination.totalPages > 1 && (
                <div className="pagination">
                    <button disabled={currentPagination.page === 1} onClick={() => activeTab === 'all' ? setPageAll(p => p - 1) : setPageToday(p => p - 1)}>Trước</button>
                    <span>Trang {currentPagination.page} / {currentPagination.totalPages}</span>
                    <button disabled={currentPagination.page === currentPagination.totalPages} onClick={() => activeTab === 'all' ? setPageAll(p => p + 1) : setPageToday(p => p + 1)}>Sau</button>
                </div>
            )}

            {selectedBooking && (
                <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
                    <div className="modal-content booking-detail" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>Chi tiết booking</h3><button className="close-btn" onClick={() => setSelectedBooking(null)}>✕</button></div>
                        <div className="modal-body">
                            <div className="detail-row"><strong>Mã booking:</strong> {selectedBooking._id}</div>
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
                                    {selectedBooking.rooms?.map((r, idx) => {
                                        // Fallback: nếu totalPrice không có thì tính từ pricePerNight * quantity
                                        const roomTotal = r.totalPrice ?? (r.pricePerNight * r.quantity);
                                        return (
                                            <li key={idx}>
                                                {r.roomTypeName} x {r.quantity} đêm: {formatPrice(roomTotal)}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                            {selectedBooking.services?.length > 0 && (
                                <div className="detail-row">
                                    <strong>Dịch vụ thêm:</strong>
                                    <ul>
                                        {selectedBooking.services.map((sv, idx) => {
                                            const serviceTotal = sv.totalPrice ?? (sv.unitPrice * sv.quantity);
                                            return (
                                                <li key={idx}>
                                                    {sv.name} x {sv.quantity} : {formatPrice(serviceTotal)}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                            <div className="detail-row total">
                                <strong>Tổng thanh toán:</strong> {formatPrice(selectedBooking.totalPrice)}
                            </div>
                            <div className="detail-row">
                                <strong>Trạng thái hiện tại:</strong>
                                <span className="status-badge" style={{ background: (STATUS_COLORS[selectedBooking.status] || '#6b7280') + '20', color: STATUS_COLORS[selectedBooking.status] || '#6b7280' }}>
                                    {STATUS_LABELS[selectedBooking.status] || selectedBooking.status || 'Không xác định'}
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
                                    {!ALLOWED_TRANSITIONS[selectedBooking.status]?.length && (
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