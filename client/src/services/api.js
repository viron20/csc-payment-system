import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  timeout: 10000, // 10 seconds timeout
});

// Attach JWT on every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('csc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url || '';
    const isAuthRoute =
      url.endsWith('/login') ||
      url.endsWith('/register') ||
      url.endsWith('/google-login') ||
      url.endsWith('/google-register');

    if (status === 401 && !isAuthRoute) {
      localStorage.removeItem('csc_token');
      localStorage.removeItem('csc_user');
      window.location.href = '/login';
    }

    return Promise.reject(err.response?.data || err);
  }
);

// ── Auth ──────────────────────────────────────────
export const registerUser    = (data) => API.post('/register', data);
export const loginUser       = (data) => API.post('/login', data);
export const googleLogin     = (data) => API.post('/google-login', data);
export const googleRegister  = (data) => API.post('/google-register', data);
// ── User ──────────────────────────────────────────
export const getProfile = () => API.get('/profile');
export const updateProfile = (data) => API.put('/profile', data);

// ── Payments ──────────────────────────────────────
export const getPayments = () => API.get('/payments');
export const uploadReceipt = (formData) =>
  API.post('/upload-receipt', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ── Admin ─────────────────────────────────────────
export const adminGetStudents = () => API.get('/admin/students');
export const adminFilterStudents = (params) => API.get('/admin/filter', { params });
export const adminGetStudentPayments = (id) => API.get(`/admin/student/${id}/payments`);
export const adminUpdatePayment = (data) => API.put('/admin/update-payment', data);
export const adminUpdateStudentStatus = (id, status) => API.put(`/admin/student/${id}/status`, { status });
export const adminDeleteStudent = (id) => API.delete(`/admin/student/${id}`);
export const adminGetStats = () => API.get('/admin/stats');

// ── Superadmin ────────────────────────────────────
export const superadminGetAdmins = () => API.get('/superadmin/admins');
export const superadminAddAdmin = (data) => API.post('/superadmin/add-admin', data);
export const superadminUpdateAdmin = (id, data) => API.put(`/superadmin/update-admin/${id}`, data);
export const superadminDeleteBatchStudents = (studentIds) => API.post('/superadmin/delete-batch-students', { studentIds });

export default API;
