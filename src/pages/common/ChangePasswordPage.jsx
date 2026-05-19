import { useState } from 'react';
import { toast } from 'react-toastify';

import { useAuth } from '../../contexts/AuthContext';
import { changePassword } from '../../services/userService';
import './AccountPages.css';

export default function ChangePasswordPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    try {
      setLoading(true);
      await changePassword({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      }, token);
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Đổi mật khẩu thành công!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-page">
      <div className="account-panel">
        <h1>Đổi mật khẩu</h1>
        <p>Nhập mật khẩu hiện tại và mật khẩu mới của bạn.</p>

        <form className="account-page-form" onSubmit={handleSubmit}>
          <label>
            <span>Mật khẩu hiện tại</span>
            <input type="password" name="oldPassword" value={form.oldPassword} onChange={handleChange} />
          </label>
          <label>
            <span>Mật khẩu mới</span>
            <input type="password" name="newPassword" value={form.newPassword} onChange={handleChange} />
          </label>
          <label>
            <span>Xác nhận mật khẩu</span>
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}
