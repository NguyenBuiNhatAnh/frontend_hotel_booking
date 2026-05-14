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