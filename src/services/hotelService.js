// services/hotelService.js
import axiosInstance from "./axiosInstance";

export const searchHotels = async (params) => {
  const res = await axiosInstance.get('/hotels', { params });
  return res.data.data;
};

export const getHotelById = async (hotelId) => {
  const res = await axiosInstance.get(`/hotels/${hotelId}`);
  return res.data.data;
};

export const getRoomsByHotel = async (hotelId) => {
  const res = await axiosInstance.get(`/rooms/hotel/${hotelId}`);
  return res.data.data;
};

export const getRoomDetail = async (roomId) => {
  const res = await axiosInstance.get(`/rooms/${roomId}`);
  return res.data.data;
};

export const getRoomAvailability = async (roomId, checkInDate, checkOutDate) => {
  const res = await axiosInstance.get(`/bookings/room/${roomId}/availability`, {
    params: { checkInDate, checkOutDate }
  });
  return res.data.data;
};

export const getServicesByHotel = async (hotelId) => {
  const res = await axiosInstance.get(`/services/hotel/${hotelId}`);
  return res.data.data;
};

export const createBooking = async (hotelId, bookingData, token) => {
  const res = await axiosInstance.post(`/bookings/hotel/${hotelId}`, bookingData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.data;
};

// Tuỳ chọn: lấy chi tiết booking sau khi đặt thành công
export const getBookingDetail = async (bookingId, token) => {
  const res = await axiosInstance.get(`/bookings/${bookingId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.data;
};