import axios from 'axios';
import { API_BASE_URL } from '../constants';

export const http = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

// Initialize Authorization header from stored auth (localStorage or sessionStorage)
try {
  const raw = localStorage.getItem('auth') ?? sessionStorage.getItem('auth');
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed?.token) {
      (http.defaults as any).headers = (http.defaults as any).headers || {};
      (http.defaults as any).headers.common = (http.defaults as any).headers.common || {};
      (http.defaults as any).headers.common['Authorization'] = `Bearer ${parsed.token}`;
    }
  }
} catch (e) {
  // ignore JSON parse errors
}

http.interceptors.response.use(
  (res) => res,
  (err) => {
    return Promise.reject(err?.response?.data ?? err);
  }
);
