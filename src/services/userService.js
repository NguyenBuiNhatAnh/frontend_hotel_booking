import axiosInstance from './axiosInstance';

export const updateProfile = async (profileData, token) => {
  try {
    const response = await axiosInstance.patch('/users/profile', profileData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: 'Cập nhật thông tin thất bại',
      }
    );
  }
};

export const changePassword = async (passwordData, token) => {
  try {
    const response = await axiosInstance.patch('/users/change-password', passwordData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: 'Đổi mật khẩu thất bại',
      }
    );
  }
};
