import { request } from './api.js';

export async function getServices({ page = 1, limit = 20, search = '' } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (search) params.set('search', search);
  const data = await request(`/services?${params}`);

  if (Array.isArray(data)) {
    return { items: data, total: data.length, page: 1, pages: 1 };
  }

  return {
    items: data?.items || data?.results || [],
    total: data?.total || 0,
    page: data?.page || 1,
    pages: data?.pages || 1
  };
}

export async function createService(service) {
  return request('/services', { method: 'POST', body: JSON.stringify(service) });
}

export async function updateService(id, service) {
  return request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(service) });
}

export async function deleteService(id) {
  return request(`/services/${id}`, { method: 'DELETE' });
}
