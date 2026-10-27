import { isMockApi, request } from './api.js';

export async function getAppointments({ search = '', status = '' } = {}) {
  const params = new URLSearchParams({ page: '1', limit: '100' });
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  const data = await request(`/appointments?${params}`);
  return Array.isArray(data) ? data : data?.items || [];
}

export async function getClients() {
  const data = await request(isMockApi() ? '/clients?page=1&limit=100' : '/users/clients/');
  return Array.isArray(data) ? data : data?.items || [];
}

export async function getMassagistas() {
  if (isMockApi()) return [];
  const data = await request(isMockApi() ? '/massagistas?page=1&limit=100' : '/users/massagistas/');
  return Array.isArray(data) ? data : data?.items || data?.results || [];
}

export async function getRooms() {
  if (isMockApi()) return [];
  const data = await request(isMockApi() ? '/rooms?page=1&limit=100' : '/rooms/');
  return Array.isArray(data) ? data : data?.items || data?.results || [];
}

export async function getActiveServices() {
  const data = await request('/services?page=1&limit=100&active=true');
  const services = Array.isArray(data) ? data : data?.items || [];
  return services.filter((service) => service.active !== false);
}

export async function createAppointment(appointment) {
  return request('/appointments', { method: 'POST', body: JSON.stringify(toBackendAppointment(appointment)) });
}

export async function updateAppointment(id, appointment) {
  return request(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(toBackendAppointment(appointment)) });
}

export async function cancelAppointment(id) {
  return request(`/appointments/${id}/cancel`, { method: 'POST' });
}

function toBackendAppointment(appointment) {
  if (isMockApi()) return appointment;
  const start = new Date(appointment.scheduled_date);
  const end = new Date(start.getTime() + Number(appointment.duration_minutes || 60) * 60000);
  return {
    client_id: appointment.client_id ? Number(appointment.client_id) : undefined,
    massagista_id: appointment.massagista_id ? Number(appointment.massagista_id) : undefined,
    room_id: appointment.room_id || undefined,
    scheduled_start: start.toISOString(),
    scheduled_end: end.toISOString(),
    service_ids: [appointment.service_id],
    notes: appointment.notes || ''
  };
}
