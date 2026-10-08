import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 4000,
});

let useMock = false;

export const setUseMock = (val) => {
  useMock = val;
  localStorage.setItem('safeops_use_mock', val ? 'true' : 'false');
};

export const getUseMock = () => {
  const stored = localStorage.getItem('safeops_use_mock');
  if (stored !== null) return stored === 'true';
  return useMock;
};

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('safeops_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export async function apiCall(realCall, mockCall) {
  if (getUseMock()) {
    return Promise.resolve(mockCall());
  }

  try {
    const res = await realCall();
    return res.data;
  } catch (err) {
    if (
      err.code === 'ERR_NETWORK' ||
      err.code === 'ECONNABORTED' ||
      err.message?.includes('Network Error') ||
      err.response?.status === 502 ||
      err.response?.status === 503
    ) {
      console.warn('Backend server unreachable at', API_BASE_URL, '. Falling back to Interactive Mock Engine.');
      setUseMock(true);
      window.dispatchEvent(new Event('mock_mode_changed'));
      return mockCall();
    }
    throw err;
  }
}
