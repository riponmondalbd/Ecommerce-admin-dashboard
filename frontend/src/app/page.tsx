'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * Root redirect component - redirects to login or dashboard based on auth state
 */
export default function Page() {
  const { user, getUser } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  // Fetch user data on mount
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const userData = await getUser();

        if (!isMounted) return;

        // If user is authenticated
        if (userData) {
          // At root - redirect to dashboard
          if ((pathname === '/' || pathname === '' || pathname === undefined)) {
            router.replace('/dashboard');
          }
        } else {
          // Not authenticated - at root, redirect to login
          if ((pathname === '/' || pathname === '' || pathname === undefined)) {
            setTimeout(() => {
              if (isMounted) router.replace('/login');
            }, 500);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (isMounted && (pathname === '/' || pathname === '' || pathname === undefined)) {
          router.replace('/login');
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, getUser, router]);

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
