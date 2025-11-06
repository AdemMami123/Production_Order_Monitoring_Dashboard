import api from './api';

interface KPIData {
  totalOrders: number;
  completedOrders: number;
  avgProductionTime: number;
  completionRate: number;
  delayedOrders: number;
  statusBreakdown: Array<{ status: string; count: number }>;
  workerStats: Array<{
    workerId: string;
    workerName: string;
    totalOrders: number;
    completedOrders: number;
    completionRate: number;
  }>;
}

interface OrderVolumeData {
  date: string;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
}

interface StatusDistributionData {
  status: string;
  count: number;
  percentage: number;
}

interface WorkerProductivityData {
  workerId: string;
  workerName: string;
  workerEmail: string;
  totalOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  pendingOrders: number;
  blockedOrders: number;
  cancelledOrders: number;
  completionRate: number;
}

interface AnalyticsFilters {
  workerId?: string;
  startDate?: string;
  endDate?: string;
  timeInterval?: 'day' | 'week' | 'month';
}

const analyticsService = {
  /**
   * Get aggregated KPI metrics
   */
  getKPIs: async (filters?: AnalyticsFilters): Promise<KPIData> => {
    const params = new URLSearchParams();
    if (filters?.workerId) params.append('workerId', filters.workerId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/analytics/kpis?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get order volume over time
   */
  getOrderVolume: async (filters?: AnalyticsFilters): Promise<OrderVolumeData[]> => {
    const params = new URLSearchParams();
    if (filters?.timeInterval) params.append('timeInterval', filters.timeInterval);
    if (filters?.workerId) params.append('workerId', filters.workerId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/analytics/order-volume?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get order status distribution
   */
  getStatusDistribution: async (filters?: AnalyticsFilters): Promise<StatusDistributionData[]> => {
    const params = new URLSearchParams();
    if (filters?.workerId) params.append('workerId', filters.workerId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/analytics/status-distribution?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get worker productivity metrics
   */
  getWorkerProductivity: async (filters?: AnalyticsFilters): Promise<WorkerProductivityData[]> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/analytics/worker-productivity?${params.toString()}`);
    return response.data.data;
  },
};

export default analyticsService;

export type {
  KPIData,
  OrderVolumeData,
  StatusDistributionData,
  WorkerProductivityData,
  AnalyticsFilters,
};
