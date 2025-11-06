'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import orderService from '@/lib/orderService';
import analyticsService from '@/lib/analyticsService';
import type { KPIData, OrderVolumeData, StatusDistributionData, WorkerProductivityData } from '@/lib/analyticsService';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { FadeIn, ScaleIn, StaggerChildren } from '@/components/animations';
import { KPISummary } from '@/components/KPICards';
import { OrderVolumeChart, StatusDistributionChart, WorkerProductivityChart } from '@/components/AnalyticsCharts';
import { motion } from 'framer-motion';
import { 
  MdShoppingCart, 
  MdPending, 
  MdAutorenew, 
  MdCheckCircle, 
  MdBlock, 
  MdCancel,
  MdAddCircle,
  MdInventory,
  MdPeople,
  MdTrendingUp,
  MdArrowForward,
  MdFilterList
} from 'react-icons/md';

interface OrderStatistics {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  blocked: number;
  cancelled: number;
}

interface Order {
  _id: string;
  order_number: string;
  product_id: {
    _id: string;
    name: string;
    reference: string;
  };
  assigned_to?: {
    _id: string;
    username: string;
  };
  status: string;
  quantity: number;
  priority: string;
  deadline: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [statistics, setStatistics] = useState<OrderStatistics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Analytics state
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [orderVolumeData, setOrderVolumeData] = useState<OrderVolumeData[]>([]);
  const [statusDistributionData, setStatusDistributionData] = useState<StatusDistributionData[]>([]);
  const [workerProductivityData, setWorkerProductivityData] = useState<WorkerProductivityData[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');

  // Analytics filters
  const [timeInterval, setTimeInterval] = useState<'day' | 'week' | 'month'>('day');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  
  // Show analytics only for admin and manager
  const canViewAnalytics = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
      if (canViewAnalytics) {
        fetchAnalyticsData();
      }
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && canViewAnalytics) {
      fetchAnalyticsData();
    }
  }, [timeInterval, selectedWorkerId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch statistics
      const stats = await orderService.getOrderStatistics();
      setStatistics(stats);

      // Fetch recent orders (showing all for now, backend will limit)
      const ordersData = await orderService.getAllOrders();
      // Get first 5 orders
      const orders = Array.isArray(ordersData) ? ordersData : ordersData.orders || [];
      setRecentOrders(orders.slice(0, 5));
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    if (!canViewAnalytics) return;
    
    setAnalyticsLoading(true);
    setAnalyticsError('');
    try {
      const filters = {
        timeInterval,
        workerId: selectedWorkerId || undefined,
      };

      const [kpis, volume, distribution, productivity] = await Promise.all([
        analyticsService.getKPIs(filters),
        analyticsService.getOrderVolume(filters),
        analyticsService.getStatusDistribution(filters),
        analyticsService.getWorkerProductivity(filters),
      ]);

      setKpiData(kpis);
      setOrderVolumeData(volume);
      setStatusDistributionData(distribution);
      setWorkerProductivityData(productivity);
    } catch (err: any) {
      setAnalyticsError(err.message || 'Failed to load analytics data');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  // Normalize priority (number|string) to a label
  const priorityToLabel = (p: number | string) => {
    if (typeof p === 'number') {
      if (p <= 1) return 'low';
      if (p <= 3) return 'medium';
      return 'high';
    }
    const lowered = String(p).toLowerCase();
    if (['low', 'medium', 'high'].includes(lowered)) return lowered;
    const n = Number(p);
    if (!isNaN(n)) {
      if (n <= 1) return 'low';
      if (n <= 3) return 'medium';
      return 'high';
    }
    return 'medium';
  };

  const getPriorityColor = (priority: number | string) => {
    const label = priorityToLabel(priority);
    switch (label) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading dashboard" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading data" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message={error} onRetry={fetchDashboardData} />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Orders',
      value: statistics?.total || 0,
      icon: MdShoppingCart,
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Pending',
      value: statistics?.pending || 0,
      icon: MdPending,
      gradient: 'from-yellow-500 to-yellow-600',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'In Progress',
      value: statistics?.in_progress || 0,
      icon: MdAutorenew,
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Completed',
      value: statistics?.completed || 0,
      icon: MdCheckCircle,
      gradient: 'from-green-500 to-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Blocked',
      value: statistics?.blocked || 0,
      icon: MdBlock,
      gradient: 'from-red-500 to-red-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-600 dark:text-red-400',
    },
    {
      title: 'Cancelled',
      value: statistics?.cancelled || 0,
      icon: MdCancel,
      gradient: 'from-gray-500 to-gray-600',
      bg: 'bg-gray-50 dark:bg-gray-800',
      textColor: 'text-gray-600 dark:text-gray-400',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Header */}
        <FadeIn direction="down">
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-3">
              <MdTrendingUp className="text-blue-500" />
              Welcome back, {user?.username}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
              Here's your production overview for today
            </p>
          </div>
        </FadeIn>

        {/* Statistics Cards */}
        {statistics && (
          <StaggerChildren staggerDelay={0.08} initialDelay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.title}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <div className={`${stat.bg} rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md`}>
                          <Icon className="text-2xl text-white" />
                        </div>
                        <motion.div
                          animate={{ rotate: [0, 10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <MdTrendingUp className={`text-xl ${stat.textColor} opacity-50`} />
                        </motion.div>
                      </div>
                      <div className={`${stat.textColor} text-sm font-semibold mb-1`}>
                        {stat.title}
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.05, type: 'spring', stiffness: 200 }}
                        className={`text-3xl font-extrabold ${stat.textColor}`}
                      >
                        {stat.value}
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </StaggerChildren>
        )}

        {/* Analytics Section (Admin/Manager only) */}
        {canViewAnalytics && (
          <div className="mb-8">
            <FadeIn direction="up" delay={0.5}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <MdTrendingUp className="text-purple-500" />
                    Analytics & Insights
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Track performance metrics and trends
                  </p>
                </div>

                {/* Analytics Filters */}
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 glass dark:glass-dark rounded-xl p-1 border border-gray-200 dark:border-gray-700">
                    <MdFilterList className="text-gray-400 ml-2" />
                    <select
                      value={timeInterval}
                      onChange={(e) => setTimeInterval(e.target.value as 'day' | 'week' | 'month')}
                      className="bg-transparent px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
                    >
                      <option value="day">Daily</option>
                      <option value="week">Weekly</option>
                      <option value="month">Monthly</option>
                    </select>
                  </div>

                  {workerProductivityData.length > 0 && (
                    <div className="flex items-center gap-2 glass dark:glass-dark rounded-xl p-1 border border-gray-200 dark:border-gray-700">
                      <MdPeople className="text-gray-400 ml-2" />
                      <select
                        value={selectedWorkerId}
                        onChange={(e) => setSelectedWorkerId(e.target.value)}
                        className="bg-transparent px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
                      >
                        <option value="">All Workers</option>
                        {workerProductivityData.map((worker) => (
                          <option key={worker.workerId} value={worker.workerId}>
                            {worker.workerName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </FadeIn>

            {/* KPI Cards */}
            {analyticsLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" text="Loading analytics" />
              </div>
            ) : analyticsError ? (
              <ErrorMessage message={analyticsError} onRetry={fetchAnalyticsData} />
            ) : kpiData ? (
              <>
                <div className="mb-8">
                  <KPISummary
                    totalOrders={kpiData.totalOrders}
                    completedOrders={kpiData.completedOrders}
                    avgProductionTime={kpiData.avgProductionTime}
                    completionRate={kpiData.completionRate}
                    delayedOrders={kpiData.delayedOrders}
                  />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <OrderVolumeChart data={orderVolumeData} />
                  <StatusDistributionChart data={statusDistributionData} />
                </div>

                <div className="mb-8">
                  <WorkerProductivityChart data={workerProductivityData} />
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Recent Orders Section */}
        <ScaleIn delay={0.6}>
          <div className="glass dark:glass-dark rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-gray-200 dark:border-gray-700 gap-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Recent Orders
              </h2>
              <motion.button
                onClick={() => router.push('/orders')}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold text-sm bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg transition-colors"
              >
                View All
                <MdArrowForward />
              </motion.button>
            </div>

            {recentOrders.length === 0 ? (
              <div className="p-12 text-center">
                <MdShoppingCart className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  No orders found. Create your first order to get started!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      {['Order #', 'Product', 'Status', 'Priority', 'Assigned To', 'Deadline', 'Qty'].map((header) => (
                        <th
                          key={header}
                          className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {recentOrders.map((order, index) => (
                      <motion.tr
                        key={order._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.05 }}
                        onClick={() => router.push(`/orders/${order._id}`)}
                        className="hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors"
                        whileHover={{ scale: 1.01 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {order.order_number}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {order.product_id?.name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {order.product_id?.reference}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-bold ${getPriorityColor(order.priority)}`}>
                            {priorityToLabel(order.priority as any).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {order.assigned_to?.username || (
                            <span className="text-gray-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {formatDate(order.deadline)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {order.quantity}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </ScaleIn>

        {/* Quick Actions (Admin/Manager only) */}
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <FadeIn direction="up" delay={0.8}>
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <motion.button
                  onClick={() => router.push('/orders/new')}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold py-6 px-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all text-left"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform" />
                  <div className="relative flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MdAddCircle className="text-2xl" />
                    </div>
                    <div>
                      <div className="text-xl font-bold mb-1">Create New Order</div>
                      <div className="text-sm text-blue-100">Add a new production order</div>
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => router.push('/products')}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold py-6 px-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all text-left"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform" />
                  <div className="relative flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MdInventory className="text-2xl" />
                    </div>
                    <div>
                      <div className="text-xl font-bold mb-1">Manage Products</div>
                      <div className="text-sm text-green-100">View and edit product catalog</div>
                    </div>
                  </div>
                </motion.button>

                {user?.role === 'admin' && (
                  <motion.button
                    onClick={() => router.push('/users')}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold py-6 px-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all text-left"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform" />
                    <div className="relative flex items-start gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MdPeople className="text-2xl" />
                      </div>
                      <div>
                        <div className="text-xl font-bold mb-1">Manage Users</div>
                        <div className="text-sm text-purple-100">Add or edit team members</div>
                      </div>
                    </div>
                  </motion.button>
                )}
              </div>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
}
