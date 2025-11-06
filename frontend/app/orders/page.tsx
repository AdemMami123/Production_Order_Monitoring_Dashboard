
'use client';


import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import orderService from '@/lib/orderService';
import userService from '@/lib/userService';
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
  MdPerson,
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
  const [assignableUsers, setAssignableUsers] = useState<any[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, statusFilter, searchQuery, priorityFilter, assignedToFilter, startDateFilter, endDateFilter]);

  const loadUsers = async () => {
    try {
      const users = await userService.getAssignableUsers();
      setAssignableUsers(users || []);
    } catch (err) {
      // Silent fail - users filter is optional
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      if (searchQuery) filters.search = searchQuery;
      if (priorityFilter) filters.priority = priorityFilter;
      if (assignedToFilter) filters.assigned_to = assignedToFilter;
      if (startDateFilter) filters.start_date = startDateFilter;
      if (endDateFilter) filters.end_date = endDateFilter;

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
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const clearFilters = () => {
    setStatusFilter('');
    setSearchQuery('');
    setPriorityFilter('');
    setAssignedToFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading orders" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <FadeIn direction="down">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                <MdShoppingCart className="text-blue-500" />
                Production Orders
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">Manage and track all production orders</p>
            </div>

            {(user?.role === 'admin' || user?.role === 'manager') && (
              <motion.button
                onClick={() => router.push('/orders/new')}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <MdAddCircle className="text-xl" />
                Create Order
              </motion.button>
            )}
          </div>
        </FadeIn>

        {/* Filters */}
        <ScaleIn delay={0.1}>
          <div className=" rounded-2xl shadow-xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <MdFilterList className="text-2xl text-blue-500" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Filters</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Status</label>
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Priority</label>
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  <MdPerson className="inline mr-1" />
                  Assigned To
                </label>
                <select
                  value={assignedToFilter}
                  onChange={(e) => setAssignedToFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">All Users</option>
                  {assignableUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username}
                    </option>
                  ))}
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

            {/* Date Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  <MdCalendarToday className="inline mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  <MdCalendarToday className="inline mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              {orders.length === 0 ? (
                <div className="p-16 text-center">
                  <MdShoppingCart className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No orders found</p>
                  <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or create a new order</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <colgroup>
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '30%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '6%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '12%' }} />
                      </colgroup>

                      <thead className="bg-gray-800 dark:bg-gray-900">
                        <tr className="h-14">
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-100 dark:text-gray-200 uppercase tracking-wider whitespace-nowrap align-middle">Order #</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-100 dark:text-gray-200 uppercase tracking-wider whitespace-nowrap align-middle">Product</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-100 dark:text-gray-200 uppercase tracking-wider whitespace-nowrap align-middle">Status</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-100 dark:text-gray-200 uppercase tracking-wider whitespace-nowrap align-middle">Priority</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-100 dark:text-gray-200 uppercase tracking-wider whitespace-nowrap align-middle">Assigned To</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-100 dark:text-gray-200 uppercase tracking-wider whitespace-nowrap align-middle">Quantity</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-100 dark:text-gray-200 uppercase tracking-wider whitespace-nowrap align-middle">Deadline</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-100 dark:text-gray-200 uppercase tracking-wider whitespace-nowrap align-middle">Actions</th>
                        </tr>
                      </thead>

                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        <StaggerChildren staggerDelay={0.03}>
                          {orders.map((order) => (
                            <motion.tr
                              key={order._id}
                              variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}
                              className="hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group h-16"
                              onClick={() => router.push(`/orders/${order._id}`)}
                              whileHover={{ scale: 1.002 }}
                            >
                              <td className="px-6 py-4 align-middle">
                                <div className="min-w-0">
                                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400 truncate block whitespace-nowrap">{order.order_number}</span>
                                </div>
                              </td>

                              <td className="px-6 py-4 align-middle">
                                <div className="flex flex-col gap-1 min-w-0">
                                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate whitespace-nowrap">{order.product_id?.name || 'N/A'}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 truncate whitespace-nowrap">{order.product_id?.reference}</div>
                                </div>
                              </td>

                              <td className="px-6 py-4 align-middle text-center">
                                <div className="flex items-center justify-center">
                                  <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full whitespace-nowrap ${getStatusColor(order.status)}`}>{order.status.replace('_', ' ')}</span>
                                </div>
                              </td>

                              <td className="px-6 py-4 align-middle text-center">
                                <div className="flex items-center justify-center">
                                  <span className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap ${getPriorityColor(order.priority)}`}>{priorityToLabel(order.priority).toUpperCase()}</span>
                                </div>
                              </td>

                              <td className="px-6 py-4 align-middle">
                                <div className="flex items-center gap-2 min-w-0">
                                  <MdPerson className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                  <div className="text-sm text-gray-900 dark:text-gray-200 truncate whitespace-nowrap">{order.assigned_to?.username || <span className="italic text-gray-500 dark:text-gray-400">Unassigned</span>}</div>
                                </div>
                              </td>

                              <td className="px-6 py-4 align-middle text-center">
                                <div className="text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">{order.quantity}</div>
                              </td>

                              <td className="px-6 py-4 align-middle text-right">
                                <div className="flex items-center justify-end gap-2 min-w-0">
                                  <MdCalendarToday className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                  <span className="text-sm text-gray-900 dark:text-gray-200 truncate whitespace-nowrap">{formatDate(order.deadline)}</span>
                                </div>
                              </td>

                              <td className="px-6 py-4 align-middle text-center">
                                <div className="flex items-center justify-center">
                                  <motion.button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/orders/${order._id}`);
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold whitespace-nowrap"
                                  >
                                    <MdVisibility />
                                    View
                                  </motion.button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </StaggerChildren>
                      </tbody>
                    </table>
                  </div>

                  {/* Orders count */}
                  <div className="bg-gray-100 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
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
