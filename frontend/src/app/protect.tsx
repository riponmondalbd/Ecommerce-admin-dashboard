'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * Protect wrapper — ensures user is authenticated before rendering children.
 * If not authenticated, redirects to login page.
 */
export default function Protect({ children }: { children: React.ReactNode }) {
  const { user, getUser, refreshAccessToken } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  // Check authentication on mount and keep track
  useEffect(() => {
    const checkAuth = async () => {
      // Try to get user first (may trigger refresh)
      try {
        const userData = await getUser();

        // If we got user data but it's null or no user, redirect
        if (!userData) {
          router.push('/login');
          return;
        }

        // Ensure user has permissions data (from /me endpoint)
        if (!userData.permissions) {
          console.warn('User missing permissions data');
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [user, getUser, router, pathname]);

  // If loading or not authenticated, show loading or redirect
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
