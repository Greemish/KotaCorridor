import axios from 'axios';

const client = axios.create({
  baseURL: '/',
});

client.interceptors.request.use((config) => {
  const stored = localStorage.getItem('kota_user');
  if (stored) {
    const user = JSON.parse(stored);
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('kota_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
