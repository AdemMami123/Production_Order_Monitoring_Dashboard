'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { FadeIn, ScaleIn, StaggerChildren } from '@/components/animations';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdAddCircle,
  MdPeople,
  MdEmail,
  MdPerson,
  MdLock,
  MdCheckCircle,
  MdCancel,
  MdClose,
  MdToggleOn,
  MdToggleOff,
  MdAdminPanelSettings,
  MdSupervisorAccount,
  MdEngineering
} from 'react-icons/md';

interface User {
  _id?: string;
  id?: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'worker';
  is_active: boolean;
  createdAt?: string;
  created_at?: string;
}

export default function UsersPage() {
  const { user, loading: authLoading, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'worker' as 'admin' | 'manager' | 'worker',
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchUsers();
    }
    // eslint-disable-next-line
  }, [isAuthenticated, isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/users');
      const data = response.data.data || response.data;
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/auth/register', formData);
      setShowCreateModal(false);
      setFormData({ username: '', email: '', password: '', role: 'worker' });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create user');
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/users/${userId}`, { is_active: !currentStatus });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user status');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700';
      case 'manager':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700';
      case 'worker':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700';
      default:
        return 'bg-gray-100 dark:bg-gray-700/30 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-600';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setFormData({ username: '', email: '', password: '', role: 'worker' });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return MdAdminPanelSettings;
      case 'manager':
        return MdSupervisorAccount;
      case 'worker':
        return MdEngineering;
      default:
        return MdPerson;
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading users" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
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
                <MdPeople className="text-purple-500" />
                Users
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                Manage team members and access
              </p>
            </div>
            <motion.button
              onClick={() => setShowCreateModal(true)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <MdAddCircle className="text-xl" />
              Add User
            </motion.button>
          </div>
        </FadeIn>

        {/* Users Table */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" text="Loading users" />
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchUsers} />
        ) : users.length === 0 ? (
          <ScaleIn delay={0.2}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-16 text-center border border-gray-200 dark:border-gray-700">
              <MdPeople className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No users found</p>
            </div>
          </ScaleIn>
        ) : (
          <ScaleIn delay={0.2}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800 dark:bg-gray-900">
                    <tr>
                      {['User', 'Email', 'Role', 'Status', 'Created', 'Actions'].map((header) => (
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
                    <StaggerChildren staggerDelay={0.03}>
                      {users.map((u) => {
                        const RoleIcon = getRoleIcon(u.role);
                        const isCurrentUser = u._id === user?._id || u.id === user?.id;

                        return (
                          <motion.tr
                            key={u._id || u.id}
                            variants={{
                              hidden: { opacity: 0, x: -20 },
                              visible: { opacity: 1, x: 0 },
                            }}
                            className="hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRoleBadgeColor(u.role)}`}>
                                  <MdPerson className="text-xl" />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                    {u.username}
                                    {isCurrentUser && (
                                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-200">
                                <MdEmail className="text-gray-500 dark:text-gray-400" />
                                {u.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`flex items-center gap-2 w-fit px-3 py-1.5 text-xs font-bold rounded-full ${getRoleBadgeColor(u.role)}`}>
                                <RoleIcon />
                                {u.role.toUpperCase()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div
                                className={`flex items-center gap-1 w-fit px-3 py-1.5 text-xs font-bold rounded-full ${
                                  u.is_active
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}
                              >
                                {u.is_active ? <MdCheckCircle /> : <MdCancel />}
                                {u.is_active ? 'Active' : 'Inactive'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                              {formatDate(u.createdAt || u.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <motion.button
                                onClick={() => handleToggleActive(u._id || u.id || '', u.is_active)}
                                disabled={isCurrentUser}
                                whileHover={!isCurrentUser ? { scale: 1.05 } : {}}
                                whileTap={!isCurrentUser ? { scale: 0.95 } : {}}
                                className={`flex items-center gap-1 px-3 py-2 rounded-lg font-semibold transition-colors ${
                                  isCurrentUser
                                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                    : u.is_active
                                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                                }`}
                              >
                                {u.is_active ? <MdToggleOff /> : <MdToggleOn />}
                                {u.is_active ? 'Deactivate' : 'Activate'}
                              </motion.button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </StaggerChildren>
                  </tbody>
                </table>
              </div>
            </div>
          </ScaleIn>
        )}

        {/* Create Modal */}
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
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Create New User</h2>
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
                    <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                      <MdPerson className="text-gray-400" />
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      minLength={3}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                      <MdEmail className="text-gray-400" />
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                      <MdLock className="text-gray-400" />
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Must be at least 8 characters with uppercase, lowercase, and number
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="role" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    >
                      <option value="worker">Worker</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all"
                    >
                      Create User
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
