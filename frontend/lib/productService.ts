import api from './api';
import { Product } from './orderService';

class ProductService {
  async getAllProducts(filters?: { is_active?: boolean; search?: string }) {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.is_active !== undefined) {
        params.append('is_active', filters.is_active.toString());
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
    }
    const response = await api.get(`/products?${params.toString()}`);
    // Backend may return { success, data: [...] } or the array directly.
    // Normalize to always return an array of products.
    const payload = response.data;
    if (payload && Array.isArray(payload)) {
      return payload;
    }
    if (payload && payload.data && Array.isArray(payload.data)) {
      return payload.data;
    }
    // Fallback: return empty array to avoid runtime errors
    return [];
  }

  async getProductById(id: string) {
    const response = await api.get(`/products/${id}`);
    // normalize if backend wraps response
    return response.data && response.data.data ? response.data.data : response.data;
  }

  async createProduct(data: Omit<Product, '_id' | 'createdAt' | 'updatedAt' | 'is_active'>) {
    const response = await api.post('/products', data);
    return response.data && response.data.data ? response.data.data : response.data;
  }

  async updateProduct(id: string, data: Partial<Product>) {
    const response = await api.put(`/products/${id}`, data);
    return response.data && response.data.data ? response.data.data : response.data;
  }

  async deactivateProduct(id: string) {
    const response = await api.patch(`/products/${id}/deactivate`);
    return response.data && response.data.data ? response.data.data : response.data;
  }

  async deleteProduct(id: string) {
    const response = await api.delete(`/products/${id}`);
    return response.data && response.data.data ? response.data.data : response.data;
  }
}

export default new ProductService();
