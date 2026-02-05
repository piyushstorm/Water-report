import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});


// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  sendOTP: (data) => api.post('/auth/send-otp/', data),
  verifyOTP: (data) => api.post('/auth/verify-otp/', data),
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  resetPassword: (data) => api.post('/auth/reset-password/', data),
  getMe: () => api.get('/auth/me/'),
};

export const usageAPI = {
  create: (data) => api.post('/usage/', data),
  getAll: (params) => api.get('/usage/list/', { params }),
  getStats: () => api.get('/usage/stats/'),
  simulate: (days) => api.post('/demo/simulate-usage/', null, { params: { days } }),
};

export const alertAPI = {
  getAll: (status) => api.get('/alerts/', { params: { status } }),
  update: (id, data) => api.patch(`/alerts/${id}/`, data),
};

export const reportAPI = {
  generate: (type, format) =>
    api.get('/reports/generate/', {
      params: {
        report_type: type,
        format: format,
      },
      responseType: 'blob',   // ✅ ALWAYS blob (PDF + CSV)
    }),
};


export const adminAPI = {
  getUsers: () => api.get('/admin/users/'),
  getStats: () => api.get('/admin/stats/'),
  getAllUsage: () => api.get('/admin/usage/all/'),
  getAllAlerts: () => api.get('/admin/alerts/all/'),
  getAllIssues: (params) => api.get('/admin/issues/', { params }),
  updateIssue: (id, data) => api.patch(`/admin/issues/${id}/`, data),
};

export const issueAPI = {
  create: (data) => api.post('/issues/', data),
  getAll: () => api.get('/issues/list/'),
};

export default api;
