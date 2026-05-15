import { useNavigate } from 'react-router-dom';
import './Payment.css';

export default function PaymentFailed() {
  const navigate = useNavigate();

  return (
    <div className="payment-page">
      <div className="payment-card">
        <div className="payment-icon-circle failed">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>

        <div className="payment-badge failed">Thanh toán thất bại</div>
        <h2 className="payment-title">Giao dịch không thành công</h2>
        <p className="payment-sub">Vui lòng kiểm tra lại thông tin thẻ hoặc thử phương thức khác</p>

        <div className="payment-divider" />

        <div className="payment-actions">
          <button className="btn btn-danger" onClick={() => navigate(-1)}>
            Thử lại
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/my-bookings')}>
            Quay lại booking
          </button>
        </div>
      </div>
    </div>
  );
}
