import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './AuthPage.css';
import { toast } from 'react-toastify';

import { registerUser, loginUser } from '../../services/authServices';
import { useAuth } from '../../contexts/AuthContext';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const clearForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const switchTab = (toLogin) => {
    setIsLogin(toLogin);
    clearForm();
  };

  // ─── LOGIN ────────────────────────────────────────────────────────────────

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('Vui lòng nhập email và mật khẩu!');
      return;
    }

    try {
      const res = await loginUser({
        email: formData.email,
        password: formData.password,
      });

      // Lưu vào context (và localStorage)
      login(res.data.user, res.data.token);

      if (res.data.user?.role?.[0] === 'admin') {
        navigate('/admin');
        toast.success('Đăng nhập thành công!');
        return;
      }

      toast.success('Đăng nhập thành công!');
      navigate('/'); // chuyển về trang chủ (chỉnh lại route nếu cần)
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  // ─── REGISTER ─────────────────────────────────────────────────────────────

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu không khớp!');
      return;
    }

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
      };

      await registerUser(payload);

      toast.success('Đăng ký thành công! Vui lòng đăng nhập để trải nghiệm!');
      clearForm();

      setTimeout(() => {
        setIsLogin(true);
      }, 1200);
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* LEFT */}
        <div className="auth-left">
          <div>
            <span className="auth-badge">✈️ Travel Booking</span>
            <h1>Khám phá thế giới cùng chúng tôi</h1>
            <p>Đặt khách sạn nhanh chóng, an toàn và tiện lợi cho mọi chuyến đi.</p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="auth-right">

          <div className="auth-tabs">
            <button
              type="button"
              className={isLogin ? 'active' : ''}
              onClick={() => switchTab(true)}
            >
              Đăng nhập
            </button>

            <button
              type="button"
              className={!isLogin ? 'active' : ''}
              onClick={() => switchTab(false)}
            >
              Đăng ký
            </button>
          </div>

          {isLogin ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <h2>Chào mừng trở lại 👋</h2>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Nhập email..."
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Mật khẩu</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Nhập mật khẩu..."
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="btn btn-primary auth-btn">
                Đăng nhập
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleRegister}>
              <h2>Tạo tài khoản mới</h2>

              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First name..."
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last name..."
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="Nhập số điện thoại..."
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Nhập email..."
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Mật khẩu</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Nhập mật khẩu..."
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Xác nhận mật khẩu</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Nhập lại mật khẩu..."
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="btn btn-primary auth-btn">
                Đăng ký
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

export default AuthPage;
