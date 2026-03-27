import axios from 'axios';

const baseUrl: string = import.meta.env.VITE_BACKEND_SERVER || '';
const api = axios.create({
  baseURL: `${baseUrl}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const requestUrl = error.config?.url ?? '';
      const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

      // Let auth pages handle expected 401 responses (e.g. invalid credentials) without forcing a hard reload.
      if (!isAuthRequest) {
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
