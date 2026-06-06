import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../services/axiosInstance';
import './AdminDashboardPage.css';

const HOTEL_STATUS_LABELS = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  blocked: 'Đã khóa',
};

const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');
const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const getNiceMax = (value) => {
  if (value <= 5) return 5;
  if (value <= 10) return 10;
  return Math.ceil(value / 10) * 10;
};

const getAxisTicks = (maxValue) => {
  const step = maxValue / 5;
  return Array.from({ length: 6 }, (_, index) => Math.round(maxValue - (step * index)));
};

function AdminSidebar() {
  return (
    <aside className="admin-dashboard-sidebar">
      <div className="sidebar-logo">
        <span className="accent">Hello</span>Booking
        <span className="admin-tag">Admin</span>
      </div>
      <nav className="sidebar-nav">
        <a href="/admin/dashboard" className="sidebar-link active">📊 Dashboard</a>
        <a href="/admin/hotels" className="sidebar-link">🏨 Khách sạn</a>
        <a href="/admin/users" className="sidebar-link">👥 Người dùng</a>
      </nav>
    </aside>
  );
}

function KpiCard({ label, value, note, highlight, highlightClassName = '', valueClassName = '' }) {
  return (
    <div className="admin-kpi-card">
      <span>{label}</span>
      <div className={`admin-kpi-value ${valueClassName}`}>
        <strong>{value}</strong>
        {highlight && (
          <sup className={`admin-kpi-increase ${highlightClassName}`} title="Nguoi dung moi hom nay">
            {highlight}
          </sup>
        )}
      </div>
      {note && <small>{note}</small>}
    </div>
  );
}

