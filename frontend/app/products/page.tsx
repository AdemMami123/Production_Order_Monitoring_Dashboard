'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import productService from '@/lib/productService';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { FadeIn, ScaleIn, StaggerChildren } from '@/components/animations';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdAddCircle, 
  MdEdit, 
  MdDelete, 
  MdToggleOn, 
  MdToggleOff,
  MdInventory,
  MdViewModule,
  MdViewList,
  MdClose,
  MdCheckCircle,
  MdCancel
} from 'react-icons/md';

interface Product {
  _id: string;
  name: string;
  reference: string;
  description?: string;
  unit: string;
  is_active: boolean;
  createdAt: string;
}

export default function ProductsPage() {
  const { user, loading: authLoading, isAuthenticated, isAdmin, isManager } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [formData, setFormData] = useState({
    name: '',
    reference: '',
    description: '',
    unit: 'pcs',
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (!isAdmin && !isManager))) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, isAdmin, isManager, router]);

  useEffect(() => {
    if (isAuthenticated && (isAdmin || isManager)) {
      fetchProducts();
    }
  }, [isAuthenticated, isAdmin, isManager]);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct._id, formData);
      } else {
        await productService.createProduct(formData);
      }
      
      setShowCreateModal(false);
      setEditingProduct(null);
      setFormData({ name: '', reference: '', description: '', unit: 'pcs' });
      fetchProducts();
    } catch (err: any) {
      setError(err.message || `Failed to ${editingProduct ? 'update' : 'create'} product`);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      reference: product.reference,
      description: product.description || '',
      unit: product.unit,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await productService.deleteProduct(id);
      fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      if (product.is_active) {
        await productService.deactivateProduct(product._id);
      } else {
        // Reactivate by updating with is_active true
        await productService.updateProduct(product._id, { is_active: true } as any);
      }
      fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Failed to update product status');
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingProduct(null);
    setFormData({ name: '', reference: '', description: '', unit: 'pcs' });
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading products" />
      </div>
    );
  }

  if (!isAuthenticated || (!isAdmin && !isManager)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <FadeIn direction="down">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                <MdInventory className="text-green-500" />
                Products
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                Manage your product catalog
              </p>
            </div>
            <div className="flex gap-3">
              {/* View Toggle */}
              <div className="flex bg-white dark:bg-gray-800 rounded-xl shadow-md p-1 border border-gray-200 dark:border-gray-700">
                <motion.button
                  onClick={() => setViewMode('grid')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <MdViewModule className="text-xl" />
                </motion.button>
                <motion.button
                  onClick={() => setViewMode('list')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <MdViewList className="text-xl" />
                </motion.button>
              </div>
              <motion.button
                onClick={() => setShowCreateModal(true)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <MdAddCircle className="text-xl" />
                Add Product
              </motion.button>
            </div>
          </div>
        </FadeIn>

        {/* Products Display */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" text="Loading products" />
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchProducts} />
        ) : products.length === 0 ? (
          <ScaleIn delay={0.2}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-16 text-center border border-gray-200 dark:border-gray-700">
              <MdInventory className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No products found</p>
              <p className="text-gray-500 dark:text-gray-400">Create your first product to get started</p>
            </div>
          </ScaleIn>
        ) : viewMode === 'grid' ? (
          <StaggerChildren staggerDelay={0.05}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <motion.div
                  key={product._id}
                  variants={{
                    hidden: { opacity: 0, scale: 0.9 },
                    visible: { opacity: 1, scale: 1 },
                  }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-all ${
                    !product.is_active ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{product.name}</h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-mono">{product.reference}</p>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full ${
                        product.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {product.is_active ? <MdCheckCircle /> : <MdCancel />}
                      {product.is_active ? 'Active' : 'Inactive'}
                    </motion.div>
                  </div>

                  {product.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{product.description}</p>
                  )}

                  <div className="mb-4 flex items-center gap-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Unit:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg">
                      {product.unit}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => handleEdit(product)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <MdEdit />
                      Edit
                    </motion.button>
                    <motion.button
                      onClick={() => handleToggleActive(product)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        product.is_active
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                          : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                      }`}
                    >
                      {product.is_active ? <MdToggleOff /> : <MdToggleOn />}
                      {product.is_active ? 'Deactivate' : 'Activate'}
                    </motion.button>
                    <motion.button
                      onClick={() => handleDelete(product._id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <MdDelete />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </StaggerChildren>
        ) : (
          <ScaleIn delay={0.2}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800 dark:bg-gray-900">
                    <tr>
                      {['Product Name', 'Reference', 'Unit', 'Description', 'Status', 'Actions'].map((header) => (
                        <th
                          key={header}
                          className="px-6 py-4 text-left text-xs font-bold text-gray-100 dark:text-gray-200 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {products.map((product, index) => (
                      <motion.tr
                        key={product._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`hover:bg-green-50 dark:hover:bg-gray-700 transition-colors ${
                          !product.is_active ? 'opacity-60' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{product.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{product.reference}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
                            {product.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {product.description || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`flex items-center gap-1 w-fit px-3 py-1.5 text-xs font-bold rounded-full ${
                              product.is_active
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {product.is_active ? <MdCheckCircle /> : <MdCancel />}
                            {product.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <motion.button
                              onClick={() => handleEdit(product)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            >
                              <MdEdit className="text-lg" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleToggleActive(product)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className={`p-2 rounded-lg transition-colors ${
                                product.is_active
                                  ? 'text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                                  : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                              }`}
                            >
                              {product.is_active ? <MdToggleOff className="text-lg" /> : <MdToggleOn className="text-lg" />}
                            </motion.button>
                            <motion.button
                              onClick={() => handleDelete(product._id)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <MdDelete className="text-lg" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScaleIn>
        )}

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={closeModal}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {editingProduct ? 'Edit Product' : 'Create New Product'}
                  </h2>
                  <motion.button
                    onClick={closeModal}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <MdClose className="text-2xl" />
                  </motion.button>
                </div>

                {error && (
                  <div className="mb-4">
                    <ErrorMessage message={error} onDismiss={() => setError('')} />
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="reference" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Reference Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="reference"
                      name="reference"
                      value={formData.reference}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="unit" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="unit"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    >
                      <option value="pcs">Pieces (pcs)</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="m">Meters (m)</option>
                      <option value="m2">Square Meters (m²)</option>
                      <option value="l">Liters (l)</option>
                      <option value="box">Box</option>
                      <option value="roll">Roll</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all"
                    >
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={closeModal}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold transition-all"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
