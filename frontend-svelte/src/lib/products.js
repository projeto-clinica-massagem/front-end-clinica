import { isMockApi, request } from './api.js';

export async function getProducts({ page = 1, limit = 20, search = '', active, category = '', lowStock = false } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set('search', search);
  if (active !== undefined) params.set('active', String(active));
  if (category) params.set('category', category);
  if (lowStock) params.set('low_stock', 'true');

  const data = await request(`/products?${params}`);
  const items = Array.isArray(data) ? data : data?.items || data?.results || [];
  const visibleItems = lowStock ? items.filter((item) => Number(item.stock) <= 8) : items;
  if (Array.isArray(data)) return { items: visibleItems, total: visibleItems.length, page: 1, pages: 1 };
  return { items: visibleItems, total: lowStock ? visibleItems.length : (data?.total ?? data?.count ?? 0), page: data?.page || 1, pages: data?.pages || Math.max(1, Math.ceil((data?.count || 0) / (data?.limit || 20))) };
}

export async function createProduct(product) {
  return request('/products', { method: 'POST', body: JSON.stringify(product) });
}

export async function updateProduct(id, product) {
  return request(`/products/${id}`, { method: isMockApi() ? 'PUT' : 'PATCH', body: JSON.stringify(product) });
}

export async function deleteProduct(id) {
  return request(`/products/${id}`, { method: 'DELETE' });
}

export async function getProductCategories() {
  if (!isMockApi()) return [];
  const data = await request('/products/categories/list');
  return Array.isArray(data) ? data : data?.categories || [];
}
