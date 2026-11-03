import http from './http';

// ========== 认证 ==========
export const authApi = {
  wxLogin: (data: { code: string; nickname?: string; avatar?: string }) =>
    http.post('/auth/wx-login', data),
  login: (data: { account: string; password: string }) =>
    http.post('/auth/login', data),
  sendCode: (phone: string) =>
    http.post('/auth/send-code', { phone }),
  loginByCode: (data: { phone: string; code: string }) =>
    http.post('/auth/login-by-code', data),
  getProfile: () => http.get('/auth/profile'),
};

// ========== 体检人 ==========
export const examineeApi = {
  list: () => http.get('/auth/examinees'),
  create: (data: any) => http.post('/auth/examinees', data),
  delete: (id: number) => http.delete(`/auth/examinees/${id}`),
};

// ========== 机构 ==========
export const institutionApi = {
  recommended: () => http.get('/institutions/recommended'),
  list: (params?: any) => http.get('/institutions', { params }),
  detail: (id: number) => http.get(`/institutions/${id}`),
  provinces: () => http.get('/institutions/provinces/all'),
  cities: (provinceId: number) => http.get(`/institutions/cities/${provinceId}`),
};

// ========== 套餐 ==========
export const packageApi = {
  recommended: () => http.get('/packages/recommended'),
  categories: () => http.get('/packages/categories/all'),
  list: (params?: any) => http.get('/packages', { params }),
  detail: (id: number) => http.get(`/packages/${id}`),
  addons: (id: number) => http.get(`/packages/${id}/addons`),
};

// ========== 订单/预约 ==========
export const orderApi = {
  list: (params?: any) => http.get('/orders', { params }),
  detail: (id: number) => http.get(`/orders/${id}`),
  create: (data: any) => http.post('/orders', data),
  pay: (id: number, pay_method: string) => http.post(`/orders/${id}/pay`, { pay_method }),
  updateExamDate: (id: number, data: any) => http.put(`/orders/${id}/exam-date`, data),
  cancel: (id: number, reason?: string) => http.put(`/orders/${id}/cancel`, { cancel_reason: reason }),
  addAddons: (id: number, addon_item_ids: number[]) =>
    http.post(`/orders/${id}/addons`, { addon_item_ids }),
};

// ========== 报告 ==========
export const reportApi = {
  list: (params?: any) => http.get('/reports', { params }),
  detail: (id: number) => http.get(`/reports/${id}`),
  sendEmail: (id: number, email: string) => http.post(`/reports/${id}/send-email`, { email }),
};

// ========== 咨询 ==========
export const consultationApi = {
  doctors: () => http.get('/consultations/doctors'),
  list: () => http.get('/consultations/consultations'),
  create: (data: any) => http.post('/consultations/consultations', data),
};

// ========== 文件上传 ==========
export const uploadApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// ========== Admin API ==========
export const adminApi = {
  login: (data: { username: string; password: string }) =>
    http.post('/admin/login', data),
  // Exam Items
  listExamItems: (params?: any) => http.get('/admin/exam-items', { params }),
  createExamItem: (data: any) => http.post('/admin/exam-items', data),
  deleteExamItems: (ids: number[]) => http.delete('/admin/exam-items', { data: { ids } }),
  // Examinees (admin: all examinees)
  listAllExaminees: (params?: any) => http.get('/admin/examinees', { params }),
  deleteExaminees: (ids: number[]) => http.delete('/admin/examinees', { data: { ids } }),
};
