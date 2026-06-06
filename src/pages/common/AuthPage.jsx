import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './AuthPage.css';
import { toast } from 'react-toastify';

import { forgotPassword, loginUser, registerUser, resetPassword } from '../../services/authServices';
import { useAuth } from '../../contexts/AuthContext';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState('email');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    otp: '',
    password: '',
    confirmPassword: '',
  });

  const clearForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      otp: '',
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

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timerId = setTimeout(() => {
      setResendCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearTimeout(timerId);
  }, [resendCooldown]);

  const switchTab = (toLogin) => {
    setIsLogin(toLogin);
    setIsForgotPassword(false);
    setForgotStep('email');
    setResendCooldown(0);
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
        navigate('/admin/dashboard');
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!formData.email) {
      toast.error('Vui lòng nhập email để khôi phục mật khẩu!');
      return;
    }

    try {
      setForgotLoading(true);
      const res = await forgotPassword({ email: formData.email });
      setForgotStep('reset');
      setResendCooldown(res.data?.resendAfterSeconds || 60);
      toast.success('OTP đã được gửi đến email của bạn!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || forgotLoading) return;

    if (!formData.email) {
      toast.error('Vui lòng nhập email để gửi lại OTP!');
      return;
    }

    try {
      setForgotLoading(true);
      const res = await forgotPassword({ email: formData.email });
      setResendCooldown(res.data?.resendAfterSeconds || 60);
      toast.success('OTP mới đã được gửi đến email!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.otp || !formData.password || !formData.confirmPassword) {
      toast.error('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    try {
      setForgotLoading(true);
      await resetPassword({
        email: formData.email,
        otp: formData.otp,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.');
      clearForm();
      setIsForgotPassword(false);
      setForgotStep('email');
      setResendCooldown(0);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setForgotLoading(false);
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
            <h1>Khám phá Việt Nam cùng chúng tôi</h1>
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

          {isLogin && !isForgotPassword ? (
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

              <div className="auth-form-extra">
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setFormData((prev) => ({ ...prev, password: '' }));
                  }}
                >
                  Quên mật khẩu?
                </button>
              </div>

              <button type="submit" className="btn btn-primary auth-btn">
                Đăng nhập
              </button>
            </form>
          ) : isLogin && isForgotPassword ? (
            <form
              className="auth-form"
              onSubmit={forgotStep === 'email' ? handleForgotPassword : handleResetPassword}
            >
              <h2>Khôi phục mật khẩu</h2>
              <p className="auth-helper-text">
                Nhập email tài khoản của bạn để tiếp tục khôi phục mật khẩu.
              </p>

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

              {forgotStep === 'reset' && (
                <>
                  <div className="form-group">
                    <label>Mã OTP</label>
                    <input
                      type="text"
                      name="otp"
                      placeholder="Nhập 6 số OTP..."
                      value={formData.otp}
                      onChange={handleChange}
                      maxLength="6"
                    />
                  </div>

                  <div className="form-group">
                    <label>Mật khẩu mới</label>
                    <input
                      type="password"
                      name="password"
                      placeholder="Nhập mật khẩu mới..."
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
                </>
              )}

              <button type="submit" className="btn btn-primary auth-btn" disabled={forgotLoading}>
                {forgotLoading
                  ? (forgotStep === 'email' ? 'Đang gửi...' : 'Đang đặt lại...')
                  : (forgotStep === 'email' ? 'Gửi OTP' : 'Đặt lại mật khẩu')}
              </button>

              {forgotStep === 'reset' && (
                <button
                  type="button"
                  className="resend-otp-btn"
                  onClick={handleResendOtp}
                  disabled={forgotLoading || resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Gửi lại OTP sau ${resendCooldown}s` : 'Gửi lại OTP'}
                </button>
              )}

              <button
                type="button"
                className="back-login-btn"
                onClick={() => setIsForgotPassword(false)}
              >
                Quay lại đăng nhập
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
