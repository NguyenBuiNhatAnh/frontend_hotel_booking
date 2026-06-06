import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../services/axiosInstance';
import { toast } from 'react-toastify';
import './AdminUsersPage.css';
import { useNavigate } from 'react-router-dom';

// ── Constants ──────────────────────────────────────────────
const STATUS_CONFIG = {
  active:  { label: 'Hoạt động', color: 'user-badge-active', icon: '🟢' },
  blocked: { label: 'Đã khóa',   color: 'user-badge-blocked', icon: '🔴' },
};

const FILTER_TABS = [
  { value: '',        label: 'Tất cả' },
  { value: 'active',  label: '🟢 Hoạt động' },
  { value: 'blocked', label: '🔴 Đã khóa' },
];

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN') : '—';

// ── Modal xác nhận ─────────────────────────────────────────
function ConfirmUserModal({ user, action, onConfirm, onCancel, loading }) {
  const labels = {
    block: {
      title: 'Khóa người dùng',
      desc: `Người dùng "${user.email}" sẽ bị khóa và không thể đăng nhập.`,
      color: '#f59e0b',
    },
    unblock: {
      title: 'Mở khóa người dùng',
      desc: `Người dùng "${user.email}" sẽ được mở khóa.`,
      color: '#22c55e',
    },
  };
  const cfg = labels[action];
  if (!cfg) return null;

  return (
    <div className="user-modal-overlay" onClick={onCancel}>
      <div className="user-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="user-modal-icon" style={{ background: cfg.color + '20', color: cfg.color }}>
          {action === 'block' ? '🔒' : '🔓'}
        </div>
        <h3>{cfg.title}</h3>
        <p className="user-modal-desc">{cfg.desc}</p>
        <div className="user-modal-actions">
          <button className="user-modal-btn-cancel" onClick={onCancel} disabled={loading}>
            Huỷ
          </button>
          <button
            className="user-modal-btn-confirm"
            style={{ background: cfg.color }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <span className="user-btn-spinner" /> : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dòng người dùng trong bảng ─────────────────────────────
function UserRow({ user, onAction }) {
  const status = STATUS_CONFIG[user.status] || { label: user.status, color: '' };
  const isBlocked = user.status === 'blocked';
  const actionKey = isBlocked ? 'unblock' : 'block';
  const actionLabel = isBlocked ? 'Mở khóa' : 'Khóa';
  const actionClass = isBlocked ? 'user-btn-unblock' : 'user-btn-block';

  return (
    <tr>
      <td>
        <div className="user-info-cell">
          <div className="user-avatar">
            {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="user-name">{user.firstName} {user.lastName}</div>
            <div className="user-email">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="user-role">
        {user.role === 'hotel_manager' ? '🏨 Quản lý khách sạn' : '👤 Khách hàng'}
      </td>
      <td>{user.phone || '—'}</td>
      <td>{formatDate(user.createdAt)}</td>
      <td>
        <span className={`user-status-badge ${status.color}`}>
          {status.icon} {status.label}
        </span>
      </td>
      <td>
        <button
          className={`user-action-btn ${actionClass}`}
          onClick={() => onAction(user, actionKey)}
        >
          {actionLabel}
        </button>
      </td>
    </tr>
  );
}

// ── Trang chính ────────────────────────────────────────────
export default function AdminUsersPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (activeStatus) params.status = activeStatus;
      if (searchTerm) params.search = searchTerm;

      const res = await axiosInstance.get('users', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      // Giả sử response: { data: { users, pagination } }
      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [token, activeStatus, searchTerm, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Khóa / mở khóa
  const handleAction = (user, action) => {
    setConfirm({ user, action });
  };

  const confirmAction = async () => {
    const { user, action } = confirm;
    setActionLoading(true);
    try {
      const newStatus = action === 'block' ? 'blocked' : 'active';
      await axiosInstance.patch(
        `/users/${user._id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(action === 'block' ? 'Đã khóa người dùng' : 'Đã mở khóa người dùng');
      setConfirm(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput.trim());
    setPage(1);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="admin-users-page">
      {/* Sidebar */}
      <aside className="admin-users-sidebar">
        <div className="sidebar-logo">
          <span className="accent">Hello</span>Booking
          <span className="admin-tag">Admin</span>
        </div>
        <nav className="sidebar-nav">
          <a href="/admin/dashboard" className="sidebar-link">📊 Dashboard</a>
          <a href="/admin/hotels" className="sidebar-link">🏨 Khách sạn</a>
          <a href="/admin/users" className="sidebar-link active">👥 Người dùng</a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="admin-users-main">
        <div className="admin-users-topbar">
          <div>
            <h1>Quản lý người dùng</h1>
            <p>Danh sách khách hàng và quản lý khách sạn</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>🚪 Đăng xuất</button>
        </div>

        {/* Filters */}
        <div className="admin-users-filters">
          <div className="filter-tabs">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                className={`filter-tab ${activeStatus === tab.value ? 'active' : ''}`}
                onClick={() => { setActiveStatus(tab.value); setPage(1); }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <form className="user-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit">Tìm</button>
          </form>
        </div>

        {/* Bảng người dùng */}
        <div className="admin-users-table-wrap">
          {loading ? (
            <div className="table-loading"><div className="spinner" /><p>Đang tải...</p></div>
          ) : users.length === 0 ? (
            <div className="table-empty"><span>👥</span><p>Không có người dùng nào</p></div>
          ) : (
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Vai trò</th>
                  <th>Số điện thoại</th>
                  <th>Ngày đăng ký</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <UserRow key={user._id} user={user} onAction={handleAction} />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Phân trang */}
        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Trước</button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button disabled={page === pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Tiếp →</button>
          </div>
        )}
      </main>

      {/* Modal xác nhận */}
      {confirm && (
        <ConfirmUserModal
          user={confirm.user}
          action={confirm.action}
          onConfirm={confirmAction}
          onCancel={() => setConfirm(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
