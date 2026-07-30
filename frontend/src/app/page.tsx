'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * Root redirect component - redirects to login or dashboard based on auth state
 */
export default function RedirectPage() {
  const { user, getUser } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  // Fetch user data on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getUser();

        // If user is already authenticated and not on dashboard/login
        if (userData) {
          // If on root path, redirect to dashboard
          if (pathname === '/' || pathname === '') {
            router.push('/dashboard');
          }
        } else {
          // If no user and not on login, redirect to login
          if (pathname !== '/login') {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [user, getUser, pathname, router]);

  // Show loading screen while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
