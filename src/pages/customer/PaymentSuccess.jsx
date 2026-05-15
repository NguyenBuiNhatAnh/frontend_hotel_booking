import { useSearchParams, useNavigate } from 'react-router-dom';
import './Payment.css';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = params.get('bookingId');

  return (
    <div className="payment-page">
      <div className="payment-card">
        <div className="payment-icon-circle success">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>

        <div className="payment-badge success">Thanh toán thành công</div>
        <h2 className="payment-title">Đặt phòng đã xác nhận!</h2>
        <p className="payment-sub">Chúng tôi đã gửi xác nhận qua email của bạn</p>

        {bookingId && (
          <>
            <div className="payment-divider" />
            <div className="payment-info-row">
              <span>Mã booking</span>
              <span>#{bookingId.slice(-6).toUpperCase()}</span>
            </div>
            <div className="payment-divider" />
          </>
        )}

        <div className="payment-actions">
          <button className="btn btn-primary" onClick={() => navigate('/my-bookings')}>
            Xem booking của tôi
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
