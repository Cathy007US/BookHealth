import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const http = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// 请求拦截：附加 token
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截：统一处理
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default http;
