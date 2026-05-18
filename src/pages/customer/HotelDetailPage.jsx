// pages/customer/HotelDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useHotel } from '../../contexts/HotelContext';
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
import axiosInstance from '../../services/axiosInstance';

export default function HotelDetailPage() {
    const { hotelId } = useParams();
    const { hotelBooking, updateHotelBooking } = useHotel();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, token } = useAuth();

    // Lấy tham số từ URL (nếu có)
    const [checkInDate, setCheckInDate] = useState(
        hotelBooking.checkInDate || ''
    );

    const [checkOutDate, setCheckOutDate] = useState(
        hotelBooking.checkOutDate || ''
    );

    const [guests, setGuests] = useState(
        hotelBooking.guests || 1
    );



    // State tạm để người dùng chỉnh sửa
    const [tempCheckIn, setTempCheckIn] = useState(checkInDate);
    const [tempCheckOut, setTempCheckOut] = useState(checkOutDate);
    const [tempGuests, setTempGuests] = useState(guests);
    const [bookingResult, setBookingResult] = useState(null);

    const [hotel, setHotel] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRooms, setSelectedRooms] = useState({});
    const [selectedServices, setSelectedServices] = useState({});
    const [totalPrice, setTotalPrice] = useState(0);
    const [placing, setPlacing] = useState(false);

    // Gallery & modal
    const [showGallery, setShowGallery] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [selectedRoomDetail, setSelectedRoomDetail] = useState(null);
    const [roomDetailLoading, setRoomDetailLoading] = useState(false);

    // Thêm state mới
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsPagination, setReviewsPagination] = useState(null);
    const [avgRating, setAvgRating] = useState(0);

    // Hàm fetch reviews
    const fetchReviews = async (page = 1, limit = 5) => {
        setReviewsLoading(true);
        try {
            const res = await axiosInstance.get(`/reviews/hotel/${hotelId}`, {
                params: { page, limit }
            });
            if (res.data.success) {
                setReviews(res.data.data.reviews);
                setReviewsPagination(res.data.data.pagination);
                // Tính rating trung bình dựa trên tổng số và tổng rating (nếu API không trả avg)
                // Hoặc có thể tính từ mảng reviews hiện tại, nhưng tốt nhất nếu backend trả avgRating cho hotel.
                // Ở đây tôi tính từ tổng số reviews và tổng rating (có thể dùng hotel.avgRating nếu có)
                if (hotel?.avgRating) {
                    setAvgRating(hotel.avgRating);
                } else {
                    // Tính tạm từ tất cả reviews (nếu có tất cả reviews, nhưng thường chỉ lấy 1 trang)
                    // Nên dùng hotel.avgRating từ API hotel detail.
                }
            }
        } catch (error) {
            console.error('Lỗi tải reviews:', error);
        } finally {
            setReviewsLoading(false);
        }
    };

    // Gọi fetchReviews khi hotelId thay đổi
    useEffect(() => {
        if (hotelId) {
            fetchReviews();
        }
    }, [hotelId]);

    // Hàm fetch dữ liệu dựa trên ngày mới
    const fetchHotelData = async (
        cIn = checkInDate,
        cOut = checkOutDate
    ) => {
        setLoading(true);

        try {
            const hotelData = await getHotelById(hotelId);
            setHotel(hotelData);

            const roomsData = await getRoomsByHotel(hotelId);

            const roomsWithAvailability = await Promise.all(
                roomsData.map(async (room) => {
                    try {
                        if (!cIn || !cOut) {
                            return {
                                ...room,
                                availableQuantity: room.totalQuantity,
                                isAvailable: true
                            };
                        }

                        const avail = await getRoomAvailability(
                            room._id,
                            cIn,
                            cOut
                        );

                        return {
                            ...room,
                            availableQuantity: avail.availableQuantity,
                            isAvailable: avail.isAvailable
                        };
                    } catch {
                        return {
                            ...room,
                            availableQuantity: room.totalQuantity,
                            isAvailable: true
                        };
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


    useEffect(() => {
        if (!hotelId) return;

        fetchHotelData();
    }, [hotelId, checkInDate, checkOutDate]);

    // Hàm xử lý cập nhật (khi người dùng ấn "Tìm lại")
    const handleUpdateDates = async () => {

        if (!tempCheckIn || !tempCheckOut) {
            toast.warning('Vui lòng chọn ngày');
            return;
        }

        if (new Date(tempCheckIn) >= new Date(tempCheckOut)) {
            toast.warning('Ngày trả phòng phải sau ngày nhận');
            return;
        }

        setSelectedRooms({});
        setSelectedServices({});

        setCheckInDate(tempCheckIn);
        setCheckOutDate(tempCheckOut);
        setGuests(tempGuests);

        updateHotelBooking({
            hotelId,
            checkInDate: tempCheckIn,
            checkOutDate: tempCheckOut,
            guests: tempGuests,
        });

        navigate(
            `/hotels/${hotelId}?checkInDate=${tempCheckIn}&checkOutDate=${tempCheckOut}&guests=${tempGuests}`,
            { replace: true }
        );

        toast.success('Đã cập nhật phòng trống');
    };

    // Tính toán số đêm
    const nights = checkInDate && checkOutDate
        ? Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 3600 * 24))
        : 0;

    // Tính tổng tiền
    useEffect(() => {
        let total = 0;
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
    }, [selectedRooms, selectedServices, rooms, services, nights]);

    const handleRoomQuantityChange = (roomId, quantity) => {

        const room = rooms.find(r => r._id === roomId);

        const maxQty = room?.availableQuantity || 0;

        if (quantity > maxQty) {
            toast.warning(`Chỉ còn ${maxQty} phòng trống`);
            return;
        }

        setSelectedRooms(prev => {

            const updated = { ...prev };

            if (quantity <= 0) {
                delete updated[roomId];
            } else {
                updated[roomId] = quantity;
            }

            return updated;
        });
    };

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

    const handleServiceChange = (
        serviceId,
        quantity,
        numberOfDays = 1
    ) => {

        setSelectedServices(prev => {

            const updated = { ...prev };

            if (quantity <= 0) {
                delete updated[serviceId];
            } else {
                updated[serviceId] = {
                    quantity,
                    numberOfDays
                };
            }

            return updated;
        });
    };

    const handlePlaceBooking = async () => {
        if (!token || !user) {
            toast.warning('Vui lòng đăng nhập để đặt phòng');
            navigate('/auth', { state: { from: location.pathname + location.search } });
            return;
        }
        if (Object.keys(selectedRooms).length === 0) {
            toast.error('Vui lòng chọn ít nhất một phòng');
            return;
        }
        if (!checkInDate || !checkOutDate) {
            toast.error('Vui lòng chọn ngày nhận/trả phòng');
            return;
        }
        const roomsPayload = Object.entries(selectedRooms)
            .filter(([_, quantity]) => quantity > 0)
            .map(([roomId, quantity]) => ({
                roomId,
                quantity: Number(quantity)
            }));
        const servicesPayload = Object.entries(selectedServices)
            .filter(([_, data]) => data.quantity > 0)
            .map(([serviceId, data]) => {

                const service = services.find(
                    s => s._id === serviceId
                );

                if (service?.chargeType === 'per_night') {
                    return {
                        serviceId,
                        quantity: Number(data.quantity),
                        numberOfDays: Number(data.numberOfDays || 1)
                    };
                }

                return {
                    serviceId,
                    quantity: Number(data.quantity)
                };
            });
        if (roomsPayload.length === 0) {
            toast.error('Vui lòng chọn phòng');
            return;
        }
        const bookingData = {
            rooms: roomsPayload,
            checkInDate,
            checkOutDate,
            guests,
            services: servicesPayload
        };
        setPlacing(true);
        try {
            const result = await createBooking(
                hotelId,
                bookingData,
                token
            );

            setBookingResult(result);

            toast.success('Đặt phòng thành công, vui lòng thanh toán trong 10 phút');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Đặt phòng thất bại');
        } finally {
            setPlacing(false);
        }
    };

    if (loading && !hotel) return <div className="loading-page">Đang tải...</div>;
    if (!hotel) return <div className="error-page">Không tìm thấy khách sạn</div>;

    return (
        <div className="hotel-detail-page">
            {/* Header khách sạn */}
            <div className="hotel-header">
                <h1>{hotel.name}</h1>
                <div className="address">{hotel.address?.street}, {hotel.address?.ward}, {hotel.address?.city}</div>
                <p>{hotel.description}</p>

                {/* Thêm phần hiển thị tiện ích */}
                {hotel.amenities && hotel.amenities.length > 0 && (
                    <div className="hotel-amenities">
                        <strong>Tiện ích nổi bật:</strong>
                        <div className="amenities-list">
                            {hotel.amenities.map((item, idx) => (
                                <span key={idx} className="amenity-tag">{item}</span>
                            ))}
                        </div>
                    </div>
                )}

                {hotel.image && hotel.image.length > 0 && (
                    <div className="hotel-thumbnails" onClick={() => setShowGallery(true)}>
                        {hotel.image.slice(0, 4).map((img, idx) => (
                            <img key={idx} src={img.url} alt="hotel" className="thumb" />
                        ))}
                        {hotel.image.length > 4 && <div className="more-photos">+{hotel.image.length - 4}</div>}
                    </div>
                )}
            </div>

            {hotel.avgRating !== undefined && (
                <div className="hotel-rating-header">
                    <div className="rating-stars">
                        {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className={star <= Math.round(hotel.avgRating) ? 'star filled' : 'star'}>★</span>
                        ))}
                    </div>
                    <span className="rating-value">{hotel.avgRating.toFixed(1)}</span>
                    <span className="review-count">({hotel.totalReviews || 0} đánh giá)</span>
                </div>
            )}

            {/* Form thay đổi ngày/số khách */}
            <div className="date-guests-form">
                <div className="form-row">
                    <div className="field">
                        <label>Ngày nhận phòng</label>
                        <input type="date" value={tempCheckIn} onChange={e => setTempCheckIn(e.target.value)} />
                    </div>
                    <div className="field">
                        <label>Ngày trả phòng</label>
                        <input type="date" value={tempCheckOut} onChange={e => setTempCheckOut(e.target.value)} />
                    </div>
                    <div className="field">
                        <label>Số khách</label>
                        <input type="number" min="1" value={tempGuests} onChange={e => setTempGuests(parseInt(e.target.value) || 1)} />
                    </div>
                    <button className="btn-update" onClick={handleUpdateDates}>Cập nhật</button>
                </div>
            </div>

            <div className="detail-content">
                <div className="rooms-services-section">
                    <h2>Chọn phòng</h2>
                    {rooms.length === 0 && <p>Không có phòng nào.</p>}
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
                    <p>Số đêm: {nights}</p>
                    <div className="selected-section">

                        <h4>Phòng đã chọn</h4>

                        {Object.entries(selectedRooms).length === 0 && (
                            <p>Chưa chọn phòng</p>
                        )}

                        {Object.entries(selectedRooms).map(([roomId, qty]) => {

                            const room = rooms.find(r => r._id === roomId);

                            if (!room || qty <= 0) return null;

                            return (
                                <div key={roomId} className="summary-item">
                                    <span>{room.name}</span>
                                    <strong>x{qty}</strong>
                                </div>
                            );
                        })}
                    </div>
                    <div className="selected-section">

                        <h4>Dịch vụ đã chọn</h4>

                        {Object.entries(selectedServices).length === 0 && (
                            <p>Chưa chọn dịch vụ</p>
                        )}

                        {Object.entries(selectedServices).map(([serviceId, data]) => {

                            const service = services.find(s => s._id === serviceId);

                            if (!service) return null;

                            return (
                                <div key={serviceId} className="summary-item">

                                    <div>
                                        <span>{service.name}</span>

                                        {service.chargeType === 'per_night' && (
                                            <small>
                                                {' '}
                                                ({data.numberOfDays} ngày)
                                            </small>
                                        )}
                                    </div>

                                    <strong>x{data.quantity}</strong>
                                </div>
                            );
                        })}
                    </div>
                    <hr />
                    <h4>Tổng tiền: {totalPrice.toLocaleString()} VND</h4>
                    <button className="btn-book" onClick={handlePlaceBooking} disabled={placing}>
                        {placing ? 'Đang xử lý...' : 'Đặt phòng ngay'}
                    </button>

                </div>
            </div>

            {/* Phần đánh giá của khách sạn */}
            <div className="hotel-reviews-section">
                <div className="reviews-header">
                    <h3>Đánh giá từ khách hàng</h3>
                    {hotel.avgRating !== undefined && (
                        <div className="rating-summary">
                            <span className="avg-rating">{hotel.avgRating.toFixed(1)}</span>
                            <div className="stars">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span key={star} className={star <= Math.round(hotel.avgRating) ? 'star filled' : 'star'}>★</span>
                                ))}
                            </div>
                            <span className="total-reviews">({hotel.totalReviews || 0} đánh giá)</span>
                        </div>
                    )}
                </div>

                {reviewsLoading && <div className="loading-reviews">Đang tải đánh giá...</div>}

                {!reviewsLoading && reviews.length === 0 && (
                    <div className="no-reviews">Chưa có đánh giá nào cho khách sạn này.</div>
                )}

                <div className="reviews-list">
                    {reviews.map(review => (
                        <div key={review._id} className="review-item">
                            <div className="review-user">
                                <strong>{review.user.fullName || `${review.user.firstName} ${review.user.lastName}`}</strong>
                                <div className="review-stars">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <span key={star} className={star <= review.rating ? 'star filled' : 'star'}>★</span>
                                    ))}
                                </div>
                                <span className="review-date">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <p className="review-comment">{review.comment}</p>
                        </div>
                    ))}
                </div>

                {/* Phân trang nếu cần */}
                {reviewsPagination && reviewsPagination.totalPages > 1 && (
                    <div className="reviews-pagination">
                        <button
                            disabled={reviewsPagination.page === 1}
                            onClick={() => fetchReviews(reviewsPagination.page - 1)}
                        >
                            Trước
                        </button>
                        <span>Trang {reviewsPagination.page} / {reviewsPagination.totalPages}</span>
                        <button
                            disabled={reviewsPagination.page === reviewsPagination.totalPages}
                            onClick={() => fetchReviews(reviewsPagination.page + 1)}
                        >
                            Sau
                        </button>
                    </div>
                )}
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
                                <img key={idx} src={img.url} className={idx === galleryIndex ? 'active' : ''} onClick={() => setGalleryIndex(idx)} />
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
            {bookingResult && (

                <div
                    className="modal-overlay"
                    onClick={() => setBookingResult(null)}
                >

                    <div
                        className="invoice-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <h2>Hóa đơn đặt phòng</h2>

                        <div className="invoice-info">

                            <p>
                                <strong>Mã booking:</strong>
                                {' '}
                                {bookingResult._id}
                            </p>

                            <p>
                                <strong>Check-in:</strong>
                                {' '}
                                {checkInDate}
                            </p>

                            <p>
                                <strong>Check-out:</strong>
                                {' '}
                                {checkOutDate}
                            </p>

                            <p>
                                <strong>Số khách:</strong>
                                {' '}
                                {guests}
                            </p>

                            <p>
                                <strong>Tổng tiền:</strong>
                                {' '}
                                {totalPrice.toLocaleString()} VND
                            </p>

                        </div>

                        <div className="invoice-warning">
                            ⏰ Vui lòng thanh toán trong vòng 10 phút
                        </div>

                        <button
                            className="btn-book"
                            onClick={() => navigate('/my-bookings')}
                        >
                            Xem booking
                        </button>
                    </div>
                </div>
            )}
        </div>

    );
}