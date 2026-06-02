import axiosInstance from '@/api/axiosInstance';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '@/types';

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post('/auth/login', payload);
    const resData = data.data ?? data;
    const { token, ...user } = resData;
    return { user: user as User, token };
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post('/auth/register', payload);
    const resData = data.data ?? data;
    const { token, ...user } = resData;
    return { user: user as User, token };
  },

  logout: () => {
    localStorage.removeItem('tripmind_token');
    localStorage.removeItem('tripmind_user');
  },

  getMe: async () => {
    const { data } = await axiosInstance.get('/auth/me');
    return data.data ?? data;
  },

  forgotPassword: async (email: string): Promise<any> => {
    const { data } = await axiosInstance.post('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (token: string, password: string): Promise<any> => {
    const { data } = await axiosInstance.post(`/auth/reset-password/${token}`, { password });
    return data;
  },
};
