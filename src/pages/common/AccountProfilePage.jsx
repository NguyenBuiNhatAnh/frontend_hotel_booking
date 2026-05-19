import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { useAuth } from '../../contexts/AuthContext';
import { updateProfile } from '../../services/userService';
import './AccountPages.css';

export default function AccountProfilePage() {
  const { user, token, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  useEffect(() => {
    if (!user) return;

    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
    });
  }, [user]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const res = await updateProfile(form, token);
      updateUser(res.data);
      toast.success('Cập nhật thông tin thành công!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-page">
      <div className="account-panel">
        <h1>Cập nhật thông tin</h1>
        <p>{user?.email}</p>

        <form className="account-page-form" onSubmit={handleSubmit}>
          <div className="account-page-grid">
            <label>
              <span>Tên</span>
              <input name="firstName" value={form.firstName} onChange={handleChange} />
            </label>
            <label>
              <span>Họ</span>
              <input name="lastName" value={form.lastName} onChange={handleChange} />
            </label>
          </div>

          <label>
            <span>Số điện thoại</span>
            <input name="phone" value={form.phone} onChange={handleChange} />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </form>
      </div>
    </div>
  );
}
