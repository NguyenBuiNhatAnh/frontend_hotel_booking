import axiosInstance from './axiosInstance';
 
export const registerUser = async (userData) => {
  try {
    const response = await axiosInstance.post(
      '/auth/register',
      userData
    );
 
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: 'Đăng ký thất bại',
      }
    );
  }
};
 
export const loginUser = async (userData) => {
  try {
    const response = await axiosInstance.post(
      '/auth/login',
      userData
    );
 
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: 'Đăng nhập thất bại',
      }
    );
  }
};

export const forgotPassword = async (data) => {
  try {
    const response = await axiosInstance.post('/auth/forgot-password', data);
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: 'Gửi OTP thất bại',
      }
    );
  }
};

export const resetPassword = async (data) => {
  try {
    const response = await axiosInstance.post('/auth/reset-password', data);
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: 'Đặt lại mật khẩu thất bại',
      }
    );
  }
};
