// pages/customer/HotelDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getHotelById,
  getRoomsByHotel,
  getRoomAvailability,
  getRoomDetail,
  getServicesByHotel,
  createBooking
} from '../../services/hotelService';
import { toast } from 'react-toastify';
import './HotelDetailPage.css';

export default function HotelDetailPage() {
  const { hotelId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const query = new URLSearchParams(location.search);
  const checkInDate = query.get('checkInDate') || '';
  const checkOutDate = query.get('checkOutDate') || '';
  const guests = parseInt(query.get('guests')) || 1;

  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRooms, setSelectedRooms] = useState({});
  const [selectedServices, setSelectedServices] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [placing, setPlacing] = useState(false);

  // Gallery state
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Room detail modal
  const [selectedRoomDetail, setSelectedRoomDetail] = useState(null);
  const [roomDetailLoading, setRoomDetailLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const hotelData = await getHotelById(hotelId);
        setHotel(hotelData);
        const roomsData = await getRoomsByHotel(hotelId);
        // Lấy availability cho từng phòng nếu có ngày
        const roomsWithAvailability = await Promise.all(
          roomsData.map(async (room) => {
            if (checkInDate && checkOutDate) {
              try {
                const avail = await getRoomAvailability(room._id, checkInDate, checkOutDate);
                return { ...room, availableQuantity: avail.availableQuantity };
              } catch {
                return { ...room, availableQuantity: room.totalQuantity };
              }
            } else {
              return { ...room, availableQuantity: room.totalQuantity };
            }
          })
        );
        setRooms(roomsWithAvailability);
        const servicesData = await getServicesByHotel(hotelId);
        setServices(servicesData);
      } catch (err) {
        toast.error('Không thể tải thông tin khách sạn');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [hotelId, checkInDate, checkOutDate]);

  // Tính tổng tiền
  useEffect(() => {
    let total = 0;
    const nights = checkInDate && checkOutDate
      ? Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 3600 * 24))
      : 0;

    rooms.forEach(room => {
      const qty = selectedRooms[room._id] || 0;
      if (qty > 0 && nights > 0) {
        total += room.price * qty * nights;
      }
    });
    services.forEach(service => {
      const sel = selectedServices[service._id];
      if (sel && sel.quantity > 0) {
        if (service.chargeType === 'one_time') {
          total += service.price * sel.quantity;
        } else if (service.chargeType === 'per_night' && sel.numberOfDays) {
          total += service.price * sel.quantity * sel.numberOfDays;
        }
      }
    });
    setTotalPrice(total);
  }, [selectedRooms, selectedServices, rooms, services, checkInDate, checkOutDate]);

  const handleRoomQuantityChange = (roomId, quantity) => {
    const room = rooms.find(r => r._id === roomId);
    const maxQty = room?.availableQuantity || 0;
    if (quantity > maxQty) {
      toast.warning(`Chỉ còn ${maxQty} phòng trống`);
      return;
    }
    setSelectedRooms(prev => ({
      ...prev,
      [roomId]: quantity > 0 ? quantity : undefined
    }));
  };

  const handleServiceChange = (serviceId, quantity, numberOfDays = 1) => {
    if (quantity <= 0) {
      const newSel = { ...selectedServices };
      delete newSel[serviceId];
      setSelectedServices(newSel);
    } else {
      setSelectedServices(prev => ({
        ...prev,
        [serviceId]: { quantity, numberOfDays }
      }));
    }
  };

  // Xem chi tiết phòng (gọi API)
  const viewRoomDetail = async (roomId) => {
    setRoomDetailLoading(true);
    try {
      const detail = await getRoomDetail(roomId);
      setSelectedRoomDetail(detail);
    } catch (err) {
      toast.error('Không thể tải chi tiết phòng');
    } finally {
      setRoomDetailLoading(false);
    }
  };

  const handlePlaceBooking = async () => {
    if (!token || !user) {
      toast.warning('Vui lòng đăng nhập để đặt phòng');
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    if (Object.keys(selectedRooms).length === 0) {
      toast.error('Vui lòng chọn ít nhất một phòng');
      return;
    }
    const roomsPayload = Object.entries(selectedRooms).map(([roomId, quantity]) => ({
      roomId, quantity
    }));
    const servicesPayload = Object.entries(selectedServices).map(([serviceId, data]) => {
      const service = services.find(s => s._id === serviceId);
      if (service?.chargeType === 'per_night') {
        return { serviceId, quantity: data.quantity, numberOfDays: data.numberOfDays };
      } else {
        return { serviceId, quantity: data.quantity };
      }
    });
    const bookingData = {
      rooms: roomsPayload,
      checkInDate,
      checkOutDate,
      guests,
      services: servicesPayload
    };
    setPlacing(true);
    try {
      const result = await createBooking(hotelId, bookingData, token);
      toast.success('Đặt phòng thành công!');
      navigate(`/booking/success/${result._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt phòng thất bại');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div className="loading-page">Đang tải...</div>;
  if (!hotel) return <div className="error-page">Không tìm thấy khách sạn</div>;

  return (
    <div className="hotel-detail-page">
      {/* Header with gallery trigger */}
      <div className="hotel-header">
        <h1>{hotel.name}</h1>
        <div className="address">{hotel.address?.street}, {hotel.address?.ward}, {hotel.address?.city}</div>
        <p>{hotel.description}</p>
        {hotel.image && hotel.image.length > 0 && (
          <div className="hotel-thumbnails" onClick={() => setShowGallery(true)}>
            {hotel.image.slice(0, 4).map((img, idx) => (
              <img key={idx} src={img.url} alt="hotel" className="thumb" />
            ))}
            {hotel.image.length > 4 && <div className="more-photos">+{hotel.image.length - 4}</div>}
          </div>
        )}
      </div>

      <div className="detail-content">
        <div className="rooms-services-section">
          {/* Rooms */}
          <h2>Chọn phòng</h2>
          <div className="rooms-list">
            {rooms.map(room => (
              <div key={room._id} className="room-card">
                <div className="room-info-row">
                  <h3>
                    {room.name}
                    <button className="view-detail-btn" onClick={() => viewRoomDetail(room._id)}>📄 Xem chi tiết</button>
                  </h3>
                  <p>Sức chứa: {room.capacity} người</p>
                  <p>Giá: {room.price.toLocaleString()} VND / đêm</p>
                  <p>Còn trống: {room.availableQuantity} phòng</p>
                </div>
                <div className="room-select">
                  <label>Số lượng:</label>
                  <input
                    type="number"
                    min="0"
                    max={room.availableQuantity}
                    value={selectedRooms[room._id] || 0}
                    onChange={e => handleRoomQuantityChange(room._id, parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Services */}
          <h2>Dịch vụ thêm</h2>
          <div className="services-list">
            {services.map(service => {
              const sel = selectedServices[service._id] || { quantity: 0, numberOfDays: 1 };
              return (
                <div key={service._id} className="service-card">
                  <div className="service-info">
                    <h4>{service.name}</h4>
                    <p>{service.description}</p>
                    <p>Giá: {service.price.toLocaleString()} VND / {service.unit}</p>
                    <p>Loại phí: {service.chargeType === 'one_time' ? 'Một lần' : 'Theo đêm'}</p>
                  </div>
                  <div className="service-select">
                    <label>Số lượng:</label>
                    <input
                      type="number"
                      min="0"
                      value={sel.quantity}
                      onChange={e => handleServiceChange(service._id, parseInt(e.target.value) || 0, sel.numberOfDays)}
                    />
                    {service.chargeType === 'per_night' && sel.quantity > 0 && (
                      <div className="pernight-days">
                        <label>Số ngày sử dụng:</label>
                        <input
                          type="number"
                          min="1"
                          value={sel.numberOfDays}
                          onChange={e => handleServiceChange(service._id, sel.quantity, parseInt(e.target.value) || 1)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="booking-summary">
          <h3>Thông tin đặt phòng</h3>
          <p>Nhận phòng: {checkInDate}</p>
          <p>Trả phòng: {checkOutDate}</p>
          <p>Số khách: {guests}</p>
          <hr />
          <h4>Tổng tiền: {totalPrice.toLocaleString()} VND</h4>
          <button className="btn-book" onClick={handlePlaceBooking} disabled={placing}>
            {placing ? 'Đang xử lý...' : 'Đặt phòng ngay'}
          </button>
        </div>
      </div>

      {/* Gallery Modal */}
      {showGallery && hotel.image && (
        <div className="modal-overlay" onClick={() => setShowGallery(false)}>
          <div className="gallery-modal" onClick={e => e.stopPropagation()}>
            <button className="close-gallery" onClick={() => setShowGallery(false)}>✕</button>
            <div className="gallery-main">
              <img src={hotel.image[galleryIndex].url} alt="gallery" />
            </div>
            <div className="gallery-thumbs">
              {hotel.image.map((img, idx) => (
                <img
                  key={idx}
                  src={img.url}
                  className={idx === galleryIndex ? 'active' : ''}
                  onClick={() => setGalleryIndex(idx)}
                />
              ))}
            </div>
            {hotel.image.length > 1 && (
              <>
                <button className="nav-prev" onClick={() => setGalleryIndex((galleryIndex - 1 + hotel.image.length) % hotel.image.length)}>‹</button>
                <button className="nav-next" onClick={() => setGalleryIndex((galleryIndex + 1) % hotel.image.length)}>›</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Room Detail Modal */}
      {selectedRoomDetail && (
        <div className="modal-overlay" onClick={() => setSelectedRoomDetail(null)}>
          <div className="room-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedRoomDetail(null)}>✕</button>
            {roomDetailLoading ? (
              <div>Đang tải chi tiết...</div>
            ) : (
              <>
                <h2>{selectedRoomDetail.name}</h2>
                <div className="room-detail-images">
                  {selectedRoomDetail.images?.map((img, idx) => (
                    <img key={idx} src={img.url} alt="room" />
                  ))}
                </div>
                <p><strong>Mô tả:</strong> {selectedRoomDetail.description}</p>
                <p><strong>Giá:</strong> {selectedRoomDetail.price.toLocaleString()} VND / đêm</p>
                <p><strong>Sức chứa:</strong> {selectedRoomDetail.capacity} người</p>
                <p><strong>Số lượng phòng:</strong> {selectedRoomDetail.quantity}</p>
                <div className="room-amenities">
                  <strong>Tiện nghi:</strong>
                  {selectedRoomDetail.amenities?.map((am, i) => <span key={i} className="amenity-tag">{am}</span>)}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}