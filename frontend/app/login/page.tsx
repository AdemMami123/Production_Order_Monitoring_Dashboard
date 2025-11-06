'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { FadeIn, SlideIn, ScaleIn } from '@/components/animations';
import { motion } from 'framer-motion';
import { MdLogin, MdInventory, MdPerson, MdLock, MdArrowForward, MdSecurity } from 'react-icons/md';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center animated-gradient py-8 px-4 sm:px-6 lg:px-8">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Header */}
        <FadeIn direction="down" delay={0.1}>
          <div className="text-center">
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary shadow-2xl mb-4"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <MdInventory className="text-4xl text-white" />
            </motion.div>
            <h2 className="text-4xl font-extrabold text-white mb-2">
              Production Hub
            </h2>
            <p className="text-white/80 text-lg">
              Welcome back! Sign in to continue
            </p>
          </div>
        </FadeIn>

        {/* Login Card */}
        <ScaleIn delay={0.2}>
          <div className=" rounded-2xl shadow-2xl p-8 space-y-6">
            {/* Error Message */}
            {error && (
              <ErrorMessage 
                message={error} 
                onDismiss={() => setError('')}
                variant="error" 
              />
            )}

            {/* Login Form */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Username Field */}
              <div>
                <label 
                  htmlFor="username" 
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
                >
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MdPerson className="h-5 w-5 text-gray-400" />
                  </div>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MdLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-lg text-base font-semibold text-white gradient-primary hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <MdLogin className="text-xl" />
                    Sign In
                    <MdArrowForward className="text-xl" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                  New to Production Hub?
                </span>
              </div>
            </div>

            {/* Register Link */}
            <Link href="/register">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="block w-full text-center py-3 px-4 rounded-xl border-2 border-blue-500 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
              >
                Create New Account
              </motion.div>
            </Link>
          </div>
        </ScaleIn>

        {/* Test Credentials */}
        <SlideIn direction="up" delay={0.4}>
          <div className=" rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              <MdSecurity className="text-lg text-blue-500" />
              Test Credentials
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {[
                { role: 'Admin', username: 'admin', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                { role: 'Manager', username: 'manager1', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                { role: 'Worker', username: 'worker1', bg: 'bg-green-50 dark:bg-green-900/20' },
              ].map((cred) => (
                <motion.div
                  key={cred.role}
                  whileHover={{ scale: 1.05 }}
                  className={`${cred.bg} rounded-lg p-2 space-y-1`}
                >
                  <p className="font-semibold text-gray-700 dark:text-gray-200">{cred.role}</p>
                  <p className="font-mono text-gray-600 dark:text-gray-400">{cred.username}</p>
                  <p className="font-mono text-gray-600 dark:text-gray-400">Password123!</p>
                </motion.div>
              ))}
            </div>
          </div>
        </SlideIn>
      </div>
    </div>
  );
}
