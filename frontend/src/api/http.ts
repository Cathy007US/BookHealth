import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const http = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// 请求拦截：附加 token（优先 adminToken，其次 user token）
http.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('adminToken');
  const token = localStorage.getItem('token');
  if (adminToken && config.url?.startsWith('/admin')) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截：统一处理
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // 登录类接口返回 401 表示「账号或密码错误」，属业务错误，
      // 不能当作登录态失效去清 token + 跳转，否则页面会被刷掉、错误提示也看不到
      const isLoginRequest =
        /^\/(auth\/login|auth\/login-by-code|auth\/send-code|auth\/reset-password|admin\/login)(\/|\?|$)/.test(
          url
        );
      if (!isLoginRequest) {
        if (url.startsWith('/admin')) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          window.location.href = '/admin/login';
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default http;
