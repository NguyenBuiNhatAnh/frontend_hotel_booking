import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAccountPopup, setShowAccountPopup] = useState(false);

  const avatarLetter = user?.email?.[0]?.toUpperCase() || '?';
  const displayName = user?.firstName || user?.lastName
    ? `${user.lastName || ''} ${user.firstName || ''}`.trim()
    : user?.email;

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất!');
    navigate('/auth');
  };

  const renderRoleButton = () => {
    if (!user) return null;

    if (user.role?.includes('hotel_manager')) {
      return (
        <Link to="/manager">
          <button className="btn btn-primary">Quản lý khách sạn</button>
        </Link>
      );
    }

    return (
      <Link to="/register-hotel">
        <button className="btn btn-ghost">Đăng ký khách sạn</button>
      </Link>
    );
  };

  return (
    <header className="main-header">
      <div className="container header-content">
        <div className="logo">
          <Link title="Trang chu" to="/">
            <span className="logo-text">
              <span className="accent">Hello</span>
              <span className="base">Booking</span>
            </span>
          </Link>
        </div>

        <nav className="nav-links">
          <Link to="/" className={isActive('/') ? 'active' : ''}>
            Trang chủ
          </Link>
          <Link to="/hotels" className={isActive('/hotels') ? 'active' : ''}>
            Khách sạn
          </Link>
          <Link to="/my-bookings" className={isActive('/my-bookings') ? 'active' : ''}>
            Booking của tôi
          </Link>
        </nav>

        <div className="auth-buttons">
          {user ? (
            <>
              {renderRoleButton()}

              <div className="header-divider" />

              <button
                type="button"
                className="user-info"
                onClick={() => setShowAccountPopup(true)}
              >
                <div className="user-avatar">{avatarLetter}</div>
                <span className="user-name">{displayName}</span>
              </button>

              <button className="btn btn-outline" onClick={handleLogout}>
                Đăng xuất
              </button>

              {showAccountPopup && (
                <div
                  className="account-modal"
                  role="dialog"
                  aria-modal="true"
                  onMouseDown={() => setShowAccountPopup(false)}
                >
                  <div className="account-backdrop" />
                  <div className="account-menu" onMouseDown={(e) => e.stopPropagation()}>
                    <div className="account-menu-header">
                      <strong>{displayName || 'Tai khoan'}</strong>
                      <span>{user.email}</span>
                    </div>
                    <Link to="/account/profile" onClick={() => setShowAccountPopup(false)}>
                      Cập nhật thông tin
                    </Link>
                    <Link to="/account/change-password" onClick={() => setShowAccountPopup(false)}>
                      Đổi mật khẩu
                    </Link>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Link to="/auth">
              <button className="btn btn-primary">Đăng nhập</button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
