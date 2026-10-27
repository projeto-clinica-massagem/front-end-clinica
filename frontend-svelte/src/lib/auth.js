import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { isMockApi, request } from './api.js';

const initialUser = browser ? JSON.parse(localStorage.getItem('user') || 'null') : null;
export const user = writable(initialUser);

export async function login(email, password) {
  const result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  localStorage.setItem('access_token', result.access_token);
  if (result.refresh_token) localStorage.setItem('refresh_token', result.refresh_token);
  if (result.user) {
    localStorage.setItem('user', JSON.stringify(result.user));
    user.set(result.user);
  }

  const tenantId = result.user?.tenant_id;
  if (tenantId) localStorage.setItem('tenant_id', tenantId);
}

export async function logout() {
  if (!isMockApi() && localStorage.getItem('access_token')) {
    await request('/auth/logout', { method: 'POST' }).catch(() => {});
  }
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('tenant_id');
  localStorage.removeItem('user');
  user.set(null);
}

export function isAuthenticated() {
  return browser && Boolean(
    localStorage.getItem('access_token') && localStorage.getItem('user')
  );
}
