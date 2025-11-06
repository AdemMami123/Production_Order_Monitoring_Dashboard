 'use client';

 import { useEffect, useState } from 'react';
 import { useRouter } from 'next/navigation';
 import { useAuth } from '@/contexts/AuthContext';
 import orderService from '@/lib/orderService';
 import productService from '@/lib/productService';
 import LoadingSpinner from '@/components/LoadingSpinner';
 import ErrorMessage from '@/components/ErrorMessage';
 import { FadeIn, ScaleIn } from '@/components/animations';
 import { MdArrowBack, MdInventory } from 'react-icons/md';

 interface Product {
   _id: string;
   name: string;
   reference: string;
   unit: string;
 }

 export default function NewOrderPage() {
   const { user, loading: authLoading, isAuthenticated, isAdmin, isManager } = useAuth();
   const router = useRouter();

   const [products, setProducts] = useState<Product[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');
   const [loadingProducts, setLoadingProducts] = useState(true);

   const [formData, setFormData] = useState({
     order_number: '',
     product_id: '',
     quantity: '',
     priority: 'medium',
     deadline: '',
     notes: '',
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
     try {
       const data = await productService.getAllProducts();
       setProducts(data || []);
     } catch (err: any) {
       setError('Failed to load products');
     } finally {
       setLoadingProducts(false);
     }
   };

   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
     setFormData({
       ...formData,
       [e.target.name]: e.target.value,
     });
   };

   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setError('');
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

       const orderData = {
         ...(formData.order_number.trim() ? { order_number: formData.order_number.trim() } : {}),
         product_id: formData.product_id,
         quantity: Number(formData.quantity),
         priority: priorityMap[formData.priority] || 3,
         deadline: formData.deadline,
         notes: formData.notes.trim() || undefined,
       };

       const newOrder = await orderService.createOrder(orderData);
       router.push(`/orders/${newOrder._id}`);
     } catch (err: any) {
       setError(err.message || 'Failed to create order');
     } finally {
       setLoading(false);
     }
   };

   if (authLoading || loadingProducts) {
     return (
       <div className="flex justify-center items-center min-h-screen">
         <LoadingSpinner size="lg" text="Loading…" />
       </div>
     );
   }

   if (!isAuthenticated || (!isAdmin && !isManager)) {
     return null;
   }

   return (
     <div className="container mx-auto px-4 py-8 max-w-2xl">
       {/* Header */}
       <FadeIn direction="down" delay={0.05}>
         <div className="mb-6">
           <button
             onClick={() => router.push('/orders')}
             className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-2"
           >
             <MdArrowBack className="text-lg" />
             Back to Orders
           </button>
           <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create New Order</h1>
           <p className="text-gray-600 dark:text-gray-400 mt-1">Fill in the details to create a production order</p>
         </div>
       </FadeIn>

       {/* Form */}
       <ScaleIn delay={0.15}>
         <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
           {error && (
             <div className="mb-6">
               <ErrorMessage message={error} onDismiss={() => setError('')} />
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-6">
             {/* Order Number */}
             <div>
               <label htmlFor="order_number" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                 Order Number <span className="text-gray-500 text-sm">(optional — leave blank to auto-generate)</span>
               </label>
               <input
                 type="text"
                 id="order_number"
                 name="order_number"
                 value={formData.order_number}
                 onChange={handleChange}
                 placeholder="e.g., ORD-2024-001"
                 className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
               />
             </div>

             {/* Product Selection */}
             <div>
               <label htmlFor="product_id" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                 Product <span className="text-red-500">*</span>
               </label>
               <select
                 id="product_id"
                 name="product_id"
                 value={formData.product_id}
                 onChange={handleChange}
                 required
                 className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
               <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
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
                 className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
               />
             </div>

             {/* Priority */}
             <div>
               <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                 Priority
               </label>
               <select
                 id="priority"
                 name="priority"
                 value={formData.priority}
                 onChange={handleChange}
                 className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
               >
                 <option value="low">Low</option>
                 <option value="medium">Medium</option>
                 <option value="high">High</option>
               </select>
             </div>

             {/* Deadline */}
             <div>
               <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                 Deadline <span className="text-red-500">*</span>
               </label>
               <input
                 type="date"
                 id="deadline"
                 name="deadline"
                 value={formData.deadline}
                 onChange={handleChange}
                 required
                 className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
               />
             </div>

             {/* Notes */}
             <div>
               <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                 Notes
               </label>
               <textarea
                 id="notes"
                 name="notes"
                 value={formData.notes}
                 onChange={handleChange}
                 rows={4}
                 placeholder="Add any additional notes or instructions..."
                 className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
               />
             </div>

             {/* Submit Button */}
             <div className="flex gap-3">
               <button
                 type="submit"
                 disabled={loading}
                 className="flex-1 gradient-primary text-white font-medium py-2 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-2xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
               >
                 {loading ? (
                   <>
                     <LoadingSpinner size="sm" />
                     <span className="ml-2">Creating...</span>
                   </>
                 ) : (
                   <>
                     <MdInventory className="text-lg" />
                     Create Order
                   </>
                 )}
               </button>
               <button
                 type="button"
                 onClick={() => router.push('/orders')}
                 className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
               >
                 Cancel
               </button>
             </div>
           </form>
         </div>
       </ScaleIn>
     </div>
   );
 }
