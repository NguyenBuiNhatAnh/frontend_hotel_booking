import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất!');
    navigate('/auth');
  };

  return (
    <header className="main-header">
      <div className="container header-content">
        {/* Logo */}
        <div className="logo">
          <Link title="Trang chủ" to="/">
            <span style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>
              Hello<span style={{ color: 'var(--text-main)' }}>Booking</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="nav-links">
          <Link to="/">Trang chủ</Link>
          <Link to="/hotels">Khách sạn</Link>
          <Link to="/my-bookings">Booking của tôi</Link>
        </nav>

        {/* Auth Buttons */}
        <div className="auth-buttons">
          {user ? (
            <div className="user-info">
              <span className="user-name">👤 {user.email}</span>
              <button className="btn btn-outline" onClick={handleLogout}>
                🚪 Đăng xuất
              </button>
            </div>
          ) : (
            <Link to="/auth">
              <button className="btn btn-outline">Đăng nhập</button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;