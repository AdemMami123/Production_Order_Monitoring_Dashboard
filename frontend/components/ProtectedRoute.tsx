'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * ProtectedRoute component
 * Wraps pages/components that require authentication or specific roles
 * 
 * @param children - Content to render if authorized
 * @param allowedRoles - Array of roles allowed to access (default: all authenticated users)
 * @param requireAuth - Whether authentication is required (default: true)
 * @param redirectTo - Where to redirect unauthorized users (default: /login)
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    // Check if authentication is required
    if (requireAuth && !user) {
      router.push(redirectTo);
      return;
    }

    // If no specific roles required, allow all authenticated users
    if (!allowedRoles || allowedRoles.length === 0) {
      setIsAuthorized(true);
      return;
    }

    // Check if user has required role
    if (user && allowedRoles.includes(user.role)) {
      setIsAuthorized(true);
      return;
    }

    // User doesn't have required role, redirect to dashboard
    router.push('/dashboard');
  }, [user, loading, allowedRoles, requireAuth, redirectTo, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!isAuthorized) {
    return null;
  }

  // User is authorized, render children
  return <>{children}</>;
}

/**
 * Convenience wrapper for admin-only routes
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>;
}

/**
 * Convenience wrapper for admin and manager routes
 */
export function ManagerRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['admin', 'manager']}>{children}</ProtectedRoute>;
}

/**
 * Convenience wrapper for all authenticated users
 */
export function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
