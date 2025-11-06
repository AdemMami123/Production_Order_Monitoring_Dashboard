'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import orderService from '@/lib/orderService';
import productService from '@/lib/productService';
import userService from '@/lib/userService';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FadeIn, ScaleIn } from '@/components/animations';
import { MdArrowBack, MdSave } from 'react-icons/md';

interface Product {
  _id: string;
  name: string;
  reference: string;
  unit: string;
}

interface User {
  _id: string;
  username: string;
  role: string;
}

export default function EditOrderPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const { user, loading: authLoading, isAuthenticated, isAdmin, isManager } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    order_number: '',
    product_id: '',
    quantity: '',
    priority: 'medium',
    status: 'pending',
    assigned_to: '',
    deadline: '',
    notes: '',
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (!isAdmin && !isManager))) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, isAdmin, isManager, router]);

  useEffect(() => {
    if (isAuthenticated && (isAdmin || isManager) && orderId) {
      loadOrderData();
    }
  }, [isAuthenticated, isAdmin, isManager, orderId]);

  const loadOrderData = async () => {
    setLoadingData(true);
    try {
      // Load order, products, and users in parallel
      const [orderData, productsData, usersData] = await Promise.all([
        orderService.getOrderById(orderId),
        productService.getAllProducts(),
        userService.getAssignableUsers(),
      ]);

      setProducts(productsData || []);
      setUsers(usersData || []);

      // Pre-fill form with order data
      const priorityLabel = normalizePriority(orderData.priority);
      const deadlineDate = orderData.deadline ? new Date(orderData.deadline).toISOString().split('T')[0] : '';

      setFormData({
        order_number: orderData.order_number || '',
        product_id: orderData.product_id?._id || '',
        quantity: orderData.quantity?.toString() || '',
        priority: priorityLabel,
        status: orderData.status || 'pending',
        assigned_to: orderData.assigned_to?._id || '',
        deadline: deadlineDate,
        notes: orderData.notes || '',
      });
    } catch (err: any) {
      if (err.message?.includes('404') || err.message?.includes('not found')) {
        toast.error('Order not found');
        router.push('/orders');
      } else {
        toast.error(err.message || 'Failed to load order data');
      }
    } finally {
      setLoadingData(false);
    }
  };

  const normalizePriority = (priority: number | string): string => {
    if (typeof priority === 'number') {
      if (priority <= 1) return 'low';
      if (priority <= 3) return 'medium';
      return 'high';
    }
    const lowered = String(priority).toLowerCase();
    if (['low', 'medium', 'high'].includes(lowered)) return lowered;
    return 'medium';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.product_id) {
        throw new Error('Please select a product');
      }
      if (!formData.quantity || Number(formData.quantity) <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      if (!formData.deadline) {
        throw new Error('Deadline is required');
      }

      const priorityMap: { [key: string]: number } = {
        'low': 1,
        'medium': 3,
        'high': 5,
      };

      const updateData: any = {
        order_number: formData.order_number.trim() || undefined,
        product_id: formData.product_id,
        quantity: Number(formData.quantity),
        priority: priorityMap[formData.priority] || 3,
        status: formData.status,
        deadline: formData.deadline,
        notes: formData.notes.trim() || undefined,
      };

      // Only include assigned_to if it's changed
      if (formData.assigned_to) {
        updateData.assigned_to = formData.assigned_to;
      } else {
        updateData.assigned_to = null;
      }

      await orderService.updateOrder(orderId, updateData);
      toast.success('Order updated successfully!');
      router.push(`/orders/${orderId}`);
    } catch (err: any) {
      if (err.message?.includes('404')) {
        toast.error('Order not found');
        router.push('/orders');
      } else if (err.message?.includes('403') || err.message?.includes('denied')) {
        toast.error('Access denied. You do not have permission to edit this order.');
      } else if (err.message?.includes('Product not found')) {
        toast.error('Selected product no longer exists');
      } else if (err.message?.includes('Assigned user not found')) {
        toast.error('Selected user no longer exists');
      } else {
        toast.error(err.message || 'Failed to update order');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading order..." />
      </div>
    );
  }

  if (!isAuthenticated || (!isAdmin && !isManager)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <FadeIn direction="down" delay={0.05}>
          <div className="mb-6">
            <button
              onClick={() => router.push(`/orders/${orderId}`)}
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-2 font-semibold"
            >
              <MdArrowBack className="text-lg" />
              Back to Order Details
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Order</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Update order details and save changes</p>
          </div>
        </FadeIn>

        {/* Form */}
        <ScaleIn delay={0.15}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Order Number */}
              <div>
                <label htmlFor="order_number" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Order Number
                </label>
                <input
                  type="text"
                  id="order_number"
                  name="order_number"
                  value={formData.order_number}
                  onChange={handleChange}
                  placeholder="e.g., ORD-2024-001"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Product Selection */}
              <div>
                <label htmlFor="product_id" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Product <span className="text-red-500">*</span>
                </label>
                <select
                  id="product_id"
                  name="product_id"
                  value={formData.product_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name} ({product.reference})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="Enter quantity"
                  min="1"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Assigned To */}
              <div>
                <label htmlFor="assigned_to" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Assigned To
                </label>
                <select
                  id="assigned_to"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Deadline */}
              <div>
                <label htmlFor="deadline" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Add any additional notes or instructions..."
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <MdSave className="text-xl" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/orders/${orderId}`)}
                  disabled={loading}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </ScaleIn>
      </div>
    </div>
  );
}
