import { request } from './api.js';

export async function getCart() {
  return request('/cart');
}

export async function updateCartItem(id, quantity) {
  return request(`/cart/items/${id}`, { method: 'PATCH', body: JSON.stringify({ quantity }) });
}

export async function removeCartItem(id) {
  return request(`/cart/items/${id}`, { method: 'DELETE' });
}

export async function clearCart() {
  return request('/cart/clear', { method: 'POST' });
}