function MonthlyUserChart({ data }) {
  const maxValue = getNiceMax(Math.max(...data.map((item) => Math.max(item.customer, item.hotelManager)), 1));
  const ticks = getAxisTicks(maxValue);

  return (
    <div className="admin-chart-card">
      <div className="admin-card-header">
        <h2>Người dùng theo tháng</h2>
        <p>Customer và hotel manager đăng ký theo tháng</p>
      </div>
      <div className="axis-scroll">
        <div className="axis-chart">
        <div className="axis-y-labels">
          {ticks.map((tick) => (
            <span key={tick}>{formatNumber(tick)}</span>
          ))}
        </div>
        <div className="axis-plot">
          <div className="axis-grid">
            {ticks.map((tick) => (
              <span key={tick} />
            ))}
          </div>
          <div className="grouped-monthly-bars">
            {data.map((item) => (
              <div className="grouped-month-item" key={item.month}>
                <div className="grouped-bars">
                  <div
                    className="grouped-bar-wrap"
                    title={`${item.label} - Customer: ${item.customer}`}
                    style={{ height: `${(item.customer / maxValue) * 100}%` }}
                  >
                    {item.customer > 0 && <span className="bar-value">{formatNumber(item.customer)}</span>}
                    <div className="grouped-bar user-customer" />
                  </div>
                  <div
                    className="grouped-bar-wrap"
                    title={`${item.label} - Hotel manager: ${item.hotelManager}`}
                    style={{ height: `${(item.hotelManager / maxValue) * 100}%` }}
                  >
                    {item.hotelManager > 0 && <span className="bar-value">{formatNumber(item.hotelManager)}</span>}
                    <div className="grouped-bar user-manager" />
                  </div>
                </div>
                <span className="axis-x-label">T{Number(item.month)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
      <div className="chart-legend">
        <span><i className="legend-dot user-customer" />Customer</span>
        <span><i className="legend-dot user-manager" />Hotel manager</span>
      </div>
      <div className="chart-footer-link">
        <a href="/admin/users">Quản lý người dùng</a>
      </div>
    </div>
  );
}

function MonthlyHotelChart({ data }) {
  const statusItems = [
    { key: 'approved', label: 'Đã duyệt', className: 'hotel-approved' },
    { key: 'pending', label: 'Chờ duyệt', className: 'hotel-pending' },
    { key: 'rejected', label: 'Từ chối', className: 'hotel-rejected' },
    { key: 'blocked', label: 'Đã khóa', className: 'hotel-blocked' },
  ];
  const maxValue = getNiceMax(Math.max(...data.map((item) => Math.max(...statusItems.map((status) => item[status.key] || 0))), 1));
  const ticks = getAxisTicks(maxValue);

  return (
    <div className="admin-chart-card">
      <div className="admin-card-header">
        <h2>Khách sạn theo tháng</h2>
        <p>Khách sạn đăng ký theo tháng và trạng thái hiện tại</p>
      </div>
      <div className="axis-scroll">
        <div className="axis-chart">
        <div className="axis-y-labels">
          {ticks.map((tick) => (
            <span key={tick}>{formatNumber(tick)}</span>
          ))}
        </div>
        <div className="axis-plot">
          <div className="axis-grid">
            {ticks.map((tick) => (
              <span key={tick} />
            ))}
          </div>
          <div className="grouped-monthly-bars hotel-grouped-monthly-bars">
            {data.map((item) => (
              <div className="grouped-month-item" key={item.month}>
                <div className="grouped-bars hotel-grouped-bars">
                  {statusItems.map((status) => {
                    const value = item[status.key] || 0;
                    return (
                      <div
                        className="grouped-bar-wrap hotel-bar-wrap"
                        key={status.key}
                        title={`${item.label} - ${status.label}: ${value}`}
                        style={{ height: `${(value / maxValue) * 100}%` }}
                      >
                        {value > 0 && <span className="bar-value">{formatNumber(value)}</span>}
                        <div className={`grouped-bar ${status.className}`} />
                      </div>
                    );
                  })}
                </div>
                <span className="axis-x-label">T{Number(item.month)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
      <div className="chart-legend compact">
        <span><i className="legend-dot hotel-approved" />Đã duyệt</span>
        <span><i className="legend-dot hotel-pending" />Chờ duyệt</span>
        <span><i className="legend-dot hotel-rejected" />Từ chối</span>
        <span><i className="legend-dot hotel-blocked" />Đã khóa</span>
      </div>
      <div className="chart-footer-link">
        <a href="/admin/hotels">Quản lý khách sạn</a>
      </div>
    </div>
  );
}

function StatusList({ title, data, labels }) {
  const entries = Object.entries(labels);
  const total = entries.reduce((sum, [key]) => sum + Number(data?.[key] || 0), 0) || 1;

  return (
    <div className="admin-panel">
      <div className="admin-card-header">
        <h2>{title}</h2>
      </div>
      <div className="status-list">
        {entries.map(([key, label]) => {
          const value = Number(data?.[key] || 0);
          return (
            <div className="status-row" key={key}>
              <div>
                <span>{label}</span>
                <strong>{formatNumber(value)}</strong>
              </div>
              <div className="status-progress">
                <i style={{ width: `${(value / total) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopHotelsTable({ title, hotels, mode }) {
  return (
    <div className="admin-panel">
      <div className="admin-card-header">
        <h2>{title}</h2>
      </div>
      <div className="top-hotels-list">
        {hotels.length === 0 ? (
          <div className="admin-empty">Chưa có dữ liệu</div>
        ) : hotels.map((hotel, index) => (
          <div className="top-hotel-row" key={hotel.hotelId || hotel._id || hotel.name}>
            <span className="rank">{index + 1}</span>
            <div className="top-hotel-info">
              <strong>{hotel.name}</strong>
              <small>{hotel.city || hotel.address?.city || 'Chưa có thành phố'}</small>
            </div>
            <div className="top-hotel-value">
              {mode === 'revenue'
                ? formatCurrency(hotel.revenue)
                : `${Number(hotel.avgRating || 0).toFixed(1)} sao`}
              <small>
                {mode === 'revenue'
                  ? `${formatNumber(hotel.bookings)} booking`
                  : `${formatNumber(hotel.totalReviews)} review`}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [year, setYear] = useState(new Date().getFullYear());
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, index) => currentYear - index);
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/admin/hotels/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
          params: { year },
        });
        setDashboard(res.data.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể tải dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [token, year]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const overview = dashboard?.overview || {};
  const newUsersToday = Number(overview.newUsersToday || 0);
  const newCustomersToday = Number(overview.newCustomersToday || 0);
  const newHotelManagersToday = Number(overview.newHotelManagersToday || 0);
  const newHotelsToday = Number(overview.newHotelsToday || 0);
  const newBookingsToday = Number(overview.newBookingsToday || 0);
  const usersBeforeToday = Math.max(Number(overview.totalUsers || 0) - newUsersToday, 0);
  const customersBeforeToday = Math.max(Number(overview.totalCustomers || 0) - newCustomersToday, 0);
  const hotelManagersBeforeToday = Math.max(Number(overview.totalHotelManagers || 0) - newHotelManagersToday, 0);
  const hotelsBeforeToday = Math.max(Number(overview.totalHotels || 0) - newHotelsToday, 0);
  const bookingsBeforeToday = Math.max(Number(overview.totalBookings || 0) - newBookingsToday, 0);

  return (
    <div className="admin-dashboard-page">
      <AdminSidebar />

      <main className="admin-dashboard-main">
        <div className="admin-dashboard-topbar">
          <div>
            <h1>Dashboard quản trị</h1>
            <p>Theo dõi tăng trưởng người dùng, khách sạn, booking và doanh thu hệ thống</p>
          </div>
          <div className="dashboard-actions">
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {yearOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <button className="logout-btn" onClick={handleLogout}>
              🚪 Đăng xuất
            </button>
          </div>
        </div>

        {loading ? (
          <div className="admin-dashboard-loading">Đang tải dashboard...</div>
        ) : (
          <>
            <section className="admin-kpi-grid">
              <KpiCard
                label="Người dùng"
                value={formatNumber(usersBeforeToday)}
                highlight={newUsersToday > 0 ? `+${formatNumber(newUsersToday)} hôm nay` : null}
                note={`${formatNumber(overview.blockedUsers)} bị khóa trong năm`}
              />
              <KpiCard
                label="Khách hàng"
                value={formatNumber(customersBeforeToday)}
                highlight={newCustomersToday > 0 ? `+${formatNumber(newCustomersToday)} hôm nay` : null}
              />
              <KpiCard
                label="Hotel manager"
                value={formatNumber(hotelManagersBeforeToday)}
                highlight={newHotelManagersToday > 0 ? `+${formatNumber(newHotelManagersToday)} hôm nay` : null}
              />
              <KpiCard
                label="Khách sạn"
                value={formatNumber(hotelsBeforeToday)}
                highlight={newHotelsToday > 0 ? `+${formatNumber(newHotelsToday)} hôm nay` : null}
                note={`${formatNumber(overview.pendingHotels)} chờ duyệt trong năm`}
              />
              <KpiCard
                label="Booking"
                value={formatNumber(bookingsBeforeToday)}
                highlight={newBookingsToday > 0 ? `+${formatNumber(newBookingsToday)} hôm nay` : null}
              />
              <KpiCard
                label="Doanh thu"
                value={formatCurrency(overview.totalRevenue)}
                note={`${formatNumber(overview.paidBookings)} booking đã trả tiền`}
              />
            </section>

            <section className="admin-chart-grid">
              <MonthlyHotelChart data={dashboard.monthlyHotels || []} />
              <MonthlyUserChart data={dashboard.monthlyUsers || []} />
            </section>

            <section className="admin-panel-grid">
              <StatusList title="Khách sạn theo trạng thái" data={dashboard.hotelStatus} labels={HOTEL_STATUS_LABELS} />
            </section>

            <section className="admin-panel-grid">
              <TopHotelsTable title="Top khách sạn theo doanh thu" hotels={dashboard.topHotelsByRevenue || []} mode="revenue" />
              <TopHotelsTable title="Top khách sạn theo đánh giá" hotels={dashboard.topHotelsByRating || []} mode="rating" />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
