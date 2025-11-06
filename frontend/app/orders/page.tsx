'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import orderService from '@/lib/orderService';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { FadeIn, ScaleIn, StaggerChildren } from '@/components/animations';
import { motion } from 'framer-motion';
import { 
  MdAddCircle, 
  MdSearch, 
  MdFilterList, 
  MdClear, 
  MdShoppingCart,
  MdVisibility,
  MdCalendarToday,
  MdPerson
} from 'react-icons/md';

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
    // priority can be a number (from backend) or a string in frontend
    priority: number | string;
  deadline: string;
  created_at: string;
}

export default function OrdersPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, statusFilter, searchQuery, priorityFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      if (searchQuery) filters.search = searchQuery;
      if (priorityFilter) filters.priority = priorityFilter;

      const data = await orderService.getAllOrders(filters);
      const ordersList = Array.isArray(data) ? data : data.orders || [];
      setOrders(ordersList);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
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
  // Normalize priority input (number or string) to a label: 'low'|'medium'|'high'
  const priorityToLabel = (p: number | string) => {
    if (typeof p === 'number') {
      // map numbers to labels (common mapping used in UI)
      if (p <= 1) return 'low';
      if (p <= 3) return 'medium';
      return 'high';
    }
    const lowered = String(p).toLowerCase();
    if (['low', 'medium', 'high'].includes(lowered)) return lowered;
    // fallback: try to parse numeric strings
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
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const clearFilters = () => {
    setStatusFilter('');
    setSearchQuery('');
    setPriorityFilter('');
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading orders" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <FadeIn direction="down">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                <MdShoppingCart className="text-blue-500" />
                Production Orders
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                Manage and track all production orders
              </p>
            </div>
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <motion.button
                onClick={() => router.push('/orders/new')}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <MdAddCircle className="text-xl" />
                Create Order
              </motion.button>
            )}
          </div>
        </FadeIn>

        {/* Filters */}
        <ScaleIn delay={0.1}>
          <div className="glass dark:glass-dark rounded-2xl shadow-xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <MdFilterList className="text-2xl text-blue-500" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Filters</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  <MdSearch className="inline mr-1" />
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Order number or product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="flex items-end">
                <motion.button
                  onClick={clearFilters}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold transition-colors"
                >
                  <MdClear />
                  Clear Filters
                </motion.button>
              </div>
            </div>
          </div>
        </ScaleIn>

        {/* Orders Table */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" text="Loading orders" />
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchOrders} />
        ) : (
          <ScaleIn delay={0.2}>
            <div className="glass dark:glass-dark rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              {orders.length === 0 ? (
                <div className="p-16 text-center">
                  <MdShoppingCart className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No orders found</p>
                  <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or create a new order</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                        <tr>
                          {['Order #', 'Product', 'Status', 'Priority', 'Assigned To', 'Quantity', 'Deadline', 'Actions'].map((header) => (
                            <th
                              key={header}
                              className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        <StaggerChildren staggerDelay={0.03}>
                          {orders.map((order, index) => (
                            <motion.tr
                              key={order._id}
                              variants={{
                                hidden: { opacity: 0, x: -20 },
                                visible: { opacity: 1, x: 0 },
                              }}
                              className="hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                              onClick={() => router.push(`/orders/${order._id}`)}
                              whileHover={{ scale: 1.005 }}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                  {order.order_number}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  {order.product_id?.name || 'N/A'}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {order.product_id?.reference}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full ${getStatusColor(order.status)}`}>
                                  {order.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1.5 text-xs font-bold rounded-lg ${getPriorityColor(order.priority)}`}>
                                  {priorityToLabel(order.priority).toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                  <MdPerson className="text-gray-400" />
                                  {order.assigned_to?.username || <span className="italic text-gray-400">Unassigned</span>}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                  {order.quantity}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                  <MdCalendarToday className="text-gray-400" />
                                  {formatDate(order.deadline)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/orders/${order._id}`);
                                  }}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold"
                                >
                                  <MdVisibility />
                                  View
                                </motion.button>
                              </td>
                            </motion.tr>
                          ))}
                        </StaggerChildren>
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Orders count */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Showing <span className="text-blue-600 dark:text-blue-400">{orders.length}</span> order{orders.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </>
              )}
            </div>
          </ScaleIn>
        )}
      </div>
    </div>
  );
}
