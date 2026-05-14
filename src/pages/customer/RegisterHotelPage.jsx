import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../services/axiosInstance';
import { toast } from 'react-toastify';
import './RegisterHotelPage.css';

const AMENITIES_OPTIONS = [
  { value: 'WiFi',        icon: '📶', label: 'WiFi' },
  { value: 'Pool',        icon: '🏊', label: 'Hồ bơi' },
  { value: 'Gym',         icon: '🏋️', label: 'Phòng gym' },
  { value: 'Breakfast',   icon: '🍳', label: 'Bữa sáng' },
  { value: 'Parking',     icon: '🅿️', label: 'Bãi đỗ xe' },
  { value: 'Spa',         icon: '💆', label: 'Spa' },
  { value: 'Restaurant',  icon: '🍽️', label: 'Nhà hàng' },
  { value: 'Bar',         icon: '🍹', label: 'Bar' },
  { value: 'Airport',     icon: '✈️', label: 'Đưa đón sân bay' },
  { value: 'Pet',         icon: '🐾', label: 'Thú cưng' },
];

const MAX_IMAGES = 6;

export default function RegisterHotelPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    street: '',
    ward: '',
    city: '',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    amenities: [],
  });
  const [images, setImages] = useState([]); // [{ file, preview }]

  // ── Form handlers ──────────────────────────────────────────
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleAmenity = (value) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(value)
        ? prev.amenities.filter((a) => a !== value)
        : [...prev.amenities, value],
    }));
  };

  // ── Image handlers ─────────────────────────────────────────
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const remaining = MAX_IMAGES - images.length;
    const selected = files.slice(0, remaining);

    const newImages = selected.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
    e.target.value = ''; // reset input
  };

  const removeImage = (index) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) return toast.error('Vui lòng nhập tên khách sạn!');
    if (!form.street.trim() || !form.ward.trim() || !form.city.trim())
      return toast.error('Vui lòng nhập đầy đủ địa chỉ!');
    if (!form.description.trim())
      return toast.error('Vui lòng nhập mô tả khách sạn!');

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('description', form.description.trim());
      formData.append('address[street]', form.street.trim());
      formData.append('address[ward]', form.ward.trim());
      formData.append('address[city]', form.city.trim());
      formData.append('checkInTime', form.checkInTime);
      formData.append('checkOutTime', form.checkOutTime);
      form.amenities.forEach((a) => formData.append('amenities[]', a));
      images.forEach(({ file }) => formData.append('images', file));

      await axiosInstance.post('/hotels', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Đăng ký khách sạn thành công! Vui lòng chờ admin duyệt.');
      navigate('/');
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Đăng ký thất bại, thử lại sau!'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="register-hotel-page">
      <div className="container">

        {/* Page Header */}
        <div className="rh-page-header">
          <div className="rh-badge">✈️ Dành cho đối tác</div>
          <h1>Đăng ký khách sạn</h1>
          <p>
            Điền đầy đủ thông tin bên dưới. Sau khi gửi, admin sẽ xem xét
            và duyệt khách sạn của bạn trong vòng 1–2 ngày làm việc.
          </p>
        </div>

        <form className="rh-form" onSubmit={handleSubmit}>

          {/* ── Thông tin cơ bản ── */}
          <div className="rh-section">
            <h2 className="rh-section-title">
              <span className="rh-step">1</span>
              Thông tin cơ bản
            </h2>

            <div className="rh-field">
              <label>Tên khách sạn <span className="required">*</span></label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="VD: Sunrise Hotel"
              />
            </div>

            <div className="rh-field">
              <label>Mô tả <span className="required">*</span></label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Mô tả về khách sạn, vị trí, phong cách, điểm nổi bật..."
              />
            </div>

            <div className="rh-row-2">
              <div className="rh-field">
                <label>Giờ check-in</label>
                <input
                  type="time"
                  name="checkInTime"
                  value={form.checkInTime}
                  onChange={handleChange}
                />
              </div>
              <div className="rh-field">
                <label>Giờ check-out</label>
                <input
                  type="time"
                  name="checkOutTime"
                  value={form.checkOutTime}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* ── Địa chỉ ── */}
          <div className="rh-section">
            <h2 className="rh-section-title">
              <span className="rh-step">2</span>
              Địa chỉ
            </h2>

            <div className="rh-field">
              <label>Số nhà, tên đường <span className="required">*</span></label>
              <input
                type="text"
                name="street"
                value={form.street}
                onChange={handleChange}
                placeholder="VD: 123 Nguyễn Trãi"
              />
            </div>

            <div className="rh-row-2">
              <div className="rh-field">
                <label>Phường / Xã <span className="required">*</span></label>
                <input
                  type="text"
                  name="ward"
                  value={form.ward}
                  onChange={handleChange}
                  placeholder="VD: Phường 5"
                />
              </div>
              <div className="rh-field">
                <label>Thành phố <span className="required">*</span></label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="VD: Hồ Chí Minh"
                />
              </div>
            </div>
          </div>

          {/* ── Tiện nghi ── */}
          <div className="rh-section">
            <h2 className="rh-section-title">
              <span className="rh-step">3</span>
              Tiện nghi
            </h2>

            <div className="amenities-grid">
              {AMENITIES_OPTIONS.map((item) => {
                const selected = form.amenities.includes(item.value);
                return (
                  <button
                    key={item.value}
                    type="button"
                    className={`amenity-chip ${selected ? 'selected' : ''}`}
                    onClick={() => toggleAmenity(item.value)}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                    {selected && <span className="check">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Hình ảnh ── */}
          <div className="rh-section">
            <h2 className="rh-section-title">
              <span className="rh-step">4</span>
              Hình ảnh
              <span className="rh-step-note">Tối đa {MAX_IMAGES} ảnh</span>
            </h2>

            <div className="image-grid">
              {images.map((img, i) => (
                <div key={i} className="image-preview">
                  <img src={img.preview} alt={`preview-${i}`} />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => removeImage(i)}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {images.length < MAX_IMAGES && (
                <label className="image-upload-box">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    hidden
                  />
                  <span className="upload-icon">📷</span>
                  <span>Thêm ảnh</span>
                  <small>{images.length}/{MAX_IMAGES}</small>
                </label>
              )}
            </div>
          </div>

          {/* ── Submit ── */}
          <div className="rh-submit">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  Đang gửi...
                </>
              ) : (
                '🚀 Gửi đăng ký'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
