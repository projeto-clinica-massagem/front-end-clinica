import { request } from './api.js';

export async function getGoals({ year, month, status, type } = {}) {
  const params = new URLSearchParams({ page: '1', limit: '100' });
  if (year) params.set('year', String(year));
  if (month) params.set('month', String(month));
  if (status) params.set('status', status);
  if (type) params.set('type', type);
  const data = await request(`/goals?${params}`);
  return Array.isArray(data) ? data : data?.items || data?.results || [];
}

export async function getCurrentGoals() {
  const data = await request('/goals?status=active');
  return Array.isArray(data) ? data : data?.items || data?.results || [];
}

export async function getGoalsHistory() {
  const data = await request('/goals/history?months=12');
  return Array.isArray(data) ? { history: data } : data;
}

export async function createGoal(goal) {
  return request('/goals', { method: 'POST', body: JSON.stringify(goal) });
}

export async function updateGoal(id, goal) {
  return request(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(goal) });
}

export async function deleteGoal(id) {
  return request(`/goals/${id}`, { method: 'DELETE' });
}
