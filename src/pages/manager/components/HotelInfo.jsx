// pages/manager/components/HotelInfo.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../services/axiosInstance';
import { toast } from 'react-toastify';
import './HotelInfo.css';

export default function HotelInfo() {
  const { token } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: { street: '', ward: '', city: '' },
    description: '',
    amenities: [],
    checkInTime: '',
    checkOutTime: ''
  });
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Lấy thông tin khách sạn
  const fetchHotel = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/hotels/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const hotelData = res.data.data;
      setHotel(hotelData);
      // Gán vào form khi chuyển edit mode
      setFormData({
        name: hotelData.name,
        address: { ...hotelData.address },
        description: hotelData.description,
        amenities: hotelData.amenities || [],
        checkInTime: hotelData.checkInTime,
        checkOutTime: hotelData.checkOutTime
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải thông tin khách sạn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotel();
  }, []);

  // Cập nhật thông tin khách sạn
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        description: formData.description,
        amenities: formData.amenities,
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime
      };
      const res = await axiosInstance.patch('/hotels/', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHotel(res.data.data);
      toast.success('Cập nhật thông tin thành công');
      setEditMode(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Upload ảnh mới
  const handleUploadImages = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const formDataUpload = new FormData();
    files.forEach(file => formDataUpload.append('images', file));

    setUploading(true);
    try {
      const res = await axiosInstance.patch('/hotels/me/images', formDataUpload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      // Cập nhật lại danh sách ảnh từ response
      setHotel(prev => ({ ...prev, image: res.data.data.images }));
      toast.success(`Đã thêm ${files.length} ảnh thành công`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload ảnh thất bại');
    } finally {
      setUploading(false);
      e.target.value = ''; // reset input file
    }
  };

  // Xóa ảnh
  const handleDeleteImage = async (publicId) => {
    if (!window.confirm('Bạn có chắc muốn xóa ảnh này?')) return;
    setDeletingId(publicId);
    try {
      await axiosInstance.delete(`/hotels/me/images?public_id=${publicId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Cập nhật lại danh sách ảnh: lọc bỏ ảnh đã xóa
      setHotel(prev => ({
        ...prev,
        image: prev.image.filter(img => img.public_id !== publicId)
      }));
      toast.success('Xóa ảnh thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa ảnh thất bại');
    } finally {
      setDeletingId(null);
    }
  };

  // Helper xử lý amenities string
  const handleAmenitiesChange = (e) => {
    const value = e.target.value;
    const arr = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({ ...prev, amenities: arr }));
  };

  if (loading && !hotel) return <div className="loading-spinner">Đang tải...</div>;
  if (!hotel) return <div className="empty-state">Không tìm thấy khách sạn. Hãy liên hệ admin.</div>;

  return (
    <div className="hotel-info">
      <div className="info-header">
        <h2>Thông tin khách sạn</h2>
        {!editMode && (
          <button className="btn-edit" onClick={() => setEditMode(true)}>✏️ Chỉnh sửa</button>
        )}
      </div>

      {editMode ? (
        <form onSubmit={handleUpdate} className="hotel-form">
          <div className="form-group">
            <label>Tên khách sạn</label>
            <input
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Đường</label>
              <input
                value={formData.address.street}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
              />
            </div>
            <div className="form-group">
              <label>Phường/Xã</label>
              <input
                value={formData.address.ward}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, ward: e.target.value } })}
              />
            </div>
            <div className="form-group">
              <label>Thành phố</label>
              <input
                value={formData.address.city}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              rows="4"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Check-in</label>
              <input
                type="time"
                value={formData.checkInTime}
                onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Check-out</label>
              <input
                type="time"
                value={formData.checkOutTime}
                onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Tiện nghi (cách nhau bằng dấu phẩy)</label>
            <input
              value={formData.amenities.join(', ')}
              onChange={handleAmenitiesChange}
              placeholder="VD: WiFi, Pool, Gym"
            />
          </div>
          <div className="form-actions">
            <button type="submit" disabled={loading}>💾 Lưu</button>
            <button type="button" onClick={() => setEditMode(false)}>Hủy</button>
          </div>
        </form>
      ) : (
        <>
          <div className="hotel-detail">
            <div className="detail-section">
              <h3>🏨 Tên khách sạn</h3>
              <p>{hotel.name}</p>
            </div>
            <div className="detail-section">
              <h3>📍 Địa chỉ</h3>
              <p>{hotel.address?.street}, {hotel.address?.ward}, {hotel.address?.city}</p>
            </div>
            <div className="detail-section">
              <h3>📝 Mô tả</h3>
              <p>{hotel.description}</p>
            </div>
            <div className="detail-section">
              <h3>🕒 Giờ nhận/phòng trả</h3>
              <p>Check-in: {hotel.checkInTime} | Check-out: {hotel.checkOutTime}</p>
            </div>
            <div className="detail-section">
              <h3>✨ Tiện nghi</h3>
              <div className="amenities-list">
                {hotel.amenities?.map((item, idx) => <span key={idx} className="amenity-tag">{item}</span>)}
              </div>
            </div>

            {/* Quản lý ảnh */}
            <div className="detail-section">
              <h3>🖼️ Hình ảnh khách sạn</h3>
              <div className="image-upload-area">
                <label className="upload-label">
                  📤 Thêm ảnh mới
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleUploadImages}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                </label>
                {uploading && <span className="uploading-text">Đang tải lên...</span>}
              </div>
              <div className="image-gallery">
                {hotel.image?.map((img) => (
                  <div key={img._id} className="image-item">
                    <img src={img.url} alt="hotel" />
                    <button
                      className="delete-image-btn"
                      onClick={() => handleDeleteImage(img.public_id)}
                      disabled={deletingId === img.public_id}
                    >
                      {deletingId === img.public_id ? '...' : '✖'}
                    </button>
                  </div>
                ))}
              </div>
              {(!hotel.image || hotel.image.length === 0) && <p className="no-image">Chưa có ảnh nào.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}