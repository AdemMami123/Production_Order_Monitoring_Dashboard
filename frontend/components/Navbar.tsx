'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdDashboard,
  MdShoppingCart,
  MdInventory,
  MdPeople,
  MdLogout,
  MdMenu,
  MdClose,
} from 'react-icons/md';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      roles: ['admin', 'manager', 'worker'],
      icon: MdDashboard,
    },
    {
      name: 'Orders',
      href: '/orders',
      roles: ['admin', 'manager', 'worker'],
      icon: MdShoppingCart,
    },
    {
      name: 'Products',
      href: '/products',
      roles: ['admin', 'manager'],
      icon: MdInventory,
    },
    {
      name: 'Users',
      href: '/users',
      roles: ['admin'],
      icon: MdPeople,
    },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  if (!user) return null;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'manager':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'worker':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      // CHANGED: Replaced 'glass' with solid, high-contrast background and shadow
      className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex justify-between h-13">
          {/* Logo & Desktop Navigation */}
          <div className="flex">
            {/* Logo */}
            <motion.div
              className="flex-shrink-0 flex items-center"
              whileHover={{ scale: 1.02 }}
            >
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <MdInventory className="text-white text-xl" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Production Hub
                </h1>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link key={item.name} href={item.href}>
                    <motion.div
                      className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : // CHANGED: Improved contrast for inactive/hover states
                            'text-gray-700 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="text-lg" />
                      {item.name}

                      {/* Active Indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 rounded-lg -z-10"
                          transition={{
                            type: 'spring',
                            bounce: 0.2,
                            duration: 0.6,
                          }}
                        />
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ADDED: Wrapper for right-side elements to fix justify-between */}
          <div className="flex items-center">
            {/* Desktop User Menu */}
            <div className="hidden md:ml-6 md:flex md:items-center md:gap-4">
              {/* User Info */}
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {user.username}
                  </p>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                </div>

                {/* Logout Button */}
                <motion.button
                  onClick={handleLogout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
                >
                  <MdLogout />
                  Logout
                </motion.button>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                whileTap={{ scale: 0.9 }}
                // CHANGED: Darker icon color for better visibility
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <MdClose className="h-6 w-6" />
                ) : (
                  <MdMenu className="h-6 w-6" />
                )}
              </motion.button>
            </div>
          </div>
          {/* ADDED: End of right-side wrapper */}
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            // CHANGED: Ensured mobile menu bg matches new navbar bg
            className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
          >
            {/* Mobile Navigation Links */}
            <div className="px-4 pt-2 pb-3 space-y-1">
              {filteredNavigation.map((item, index) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          // CHANGED: Darker text for better contrast
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="text-xl" />
                      {item.name}
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Mobile User Info */}
            <motion.div
              className="px-4 py-4 border-t border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
                    {user.username}
                  </p>
                  <span
                    className={`inline-block text-xs font-medium px-2 py-1 rounded-full mt-1 ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>

              <motion.button
                onClick={handleLogout}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2 w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg text-base font-medium shadow-md transition-colors"
              >
                <MdLogout />
                Logout
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}