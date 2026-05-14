import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect admin ngay khi login
  // useEffect(() => {
  //   if (user?.role?.[0] === 'admin') {
  //     navigate('/admin');
  //   }
  // }, [user]);

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất!');
    navigate('/auth');
  };

  // Lấy chữ cái đầu của email làm avatar
  const avatarLetter = user?.email?.[0]?.toUpperCase() || '?';

  const isActive = (path) => location.pathname === path;

  const renderRoleButton = () => {
    if (!user) return null;
    const role = user.role;

    if (role?.includes('hotel_manager')) {
      return (
        <Link to="/manager/hotels">
          <button className="btn btn-primary">
            🏨 Quản lý khách sạn
          </button>
        </Link>
      );
    }

    // customer
    return (
      <Link to="/register-hotel">
        <button className="btn btn-ghost">
          ➕ Đăng ký khách sạn
        </button>
      </Link>
    );
  };

  return (
    <header className="main-header">
      <div className="container header-content">

        {/* Logo */}
        <div className="logo">
          <Link title="Trang chủ" to="/">
            <span className="logo-text">
              <span className="accent">Hello</span>
              <span className="base">Booking</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
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

        {/* Auth Buttons */}
        <div className="auth-buttons">
          {user ? (
            <>
              {renderRoleButton()}

              <div className="header-divider" />

              <div className="user-info">
                <div className="user-avatar">{avatarLetter}</div>
                <span className="user-name">{user.email}</span>
              </div>

              <button className="btn btn-outline" onClick={handleLogout}>
                🚪 Đăng xuất
              </button>
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
