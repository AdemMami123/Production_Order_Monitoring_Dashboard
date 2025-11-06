import React from 'react';
import { useAuth } from '../contexts/AuthContext';


/**
 * Permission definitions for each role
 */
const PERMISSIONS = {
  admin: {
    users: { create: true, read: true, update: true, delete: true, manageRoles: true },
    products: { create: true, read: true, update: true, delete: true, deactivate: true },
    orders: { create: true, read: true, update: true, delete: true, assign: true, block: true },
    analytics: { view: true, export: true },
  },
  manager: {
    users: { create: false, read: false, update: false, delete: false, manageRoles: false },
    products: { create: true, read: true, update: true, delete: false, deactivate: true },
    orders: { create: true, read: true, update: true, delete: true, assign: true, block: true },
    analytics: { view: true, export: true },
  },
  worker: {
    users: { create: false, read: false, update: false, delete: false, manageRoles: false },
    products: { create: false, read: true, update: false, delete: false, deactivate: false },
    orders: { create: false, read: true, update: true, delete: false, assign: false, block: false },
    analytics: { view: false, export: false },
  },
};

/**
 * Hook to check user permissions
 * @returns {Object} Permission checker functions
 */
export function usePermissions() {
  const { user } = useAuth();

  /**
   * Check if user has specific permission
   * @param {string} resource - Resource type (users, products, orders, analytics)
   * @param {string} action - Action type (create, read, update, delete, etc.)
   * @returns {boolean} Whether user has permission
   */
  const hasPermission = (resource: string, action: string): boolean => {
    if (!user || !user.role) return false;
    
    const rolePermissions = PERMISSIONS[user.role as keyof typeof PERMISSIONS];
    if (!rolePermissions) return false;

    const resourcePermissions = rolePermissions[resource as keyof typeof rolePermissions];
    if (!resourcePermissions) return false;

    return resourcePermissions[action as keyof typeof resourcePermissions] || false;
  };

  /**
   * Check if user can create resources
   */
  const canCreate = (resource: string) => hasPermission(resource, 'create');

  /**
   * Check if user can read resources
   */
  const canRead = (resource: string) => hasPermission(resource, 'read');

  /**
   * Check if user can update resources
   */
  const canUpdate = (resource: string) => hasPermission(resource, 'update');

  /**
   * Check if user can delete resources
   */
  const canDelete = (resource: string) => hasPermission(resource, 'delete');

  /**
   * Check if user is admin
   */
  const isAdmin = user?.role === 'admin';

  /**
   * Check if user is manager
   */
  const isManager = user?.role === 'manager';

  /**
   * Check if user is worker
   */
  const isWorker = user?.role === 'worker';

  /**
   * Check if user is admin or manager
   */
  const isAdminOrManager = isAdmin || isManager;

  /**
   * Check if user can view analytics
   */
  const canViewAnalytics = hasPermission('analytics', 'view');

  /**
   * Check if user can assign orders
   */
  const canAssignOrders = hasPermission('orders', 'assign');

  /**
   * Check if user can block orders
   */
  const canBlockOrders = hasPermission('orders', 'block');

  /**
   * Check if user can manage users
   */
  const canManageUsers = hasPermission('users', 'create') && hasPermission('users', 'delete');

  /**
   * Check if user can manage products
   */
  const canManageProducts = hasPermission('products', 'create') && hasPermission('products', 'update');

  /**
   * Check if user can view all orders (or only assigned)
   */
  const canViewAllOrders = isAdmin || isManager;

  return {
    hasPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    isAdmin,
    isManager,
    isWorker,
    isAdminOrManager,
    canViewAnalytics,
    canAssignOrders,
    canBlockOrders,
    canManageUsers,
    canManageProducts,
    canViewAllOrders,
  };
}

/**
 * Component wrapper for permission-based rendering
 */
interface PermissionGuardProps {
  resource: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ resource, action, children, fallback = null }: PermissionGuardProps): React.ReactElement | null {
  const { hasPermission } = usePermissions();

  if (!hasPermission(resource, action)) {
    return fallback as React.ReactElement | null;
  }

  return children as React.ReactElement;
}

/**
 * Higher-order component for role-based access
 */
export function withRoleAccess(allowedRoles: string[]) {
  return function <P extends object>(Component: React.ComponentType<P>) {
    const RoleAccessComponent: React.FC<P> = (props: P) => {
      const { user } = useAuth();

      if (!user || !allowedRoles.includes(user.role)) {
        return null;
      }

      return <Component {...props} />;
    };
    
    RoleAccessComponent.displayName = `withRoleAccess(${Component.displayName || Component.name || 'Component'})`;
    return RoleAccessComponent;
  };
}

/**
 * Utility to get role display name
 */
export function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    admin: 'Administrator',
    manager: 'Production Manager',
    worker: 'Production Worker',
  };

  return roleNames[role] || role;
}

/**
 * Utility to get role badge color
 */
export function getRoleBadgeColor(role: string): string {
  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700',
    manager: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700',
    worker: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700',
  };

  return roleColors[role] || 'bg-gray-100 dark:bg-gray-700/30 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-600';
}
