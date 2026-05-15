import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../services/axiosInstance';
import { toast } from 'react-toastify';
import './AdminHotelsPage.css';
import { useNavigate } from 'react-router-dom';

// ── Constants ──────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: { label: 'Chờ duyệt', color: 'badge-pending', icon: '🕐' },
  approved: { label: 'Đã duyệt', color: 'badge-approved', icon: '✅' },
  rejected: { label: 'Từ chối', color: 'badge-rejected', icon: '❌' },
  blocked: { label: 'Đã khóa', color: 'badge-blocked', icon: '🚫' },
};

const FILTER_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: '🕐 Chờ duyệt' },
  { value: 'approved', label: '✅ Đã duyệt' },
  { value: 'rejected', label: '❌ Từ chối' },
  { value: 'blocked', label: '🚫 Đã khóa' },
];

// ── Action buttons theo từng status ───────────────────────────
const ACTIONS = {
  pending: [
    { key: 'approve', label: 'Duyệt', cls: 'btn-approve' },
    { key: 'reject', label: 'Từ chối', cls: 'btn-reject' },
  ],
  approved: [
    { key: 'block', label: 'Khóa', cls: 'btn-block' },
  ],
  blocked: [
    { key: 'unblock', label: 'Mở khóa', cls: 'btn-approve' },
  ],
  rejected: [],
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

// ── Confirm Modal ──────────────────────────────────────────────
function ConfirmModal({ hotel, action, onConfirm, onCancel, loading }) {
  const labels = {
    approve: { title: 'Duyệt khách sạn', desc: 'Khách sạn sẽ được hiển thị công khai. Chủ khách sạn sẽ được cấp quyền hotel_manager.', color: '#22c55e' },
    reject: { title: 'Từ chối khách sạn', desc: 'Khách sạn sẽ bị từ chối và không được hiển thị.', color: '#ef4444' },
    block: { title: 'Khóa khách sạn', desc: 'Khách sạn sẽ bị ẩn khỏi hệ thống và không thể đặt phòng.', color: '#f59e0b' },
    unblock: { title: 'Mở khóa khách sạn', desc: 'Khách sạn sẽ được hiển thị trở lại.', color: '#22c55e' },
  };

  const cfg = labels[action];

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon" style={{ background: cfg.color + '20', color: cfg.color }}>
          {action === 'approve' || action === 'unblock' ? '✅' : action === 'block' ? '🚫' : '❌'}
        </div>
        <h3>{cfg.title}</h3>
        <p className="modal-hotel-name">"{hotel.name}"</p>
        <p className="modal-desc">{cfg.desc}</p>
        <div className="modal-actions">
          <button className="modal-btn-cancel" onClick={onCancel} disabled={loading}>
            Huỷ
          </button>
          <button
            className="modal-btn-confirm"
            style={{ background: cfg.color }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <span className="btn-spinner" /> : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Hotel Detail Drawer ────────────────────────────────────────
function HotelDrawer({ hotel, onClose, onAction, actionLoading }) {
  if (!hotel) return null;
  const status = STATUS_CONFIG[hotel.status];
  const actions = ACTIONS[hotel.status] || [];

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>Chi tiết khách sạn</h2>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          {/* Images */}
          {hotel.image?.length > 0 && (
            <div className="drawer-images">
              {hotel.image.slice(0, 4).map((img, i) => (
                <img key={i} src={img.url} alt={`img-${i}`} />
              ))}
            </div>
          )}

          {/* Status */}
          <div className="drawer-status">
            <span className={`status-badge ${status?.color}`}>
              {status?.icon} {status?.label}
            </span>
            <span className="drawer-date">
              Đăng ký: {formatDate(hotel.createdAt)}
            </span>
          </div>

          {/* Info */}
          <div className="drawer-info">
            <h3>{hotel.name}</h3>
            <p className="drawer-address">
              📍 {hotel.address?.street}, {hotel.address?.ward}, {hotel.address?.city}
            </p>
            <p className="drawer-desc">{hotel.description}</p>
          </div>

          {/* Owner */}
          <div className="drawer-section">
            <div className="drawer-section-title">👤 Chủ sở hữu</div>
            <div className="owner-card">
              <div className="owner-avatar">
                {hotel.owner?.email?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="owner-name">{hotel.owner?.name || '—'}</div>
                <div className="owner-email">{hotel.owner?.email}</div>
              </div>
            </div>
          </div>

          {/* Amenities */}
          {hotel.amenities?.length > 0 && (
            <div className="drawer-section">
              <div className="drawer-section-title">✨ Tiện nghi</div>
              <div className="amenity-list">
                {hotel.amenities.map((a) => (
                  <span key={a} className="amenity-tag">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Check time */}
          <div className="drawer-section">
            <div className="drawer-section-title">🕐 Giờ</div>
            <div className="time-row">
              <div className="time-block">
                <span>Check-in</span>
                <strong>{hotel.checkInTime || '—'}</strong>
              </div>
              <div className="time-block">
                <span>Check-out</span>
                <strong>{hotel.checkOutTime || '—'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        {actions.length > 0 && (
          <div className="drawer-footer">
            {actions.map((act) => (
              <button
                key={act.key}
                className={`action-btn ${act.cls}`}
                onClick={() => onAction(hotel, act.key)}
                disabled={actionLoading}
              >
                {act.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Hotel Row ──────────────────────────────────────────────────
function HotelRow({ hotel, onViewDetail, onAction }) {
  const status = STATUS_CONFIG[hotel.status];
  const actions = ACTIONS[hotel.status] || [];

  return (
    <tr>
      <td>
        <div className="hotel-cell">
          <div className="hotel-thumb">
            {hotel.image?.[0]?.url
              ? <img src={hotel.image[0].url} alt={hotel.name} />
              : <span>🏨</span>
            }
          </div>
          <div>
            <div className="hotel-name-cell">{hotel.name}</div>
            <div className="hotel-city">{hotel.address?.city}</div>
          </div>
        </div>
      </td>
      <td>
        <div className="owner-cell">
          <div>{hotel.owner?.name || '—'}</div>
          <div className="owner-email-small">{hotel.owner?.email}</div>
        </div>
      </td>
      <td>{formatDate(hotel.createdAt)}</td>
      <td>
      </td>
      <td>
        <div className="row-actions">
          <button className="btn-detail" onClick={() => onViewDetail(hotel)}>
            Xem
          </button>
          {actions.map((act) => (
            <button
              key={act.key}
              className={`action-btn-sm ${act.cls}`}
              onClick={() => onAction(hotel, act.key)}
            >
              {act.label}
            </button>
          ))}
        </div>
      </td>
    </tr>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function AdminHotelsPage() {
  const { token, logout } = useAuth();

  const [hotels, setHotels] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [page, setPage] = useState(1);

  const [drawerHotel, setDrawerHotel] = useState(null);
  const [confirm, setConfirm] = useState(null); // { hotel, action }
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────
  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (activeStatus) params.status = activeStatus;
      if (citySearch) params.city = citySearch;

      const res = await axiosInstance.get('/admin/hotels', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setHotels(res.data.data.hotels);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải dữ liệu!');
    } finally {
      setLoading(false);
    }
  }, [token, activeStatus, citySearch, page]);

  useEffect(() => { fetchHotels(); }, [fetchHotels]);

  // ── Action ───────────────────────────────────────────────────
  const handleAction = (hotel, action) => {
    setConfirm({ hotel, action });
  };

  const confirmAction = async () => {
    const { hotel, action } = confirm;
    setActionLoading(true);
    try {
      await axiosInstance.patch(
        `/admin/hotels/${hotel._id}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const msg = {
        approve: 'Đã duyệt khách sạn!',
        reject: 'Đã từ chối khách sạn!',
        block: 'Đã khóa khách sạn!',
        unblock: 'Đã mở khóa khách sạn!',
      }[action];

      toast.success(msg);
      setConfirm(null);
      setDrawerHotel(null);
      fetchHotels();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại!');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCitySearch(cityInput.trim());
    setPage(1);
  };

  const handleLogout = () => {
    logout();                // xóa token & user trong context + localStorage
    window.location.href = '/auth';  // chuyển về trang login
  };

  return (
    <div className="admin-hotels-page">

      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <span className="accent">Hello</span>Booking
          <span className="admin-tag">Admin</span>
        </div>
        <nav className="sidebar-nav">
          <a href="/admin" className="sidebar-link active">🏨 Khách sạn</a>
          <a href="/admin/users" className="sidebar-link">👥 Người dùng</a>
        </nav>
      </aside>

      {/* ── Main ── */}
      <main className="admin-main">

        {/* Top */}
        <div className="admin-topbar">
          <div>
            <h1>Quản lý khách sạn</h1>
            <p>Duyệt, từ chối và quản lý trạng thái khách sạn</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Đăng xuất
          </button>
        </div>

        {/* Filters */}
        <div className="admin-filters">
          <div className="filter-tabs">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                className={`filter-tab ${activeStatus === tab.value ? 'active' : ''}`}
                onClick={() => { setActiveStatus(tab.value); setPage(1); }}
              >
                {tab.label}
                {tab.value === 'pending' && pagination?.total > 0 && activeStatus !== 'pending' && (
                  <span className="tab-dot" />
                )}
              </button>
            ))}
          </div>

          <form className="city-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Tìm theo thành phố..."
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
            />
            <button type="submit">Tìm</button>
          </form>
        </div>

        {/* Table */}
        <div className="admin-table-wrap">
          {loading ? (
            <div className="table-loading">
              <div className="spinner" />
              <p>Đang tải...</p>
            </div>
          ) : hotels.length === 0 ? (
            <div className="table-empty">
              <span>🏨</span>
              <p>Không có khách sạn nào</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Khách sạn</th>
                  <th>Chủ sở hữu</th>
                  <th>Ngày đăng ký</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {hotels.map((hotel) => (
                  <HotelRow
                    key={hotel._id}
                    hotel={hotel}
                    onViewDetail={setDrawerHotel}
                    onAction={handleAction}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Trước
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={page === p ? 'active' : ''}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              disabled={page === pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Tiếp →
            </button>
          </div>
        )}

      </main>

      {/* ── Drawer ── */}
      {drawerHotel && (
        <HotelDrawer
          hotel={drawerHotel}
          onClose={() => setDrawerHotel(null)}
          onAction={handleAction}
          actionLoading={actionLoading}
        />
      )}

      {/* ── Confirm Modal ── */}
      {confirm && (
        <ConfirmModal
          hotel={confirm.hotel}
          action={confirm.action}
          onConfirm={confirmAction}
          onCancel={() => setConfirm(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
