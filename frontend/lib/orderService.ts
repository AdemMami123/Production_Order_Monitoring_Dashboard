import api from './api';

export interface Product {
  _id: string;
  name: string;
  reference: string;
  description?: string;
  unit: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  _id: string;
  order_number: string;
  product_id: {
    _id: string;
    name: string;
    reference: string;
    unit: string;
  } | string;
  assigned_to?: {
    _id: string;
    username: string;
    email: string;
  } | string;
  created_by: {
    _id: string;
    username: string;
  } | string;
  status: 'pending' | 'in_progress' | 'done' | 'blocked';
  quantity: number;
  priority: number;
  start_date?: string;
  end_date?: string;
  deadline?: string;
  last_update: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFilters {
  status?: string;
  product_id?: string;
  assigned_to?: string;
  priority?: number;
  search?: string;
}

export interface CreateOrderData {
  order_number?: string;
  product_id: string;
  assigned_to?: string;
  quantity: number;
  priority?: number;
  deadline?: string;
  notes?: string;
}

export interface UpdateOrderData {
  quantity?: number;
  priority?: number;
  deadline?: string;
  notes?: string;
}

class OrderService {
  async getAllOrders(filters?: OrderFilters) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/orders?${params.toString()}`);
    // backend wraps results in { success, count, data }
    return response.data?.data ?? response.data;
  }

  async getOrderById(id: string) {
    const response = await api.get(`/orders/${id}`);
    return response.data?.data ?? response.data;
  }

  async createOrder(data: CreateOrderData) {
    try {
      const response = await api.post('/orders', data);
      return response.data?.data ?? response.data;
    } catch (err: any) {
      // Surface backend error message if available
      const message = err?.response?.data?.error || err.message || 'Failed to create order';
      throw new Error(message);
    }
  }

  async updateOrder(id: string, data: UpdateOrderData) {
    const response = await api.put(`/orders/${id}`, data);
    return response.data;
  }

  async updateOrderStatus(id: string, status: string, notes?: string) {
    const response = await api.patch(`/orders/${id}/status`, { status, notes });
    return response.data;
  }

  async assignOrder(id: string, assigned_to: string | null, notes?: string) {
    const response = await api.patch(`/orders/${id}/assign`, { assigned_to, notes });
    return response.data;
  }

  async blockOrder(id: string, reason: string) {
    const response = await api.patch(`/orders/${id}/block`, { reason });
    return response.data;
  }

  async unblockOrder(id: string, status: string, notes?: string) {
    const response = await api.patch(`/orders/${id}/unblock`, { status, notes });
    return response.data;
  }

  async completeOrder(id: string, notes?: string) {
    const response = await api.patch(`/orders/${id}/complete`, { notes });
    return response.data;
  }

  async deleteOrder(id: string) {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  }

  async getOrderLogs(id: string) {
    const response = await api.get(`/orders/${id}/logs`);
    return response.data;
  }

  async getOrderStatistics(filters?: { assigned_to?: string }) {
    const params = new URLSearchParams();
    if (filters?.assigned_to) {
      params.append('assigned_to', filters.assigned_to);
    }
    const response = await api.get(`/orders/statistics?${params.toString()}`);
    return response.data;
  }
}

export default new OrderService();
