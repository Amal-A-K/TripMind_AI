import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // timeout: 30000,
  timeout: 120000, // 120s — file upload pipeline: OCR + parseBookingData (Gemini) + generateItinerary (Gemini)
});

// ─── Request Interceptor ──────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`[Frontend Request] ${config.method?.toUpperCase()} ${config.url}`, config.data || "");
    const token = localStorage.getItem('tripmind_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error(`[Frontend Request Error]`, error);
    return Promise.reject(error);
  }
);

// ─── Response Interceptor ─────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`[Frontend Response] Success ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(
      `[Frontend Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
      error.response?.data || error.message
    );
    if (error.response?.status === 401) {
      localStorage.removeItem('tripmind_token');
      localStorage.removeItem('tripmind_user');
      const isAuthRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      if (!isAuthRequest) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
