// pages/manager/components/ServicesManager.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import axiosInstance from '../../../services/axiosInstance';
import { toast } from 'react-toastify';
import './ServicesManager.css';

export default function ServicesManager() {
  const { token } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    unit: '',
    chargeType: 'per_night',
    description: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch danh sách dịch vụ của khách sạn
  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/services/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServices(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenForm = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        price: service.price,
        unit: service.unit || '',
        chargeType: service.chargeType || 'per_night',
        description: service.description || ''
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        price: '',
        unit: '',
        chargeType: 'per_night',
        description: ''
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingService(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Thêm hoặc cập nhật dịch vụ
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      price: Number(formData.price),
      unit: formData.unit,
      chargeType: formData.chargeType,
      description: formData.description
    };
    try {
      if (editingService) {
        await axiosInstance.patch(`/services/${editingService._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Cập nhật dịch vụ thành công');
      } else {
        await axiosInstance.post('/services', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Thêm dịch vụ thành công');
      }
      fetchServices();
      handleCloseForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lưu thất bại');
    }
  };

  // Xóa dịch vụ
  const handleDelete = async (serviceId) => {
    if (!window.confirm('Bạn có chắc muốn xóa dịch vụ này?')) return;
    try {
      await axiosInstance.delete(`/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Xóa dịch vụ thành công');
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa thất bại');
    }
  };

  // Phân trang
  const totalPages = Math.ceil(services.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentServices = services.slice(startIdx, startIdx + itemsPerPage);

  if (loading) return <div className="services-loading">Đang tải...</div>;

  return (
    <div className="services-manager">
      <div className="services-header">
        <h2>Dịch vụ thêm</h2>
        <button className="btn-add-service" onClick={() => handleOpenForm()}>+ Thêm dịch vụ</button>
      </div>

      {services.length === 0 ? (
        <div className="services-empty">Chưa có dịch vụ nào. Hãy thêm dịch vụ đầu tiên.</div>
      ) : (
        <>
          <div className="services-list">
            {currentServices.map(service => (
              <div key={service._id} className="service-card">
                <div className="service-card-header">
                  <h3>{service.name}</h3>
                  <div className="service-actions">
                    <button className="btn-edit" onClick={() => handleOpenForm(service)}>✏️ Sửa</button>
                    <button className="btn-delete" onClick={() => handleDelete(service._id)}>🗑️ Xóa</button>
                  </div>
                </div>
                <div className="service-details">
                  <p><strong>Giá:</strong> {service.price.toLocaleString()} VND</p>
                  <p><strong>Đơn vị:</strong> {service.unit || '—'}</p>
                  <p>
                    <strong>Loại phí:</strong> 
                    {service.chargeType === 'per_night' ? ' Theo đêm' : ' Một lần'}
                  </p>
                  <p><strong>Mô tả:</strong> {service.description || '—'}</p>
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

      {/* Modal thêm/sửa dịch vụ */}
      {showForm && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editingService ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}</h3>
            <form onSubmit={handleSubmit}>
              <input name="name" placeholder="Tên dịch vụ" value={formData.name} onChange={handleChange} required />
              <input name="price" type="number" placeholder="Giá (VND)" value={formData.price} onChange={handleChange} required />
              <input name="unit" placeholder="Đơn vị (vd: người/ngày, phòng)" value={formData.unit} onChange={handleChange} />
              <select name="chargeType" value={formData.chargeType} onChange={handleChange}>
                <option value="per_night">Theo đêm</option>
                <option value="one_time">Một lần</option>
              </select>
              <textarea name="description" placeholder="Mô tả" rows="3" value={formData.description} onChange={handleChange} />
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