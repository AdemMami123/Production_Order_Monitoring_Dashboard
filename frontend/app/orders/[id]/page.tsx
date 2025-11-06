'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import orderService from '@/lib/orderService';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import AssignmentModal from '@/components/AssignmentModal';
import { motion } from 'framer-motion';
import { FadeIn, ScaleIn, SlideIn, StaggerChildren } from '@/components/animations';
import { 
  MdArrowBack, 
  MdEdit, 
  MdDelete, 
  MdShoppingCart, 
  MdInventory, 
  MdPerson, 
  MdCalendarToday,
  MdAccessTime,
  MdNotes,
  MdAssignment,
  MdTimeline,
  MdPersonAdd
} from 'react-icons/md';

interface Order {
  _id: string;
  order_number: string;
  product_id: {
    _id: string;
    name: string;
    reference: string;
    unit: string;
  };
  assigned_to?: {
    _id: string;
    username: string;
    email: string;
  };
  created_by: {
    _id: string;
    username: string;
  };
  status: string;
  quantity: number;
  priority: string;
  // priority may be number or string depending on backend/frontend
  // allow both for safety
  // priority: number | string;
  start_date?: string;
  end_date?: string;
  deadline?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && orderId) {
      fetchOrder();
    }
  }, [isAuthenticated, orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    try {
      await orderService.deleteOrder(orderId);
      router.push('/orders');
    } catch (err: any) {
      setError(err.message || 'Failed to delete order');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700';
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700';
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700';
      case 'blocked':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700';
      case 'cancelled':
        return 'bg-gray-100 dark:bg-gray-700/30 text-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600';
      default:
        return 'bg-gray-100 dark:bg-gray-700/30 text-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600';
    }
  };
  // Normalize priority (number or string) to 'low'|'medium'|'high'
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
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700';
      case 'low':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <FadeIn>
          <ErrorMessage message={error || 'Order not found'} onRetry={fetchOrder} />
          <motion.button
            onClick={() => router.push('/orders')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-4 flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold"
          >
            <MdArrowBack />
            Back to Orders
          </motion.button>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <FadeIn>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
            <div>
              <motion.button
                onClick={() => router.push('/orders')}
                whileHover={{ x: -4 }}
                whileTap={{ scale: 0.95 }}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-3 flex items-center gap-2 font-semibold"
              >
                <MdArrowBack className="text-lg" />
                Back to Orders
              </motion.button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 dark:bg-blue-600 rounded-xl shadow-lg">
                  <MdShoppingCart className="text-3xl text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Order {order.order_number}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                    <MdCalendarToday className="text-sm" />
                    Created on {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>
            </div>
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <div className="flex gap-3">
                <motion.button
                  onClick={() => router.push(`/orders/${orderId}/edit`)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="gradient-primary text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-2xl transition-shadow flex items-center gap-2"
                >
                  <MdEdit className="text-lg" />
                  Edit
                </motion.button>
                <motion.button
                  onClick={handleDelete}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-2xl transition-shadow flex items-center gap-2"
                >
                  <MdDelete className="text-lg" />
                  Delete
                </motion.button>
              </div>
            )}
          </div>
        </FadeIn>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <ScaleIn delay={0.1}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <MdShoppingCart className="text-2xl text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Order Information</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Order Number</label>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{order.order_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Status</label>
                    <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-xl ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Priority</label>
                    <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-xl ${getPriorityColor(order.priority)}`}>
                      {priorityToLabel(order.priority as any).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Quantity</label>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{order.quantity} {order.product_id.unit}</p>
                  </div>
                </div>
              </div>
            </ScaleIn>

            {/* Product Info */}
            <ScaleIn delay={0.2}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <MdInventory className="text-2xl text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Product Details</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Product Name</label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{order.product_id.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Reference</label>
                    <p className="text-gray-700 dark:text-gray-300 font-mono">{order.product_id.reference}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Unit</label>
                    <p className="text-gray-700 dark:text-gray-300">{order.product_id.unit}</p>
                  </div>
                </div>
              </div>
            </ScaleIn>

            {/* Notes */}
            {order.notes && (
              <ScaleIn delay={0.3}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <MdNotes className="text-2xl text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notes</h2>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{order.notes}</p>
                </div>
              </ScaleIn>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment Info */}
            <ScaleIn delay={0.15}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <MdAssignment className="text-2xl text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Assignment</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Assigned To</label>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <MdPerson className="text-xl text-blue-600 dark:text-blue-400" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {order.assigned_to?.username || 'Unassigned'}
                        </p>
                        {order.assigned_to?.email && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{order.assigned_to.email}</p>
                        )}
                      </div>
                    </div>
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                      <motion.button
                        onClick={() => setShowAssignmentModal(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full mt-3 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
                      >
                        <MdPersonAdd className="text-lg" />
                        {order.assigned_to ? 'Reassign Order' : 'Assign Order'}
                      </motion.button>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Created By</label>
                    <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <MdPerson className="text-xl text-purple-600 dark:text-purple-400" />
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{order.created_by.username}</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScaleIn>

            {/* Dates */}
            <ScaleIn delay={0.25}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <MdTimeline className="text-2xl text-orange-600 dark:text-orange-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Timeline</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MdAccessTime className="text-gray-400 dark:text-gray-500 mt-1 flex-shrink-0" />
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Created At</label>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  {order.start_date && (
                    <div className="flex items-start gap-3">
                      <MdCalendarToday className="text-green-500 dark:text-green-400 mt-1 flex-shrink-0" />
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(order.start_date)}</p>
                      </div>
                    </div>
                  )}
                  {order.deadline && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <MdCalendarToday className="text-red-600 dark:text-red-400 mt-1 flex-shrink-0" />
                      <div>
                        <label className="block text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Deadline</label>
                        <p className="text-sm font-bold text-red-700 dark:text-red-300">{formatDate(order.deadline)}</p>
                      </div>
                    </div>
                  )}
                  {order.end_date && (
                    <div className="flex items-start gap-3">
                      <MdCalendarToday className="text-blue-500 dark:text-blue-400 mt-1 flex-shrink-0" />
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(order.end_date)}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <MdAccessTime className="text-gray-400 dark:text-gray-500 mt-1 flex-shrink-0" />
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Last Updated</label>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(order.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScaleIn>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        orderId={orderId}
        currentAssignee={order.assigned_to}
        onSuccess={fetchOrder}
      />
    </div>
  );
}
