import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../services/axiosInstance';
import './Statistics.css';

const STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  checked_in: 'Đã nhận phòng',
  checked_out: 'Đã trả phòng',
  completed: 'Hoàn thành',
  canceled: 'Đã hủy',
};

const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');
const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const formatThousand = (value) => Number(value || 0).toLocaleString('vi-VN', { maximumFractionDigits: 1 });

const getNiceMax = (value) => {
  if (value <= 1) return 1;
  if (value <= 5) return 5;
  if (value <= 10) return 10;
  if (value <= 100) return Math.ceil(value / 10) * 10;
  return Math.ceil(value / 100) * 100;
};

const getAxisTicks = (maxValue) => {
  const step = maxValue / 5;
  return Array.from({ length: 6 }, (_, index) => Math.round(maxValue - (step * index)));
};

const getCountAxisTicks = (value) => {
  const maxValue = Math.max(1, Math.ceil(value));
  const step = maxValue <= 5 ? 1 : Math.ceil(maxValue / 5);
  const top = Math.ceil(maxValue / step) * step;
  const ticks = [];

  for (let tick = top; tick >= 0; tick -= step) {
    ticks.push(tick);
  }

  return ticks;
};

function KpiCard({ label, value, note, highlight }) {
  return (
    <div className="manager-stat-kpi">
      <span>{label}</span>
      <div className="manager-kpi-value">
        <strong>{value}</strong>
        {highlight && <sup>{highlight}</sup>}
      </div>
      {note && <small>{note}</small>}
    </div>
  );
}

