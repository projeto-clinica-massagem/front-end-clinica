import { mockRequest } from './mock-api.js';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const MOCK_API = import.meta.env.VITE_MOCK_API !== 'false';
let refreshing = null;

export async function request(path, options = {}) {
  if (MOCK_API) return mockRequest(path, options);

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
  const headers = new Headers(options.headers);
  const url = `${API_URL.replace(/\/$/, '')}${djangoPath(path)}`;

  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => null);

  if (response.status === 401 && token && !options._retry && !path.includes('/auth/')) {
    try {
      const refreshed = await refreshAccessToken();
      return request(path, { ...options, _retry: true, headers: { ...options.headers, Authorization: `Bearer ${refreshed}` } });
    } catch {
      clearSession();
    }
  }

  if (!response.ok) {
    const error = new Error(data?.detail || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function apiUrl() {
  return API_URL;
}

export function isMockApi() {
  return MOCK_API;
}

function djangoPath(path) {
  const [pathname, query = ''] = path.split('?');
  const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return query ? `${normalized}?${query}` : normalized;
}

async function refreshAccessToken() {
  if (!refreshing) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('Refresh token ausente');
    refreshing = fetch(`${API_URL.replace(/\/$/, '')}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    }).then(async (response) => {
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.access_token) throw new Error(data?.detail || 'Sessão expirada');
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
      return data.access_token;
    }).finally(() => { refreshing = null; });
  }
  return refreshing;
}

function clearSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('tenant_id');
  window.dispatchEvent(new CustomEvent('auth-expired'));
}
