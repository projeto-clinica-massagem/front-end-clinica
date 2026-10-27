import { isMockApi, request } from './api.js';

export async function getClients() {
  const data = await request(isMockApi() ? '/clients?page=1&limit=100' : '/users/clients/');
  const items = Array.isArray(data) ? data : data?.items || data?.results || [];
  return items;
}

export async function createClient(client) {
  const payload = { ...client, role: 'client' };
  return request(isMockApi() ? '/clients' : '/users/', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateClient(id, client) {
  return request(isMockApi() ? `/clients/${id}` : `/users/${id}/`, { method: isMockApi() ? 'PUT' : 'PATCH', body: JSON.stringify(client) });
}

export async function deleteClient(id) {
  return request(isMockApi() ? `/clients/${id}` : `/users/${id}/`, { method: 'DELETE' });
}
