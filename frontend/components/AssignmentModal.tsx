'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdPerson, MdCheck } from 'react-icons/md';
import userService, { User } from '@/lib/userService';
import orderService from '@/lib/orderService';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  currentAssignee?: {
    _id: string;
    username: string;
    email: string;
  } | null;
  onSuccess: () => void;
}

export default function AssignmentModal({
  isOpen,
  onClose,
  orderId,
  currentAssignee,
  onSuccess,
}: AssignmentModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(currentAssignee?._id || null);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setSelectedUserId(currentAssignee?._id || null);
      setNotes('');
      setError('');
    }
  }, [isOpen, currentAssignee]);

  const fetchUsers = async () => {
    setFetchingUsers(true);
    setError('');
    try {
      const assignableUsers = await userService.getAssignableUsers();
      setUsers(assignableUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleAssign = async () => {
    if (selectedUserId === currentAssignee?._id && !notes) {
      onClose();
      return;
    }

    setLoading(true);
    setError('');
    try {
      await orderService.assignOrder(orderId, selectedUserId, notes || undefined);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign order');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    setLoading(true);
    setError('');
    try {
      await orderService.assignOrder(orderId, null, notes || 'Order unassigned');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to unassign order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <MdPerson className="text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Assign Order</h2>
            </div>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MdClose className="text-xl text-gray-500 dark:text-gray-400" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Current Assignment */}
            {currentAssignee && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                  Currently Assigned To
                </label>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {currentAssignee.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{currentAssignee.email}</p>
              </div>
            )}

            {/* User Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Assign To
              </label>
              {fetchingUsers ? (
                <div className="p-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading users...</p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-300 dark:border-gray-600 rounded-xl p-2">
                  {users.map((user) => (
                    <motion.button
                      key={user._id}
                      onClick={() => setSelectedUserId(user._id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-3 rounded-lg border-2 transition-all flex items-center justify-between ${
                        selectedUserId === user._id
                          ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          user.role === 'manager' 
                            ? 'bg-purple-100 dark:bg-purple-900/30' 
                            : 'bg-green-100 dark:bg-green-900/30'
                        }`}>
                          <MdPerson className={`text-lg ${
                            user.role === 'manager'
                              ? 'text-purple-600 dark:text-purple-400'
                              : 'text-green-600 dark:text-green-400'
                          }`} />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {user.username}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </p>
                        </div>
                      </div>
                      {selectedUserId === user._id && (
                        <MdCheck className="text-xl text-blue-600 dark:text-blue-400" />
                      )}
                    </motion.button>
                  ))}
                  {users.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      No assignable users found
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add assignment notes..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            {currentAssignee && (
              <motion.button
                onClick={handleUnassign}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Unassigning...' : 'Unassign'}
              </motion.button>
            )}
            <motion.button
              onClick={handleAssign}
              disabled={loading || !selectedUserId}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Assigning...' : selectedUserId === currentAssignee?._id ? 'Update Notes' : 'Assign Order'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
