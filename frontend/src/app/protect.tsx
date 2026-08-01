'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * Protect wrapper — ensures user is authenticated before rendering children.
 * If not authenticated, redirects to login page.
 */
export default function Protect({ children }: { children: React.ReactNode }) {
  const { user, getUser, loading } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const userData = await getUser();

        if (!mounted) return;

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
        if (!mounted) return;
        console.error('Authentication check failed:', error);
        router.push('/login');
      } finally {
        if (mounted) {
          setAuthChecked(true);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [getUser, router]);

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // If still no user after auth check, redirect to login (but don't render)
  if (!user) {
    return null;
  }

  return <>{children}</>;
}