function RevenueChart({ data }) {
  const thousandData = data.map((item) => ({
    ...item,
    roomRevenueThousand: item.roomRevenue / 1000,
    serviceRevenueThousand: item.serviceRevenue / 1000,
  }));
  const maxValue = getNiceMax(Math.max(...thousandData.map((item) => Math.max(item.roomRevenueThousand, item.serviceRevenueThousand)), 1));
  const ticks = getAxisTicks(maxValue);

  return (
    <div className="manager-stat-card wide">
      <div className="manager-stat-card-header">
        <h3>Doanh thu theo tháng</h3>
        <p>Doanh thu của phòng và dịch vụ</p>
      </div>
      <div className="manager-axis-scroll">
        <div className="manager-axis-unit">Nghìn đồng</div>
        <div className="manager-axis-chart">
          <div className="manager-axis-y">
            {ticks.map((tick) => <span key={tick}>{formatThousand(tick)}</span>)}
          </div>
          <div className="manager-axis-plot">
            <div className="manager-axis-grid">
              {ticks.map((tick) => <span key={tick} />)}
            </div>
            <div className="manager-month-bars">
              {thousandData.map((item) => (
                <div className="manager-month-item" key={item.month}>
                  <div className="manager-group-bars">
                    <div
                      className="manager-bar-wrap"
                      title={`${item.label} - Phòng: ${formatCurrency(item.roomRevenue)}`}
                      style={{ height: `${(item.roomRevenueThousand / maxValue) * 100}%` }}
                    >
                      {item.roomRevenue > 0 && <span>{formatThousand(item.roomRevenueThousand)}</span>}
                      <i className="room-revenue" />
                    </div>
                    <div
                      className="manager-bar-wrap"
                      title={`${item.label} - Dịch vụ: ${formatCurrency(item.serviceRevenue)}`}
                      style={{ height: `${(item.serviceRevenueThousand / maxValue) * 100}%` }}
                    >
                      {item.serviceRevenue > 0 && <span>{formatThousand(item.serviceRevenueThousand)}</span>}
                      <i className="service-revenue" />
                    </div>
                  </div>
                  <small>T{Number(item.month)}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="manager-stat-legend">
        <span><i className="room-revenue" />Doanh thu phòng</span>
        <span><i className="service-revenue" />Doanh thu dịch vụ</span>
      </div>
    </div>
  );
}

function MonthlyReviewChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.totalReviews || 0), 1);
  const ticks = getCountAxisTicks(maxValue);
  const axisMax = ticks[0] || 1;

  return (
    <div className="manager-stat-card wide">
      <div className="manager-stat-card-header">
        <h3>Bình luận theo tháng</h3>
        <p>Số bình luận theo tháng</p>
      </div>
      <div className="manager-axis-scroll">
        <div className="manager-axis-chart manager-review-axis-chart">
          <div className="manager-axis-y">
            {ticks.map((tick) => <span key={tick}>{formatNumber(tick)}</span>)}
          </div>
          <div className="manager-axis-plot">
            <div className="manager-axis-grid">
              {ticks.map((tick) => <span key={tick} />)}
            </div>
            <div className="manager-month-bars manager-review-month-bars">
              {data.map((item) => (
                <div className="manager-month-item" key={item.month}>
                  <div className="manager-group-bars manager-review-group-bars">
                    <div
                      className="manager-bar-wrap manager-review-bar-wrap"
                      title={`${item.label}: ${formatNumber(item.totalReviews)} bình luận`}
                      style={{ height: `${((item.totalReviews || 0) / axisMax) * 100}%` }}
                    >
                      {item.totalReviews > 0 && <span>{formatNumber(item.totalReviews)}</span>}
                      <i className="review-count" />
                    </div>
                  </div>
                  <small>T{Number(item.month)}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="manager-stat-legend">
        <span><i className="review-count" />Số bình luận</span>
      </div>
    </div>
  );
}

function StatusPanel({ data }) {
  const entries = Object.entries(STATUS_LABELS);
  const total = entries.reduce((sum, [key]) => sum + Number(data?.[key] || 0), 0) || 1;

  return (
    <div className="manager-stat-card">
      <div className="manager-stat-card-header">
        <h3>Booking theo trạng thái</h3>
      </div>
      <div className="manager-status-list">
        {entries.map(([key, label]) => {
          const value = data?.[key] || 0;
          return (
            <div className="manager-status-row" key={key}>
              <div>
                <span>{label}</span>
                <strong>{formatNumber(value)}</strong>
              </div>
              <div className="manager-progress"><i style={{ width: `${(value / total) * 100}%` }} /></div>
            </div>
          );
        })}
      </div>
      <div className="manager-card-footer-link">
        <a href="/manager?tab=bookings">Quản lý đặt phòng</a>
      </div>
    </div>
  );
}

function TopList({ title, items, type, linkLabel, linkTo }) {
  return (
    <div className="manager-stat-card">
      <div className="manager-stat-card-header">
        <h3>{title}</h3>
      </div>
      <div className="manager-top-list">
        {items.length === 0 ? (
          <div className="manager-stat-empty">Chưa có dữ liệu</div>
        ) : items.map((item, index) => (
          <div className="manager-top-row" key={`${item.name}-${index}`}>
            <span>{index + 1}</span>
            <div>
              <strong>{item.name || 'Không có tên'}</strong>
              <small>{formatNumber(item.quantity)} {type === 'room' ? 'phòng đã bán' : 'lượt dùng'}</small>
            </div>
            <b>{formatCurrency(item.revenue)}</b>
          </div>
        ))}
      </div>
      {linkTo && (
        <div className="manager-card-footer-link">
          <a href={linkTo}>{linkLabel}</a>
        </div>
      )}
    </div>
  );
}

function ReviewPanel({ distribution }) {
  const total = distribution.reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <div className="manager-stat-card wide">
      <div className="manager-stat-card-header">
        <h3>Đánh giá theo số sao</h3>
      </div>
      <div className="rating-bars rating-bars-wide">
        {distribution.map((item) => (
          <div className="rating-row" key={item.rating}>
            <span>{item.rating} sao</span>
            <div><i style={{ width: `${(item.count / total) * 100}%` }} /></div>
            <strong>{formatNumber(item.count)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Statistics() {
  const { token } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, index) => currentYear - index);
  }, []);

  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/bookings/manager/statistics', {
          headers: { Authorization: `Bearer ${token}` },
          params: { year },
        });
        setData(res.data.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể tải thống kê');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [token, year]);

  const overview = data?.overview || {};
  const totalRevenueToday = Number(overview.totalRevenueToday || 0);
  const roomRevenueToday = Number(overview.roomRevenueToday || 0);
  const serviceRevenueToday = Number(overview.serviceRevenueToday || 0);
  const bookingsToday = Number(overview.bookingsToday || 0);
  const reviewsToday = Number(overview.reviewsToday || 0);
  const todayCheckIns = Number(overview.todayCheckIns || 0);
  const totalRevenueBeforeToday = Math.max(Number(overview.totalRevenue || 0) - totalRevenueToday, 0);
  const roomRevenueBeforeToday = Math.max(Number(overview.roomRevenue || 0) - roomRevenueToday, 0);
  const serviceRevenueBeforeToday = Math.max(Number(overview.serviceRevenue || 0) - serviceRevenueToday, 0);
  const bookingsBeforeToday = Math.max(Number(overview.totalBookings || 0) - bookingsToday, 0);
  const reviewsBeforeToday = Math.max(Number(overview.totalReviews || 0) - reviewsToday, 0);
  const currentStaysBeforeToday = Math.max(Number(overview.currentStays || 0) - todayCheckIns, 0);

  return (
    <div className="manager-statistics">
      <div className="manager-stat-topbar">
        <div>
          <h2>Thống kê khách sạn</h2>
          <p className="manager-hotel-rating-line">
            <span>{data?.hotel?.name || 'Theo dõi doanh thu, booking, phòng và đánh giá'}</span>
            {data?.hotel?.name && (
              <span className="manager-hotel-rating">
                {Number(overview.overallAvgRating || 0).toFixed(1)}
                <span aria-hidden="true">★</span>
              </span>
            )}
          </p>
        </div>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {yearOptions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="manager-stat-loading">Đang tải thống kê...</div>
      ) : (
        <>
          <section className="manager-stat-kpi-grid">
            <KpiCard
              label="Doanh thu trong năm"
              value={formatCurrency(totalRevenueBeforeToday)}
              highlight={totalRevenueToday > 0 ? `+${formatCurrency(totalRevenueToday)} hôm nay` : null}
              note={`${formatNumber(overview.paidBookings)} booking đã thanh toán`}
            />
            <KpiCard
              label="Doanh thu phòng"
              value={formatCurrency(roomRevenueBeforeToday)}
              highlight={roomRevenueToday > 0 ? `+${formatCurrency(roomRevenueToday)} hôm nay` : null}
            />
            <KpiCard
              label="Doanh thu dịch vụ"
              value={formatCurrency(serviceRevenueBeforeToday)}
              highlight={serviceRevenueToday > 0 ? `+${formatCurrency(serviceRevenueToday)} hôm nay` : null}
            />
            <KpiCard
              label="Khách đang ở"
              value={formatNumber(currentStaysBeforeToday)}
              highlight={todayCheckIns > 0 ? `+${formatNumber(todayCheckIns)} hôm nay` : null}
              note={`${formatNumber(overview.todayCheckOuts)} check-out hôm nay`}
            />
            <KpiCard
              label="Booking trong năm"
              value={formatNumber(bookingsBeforeToday)}
              highlight={bookingsToday > 0 ? `+${formatNumber(bookingsToday)} hôm nay` : null}
            />
            <KpiCard
              label="Tổng số bình luận"
              value={formatNumber(reviewsBeforeToday)}
              highlight={reviewsToday > 0 ? `+${formatNumber(reviewsToday)} hôm nay` : null}
              note="Trong năm"
            />
            <KpiCard
              label="Sao trung bình"
              value={Number(overview.yearAvgRating || 0).toFixed(1)}
              note="Trong năm"
            />
            <KpiCard
              label="Phòng đang quản lý"
              value={formatNumber(overview.totalRooms)}
              note={`${formatNumber(overview.totalRoomTypes)} loại phòng`}
            />
          </section>

          <section className="manager-stat-grid">
            <RevenueChart data={data.monthlyRevenue || []} />
          </section>

          <section className="manager-stat-grid">
            <MonthlyReviewChart data={data.monthlyReviews || []} />
          </section>

          <section className="manager-stat-grid">
            <StatusPanel data={data.bookingStatus} />
          </section>

          <section className="manager-stat-grid">
            <ReviewPanel distribution={data.ratingDistribution || []} />
          </section>

          <section className="manager-stat-grid two">
            <TopList
              title="Top loại phòng theo doanh thu"
              items={data.topRooms || []}
              type="room"
              linkLabel="Quản lý phòng"
              linkTo="/manager?tab=rooms"
            />
            <TopList
              title="Top dịch vụ theo doanh thu"
              items={data.topServices || []}
              type="service"
              linkLabel="Quản lý dịch vụ"
              linkTo="/manager?tab=services"
            />
          </section>

        </>
      )}
    </div>
  );
}
