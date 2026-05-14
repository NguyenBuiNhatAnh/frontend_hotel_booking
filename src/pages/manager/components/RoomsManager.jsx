// pages/manager/components/RoomsManager.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../services/axiosInstance';
import { toast } from 'react-toastify';
import './RoomsManager.css';

export default function RoomsManager() {
  const { token } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    capacity: '',
    quantity: '',
    amenities: []
  });
  const [uploading, setUploading] = useState(false);
  const [deletingImage, setDeletingImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch danh sách phòng
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/rooms/my-hotel', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(res.data.data.rooms);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Mở form thêm/sửa
  const handleOpenForm = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name,
        description: room.description,
        price: room.price,
        capacity: room.capacity,
        quantity: room.quantity,
        amenities: room.amenities || []
      });
    } else {
      setEditingRoom(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        capacity: '',
        quantity: '',
        amenities: []
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRoom(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAmenitiesChange = (e) => {
    const value = e.target.value;
    const arr = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({ ...prev, amenities: arr }));
  };

  // Submit thêm / sửa phòng
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
      capacity: Number(formData.capacity),
      quantity: Number(formData.quantity),
      amenities: formData.amenities
    };
    try {
      if (editingRoom) {
        // Cập nhật
        await axiosInstance.patch(`/rooms/${editingRoom._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Cập nhật phòng thành công');
      } else {
        // Thêm mới
        await axiosInstance.post('/rooms', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Thêm phòng mới thành công');
      }
      fetchRooms();
      handleCloseForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lưu thất bại');
    }
  };

  // Xóa phòng
  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Bạn có chắc muốn xóa phòng này?')) return;
    try {
      await axiosInstance.delete(`/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Xóa phòng thành công');
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa thất bại');
    }
  };

  // Upload ảnh cho phòng
  const handleUploadImages = async (roomId, files) => {
    const formDataUpload = new FormData();
    files.forEach(file => formDataUpload.append('images', file));
    setUploading(true);
    try {
      const res = await axiosInstance.patch(`/rooms/${roomId}/images`, formDataUpload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      // Cập nhật danh sách ảnh của phòng đó
      setRooms(prev => prev.map(room =>
        room._id === roomId
          ? { ...room, images: res.data.data.images }
          : room
      ));
      toast.success('Thêm ảnh thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  // Xóa ảnh của phòng
  const handleDeleteImage = async (roomId, publicId) => {
    if (!window.confirm('Xóa ảnh này?')) return;
    setDeletingImage(publicId);
    try {
      const res = await axiosInstance.delete(`/rooms/${roomId}/images?public_id=${publicId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Cập nhật lại danh sách ảnh
      setRooms(prev => prev.map(room =>
        room._id === roomId
          ? { ...room, images: res.data.data.images }
          : room
      ));
      toast.success('Xóa ảnh thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa ảnh thất bại');
    } finally {
      setDeletingImage(null);
    }
  };

  // Phân trang
  const totalPages = Math.ceil(rooms.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentRooms = rooms.slice(startIdx, startIdx + itemsPerPage);

  if (loading) return <div className="rooms-loading">Đang tải...</div>;

  return (
    <div className="rooms-manager">
      <div className="rooms-header">
        <h2>Quản lý phòng</h2>
        <button className="btn-add-room" onClick={() => handleOpenForm()}>+ Thêm phòng</button>
      </div>

      {rooms.length === 0 ? (
        <div className="rooms-empty">Chưa có phòng nào. Hãy thêm phòng đầu tiên.</div>
      ) : (
        <>
          <div className="rooms-list">
            {currentRooms.map(room => (
              <div key={room._id} className="room-card">
                <div className="room-card-header">
                  <h3>{room.name}</h3>
                  <div className="room-actions">
                    <button className="btn-edit" onClick={() => handleOpenForm(room)}>✏️ Sửa</button>
                    <button className="btn-delete" onClick={() => handleDeleteRoom(room._id)}>🗑️ Xóa</button>
                  </div>
                </div>
                <div className="room-details">
                  <p><strong>Mô tả:</strong> {room.description}</p>
                  <p><strong>Giá:</strong> {room.price.toLocaleString()} VND / đêm</p>
                  <p><strong>Sức chứa:</strong> {room.capacity} người</p>
                  <p><strong>Số lượng phòng:</strong> {room.quantity}</p>
                  <div className="room-amenities">
                    <strong>Tiện nghi:</strong>
                    {room.amenities?.map((am, idx) => <span key={idx} className="amenity-tag">{am}</span>)}
                  </div>
                </div>

                {/* Quản lý ảnh phòng */}
                <div className="room-images-section">
                  <div className="image-upload-area">
                    <label className="upload-label">
                      📸 Thêm ảnh
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleUploadImages(room._id, Array.from(e.target.files))}
                        disabled={uploading}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {uploading && <span className="uploading-text">Đang tải ảnh...</span>}
                  </div>
                  <div className="room-images">
                    {room.images?.map(img => (
                      <div key={img._id} className="room-image-item">
                        <img src={img.url} alt="room" />
                        <button
                          className="delete-img-btn"
                          onClick={() => handleDeleteImage(room._id, img.public_id)}
                          disabled={deletingImage === img.public_id}
                        >
                          ✖
                        </button>
                      </div>
                    ))}
                  </div>
                  {(!room.images || room.images.length === 0) && <p className="no-images">Chưa có ảnh</p>}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p-1)}>← Trước</button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} className={currentPage === i+1 ? 'active' : ''} onClick={() => setCurrentPage(i+1)}>{i+1}</button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p+1)}>Tiếp →</button>
            </div>
          )}
        </>
      )}

      {/* Modal thêm/sửa phòng */}
      {showForm && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editingRoom ? 'Sửa phòng' : 'Thêm phòng mới'}</h3>
            <form onSubmit={handleSubmit}>
              <input name="name" placeholder="Tên phòng" value={formData.name} onChange={handleChange} required />
              <textarea name="description" placeholder="Mô tả" rows="3" value={formData.description} onChange={handleChange} required />
              <div className="form-row">
                <input name="price" type="number" placeholder="Giá (VND)" value={formData.price} onChange={handleChange} required />
                <input name="capacity" type="number" placeholder="Sức chứa (người)" value={formData.capacity} onChange={handleChange} required />
                <input name="quantity" type="number" placeholder="Số lượng phòng" value={formData.quantity} onChange={handleChange} required />
              </div>
              <input
                name="amenities"
                placeholder="Tiện nghi (cách nhau dấu phẩy)"
                value={formData.amenities.join(', ')}
                onChange={handleAmenitiesChange}
              />
              <div className="modal-actions">
                <button type="submit">Lưu</button>
                <button type="button" onClick={handleCloseForm}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}